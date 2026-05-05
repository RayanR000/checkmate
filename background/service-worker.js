let offscreenReady = false;
let pendingAnalysis = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Checkmate SW] installed');
});

async function ensureOffscreen() {
    if (offscreenReady) return;
    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen/offscreen.html'),
            reasons: ['WORKERS'],
            justification: 'Run Stockfish WASM chess engine',
        });
        console.log('[Checkmate SW] offscreen document created, waiting for ready signal');
        // offscreen.js sends 'offscreen_ready' when loaded — handled in onMessage below.
    } catch (e) {
        if (e.message?.includes('single offscreen document')) {
            // Offscreen already exists (SW restarted). It's already running — send directly.
            console.log('[Checkmate SW] offscreen already exists, sending analysis directly');
            offscreenReady = true;
            dispatchPending();
        } else {
            console.error('[Checkmate SW] offscreen create failed:', e.message);
        }
    }
}

function dispatchPending() {
    if (pendingAnalysis && offscreenReady) {
        const { fen, tabId } = pendingAnalysis;
        pendingAnalysis = null;
        console.log('[Checkmate SW] dispatching queued analysis to offscreen, tab:', tabId);
        chrome.runtime.sendMessage({ action: 'sf_analyze', fen, tabId }).catch((e) => {
            console.error('[Checkmate SW] sendMessage to offscreen failed:', e.message);
        });
    }
}

chrome.runtime.onMessage.addListener((request, sender) => {
    console.log('[Checkmate SW] message:', request.action, 'from tab:', sender.tab?.id);

    if (request.action === 'offscreen_ready') {
        offscreenReady = true;
        console.log('[Checkmate SW] offscreen ready');
        dispatchPending();

    } else if (request.action === 'analyze') {
        const tabId = sender.tab?.id;
        if (offscreenReady) {
            console.log('[Checkmate SW] forwarding FEN to offscreen, tab:', tabId);
            chrome.runtime.sendMessage({ action: 'sf_analyze', fen: request.fen, tabId }).catch((e) => {
                console.error('[Checkmate SW] sendMessage to offscreen failed:', e.message);
            });
        } else {
            console.log('[Checkmate SW] offscreen not ready yet, queuing analysis');
            pendingAnalysis = { fen: request.fen, tabId };
            ensureOffscreen();
        }
    }
});
