let offscreenReady = false;
let pendingAnalysis = null;
let lastTabId = null;

function statusToTab(text) {
    if (lastTabId) chrome.tabs.sendMessage(lastTabId, { action: 'status', text }).catch(() => {});
}

async function ensureOffscreen() {
    if (offscreenReady) return;
    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen/offscreen.html'),
            reasons: ['WORKERS'],
            justification: 'Run Stockfish WASM chess engine',
        });
        console.log('[Checkmate SW] offscreen created, waiting for ready signal');
        statusToTab('SW:created offscreen');
    } catch (e) {
        if (e.message?.includes('single offscreen document')) {
            // SW restarted but offscreen doc still alive — mark ready and dispatch.
            console.log('[Checkmate SW] offscreen already exists (SW restart), sending directly');
            offscreenReady = true;
            dispatchPending();
        } else {
            console.error('[Checkmate SW] offscreen create FAILED:', e.message);
            statusToTab('ERR:offscreen ' + e.message.slice(0, 30));
        }
    }
}

function dispatchPending() {
    if (pendingAnalysis && offscreenReady) {
        const { fen, tabId } = pendingAnalysis;
        pendingAnalysis = null;
        console.log('[Checkmate SW] dispatching to offscreen, tab:', tabId);
        chrome.runtime.sendMessage({ action: 'sf_analyze', fen, tabId }).catch((e) => {
            console.error('[Checkmate SW] sendMessage to offscreen failed:', e.message);
            chrome.tabs.sendMessage(tabId, { action: 'status', text: 'ERR:offmsg' }).catch(() => {});
        });
    }
}

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === 'offscreen_ready') {
        offscreenReady = true;
        console.log('[Checkmate SW] offscreen ready');
        statusToTab('SW:offscreen ready');
        dispatchPending();

    } else if (request.action === 'analyze') {
        lastTabId = sender.tab?.id;
        console.log('[Checkmate SW] analyze from tab', lastTabId, 'FEN:', request.fen);
        if (offscreenReady) {
            chrome.runtime.sendMessage({ action: 'sf_analyze', fen: request.fen, tabId: lastTabId }).catch((e) => {
                console.error('[Checkmate SW] sendMessage to offscreen failed:', e.message);
                statusToTab('ERR:offmsg ' + e.message.slice(0, 20));
            });
        } else {
            pendingAnalysis = { fen: request.fen, tabId: lastTabId };
            ensureOffscreen();
        }
    }
});
