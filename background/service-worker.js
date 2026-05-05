let offscreenPort = null;
let lastTabId = null;
let pendingAnalysis = null;

function statusToTab(text) {
    console.log('[Checkmate SW] status:', text, 'tab:', lastTabId);
    if (lastTabId) {
        chrome.tabs.sendMessage(lastTabId, { action: 'status', text }).catch(() => {});
    }
}

// Offscreen connects to us via port when it loads (or reconnects after SW sleep).
chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'offscreen') return;
    offscreenPort = port;
    console.log('[Checkmate SW] offscreen port connected');

    port.onMessage.addListener((msg) => {
        if (msg.action === 'bestMove') {
            console.log('[Checkmate SW] bestMove from offscreen:', msg.move, '→ tab', lastTabId);
            if (lastTabId) {
                chrome.tabs.sendMessage(lastTabId, { action: 'bestMove', move: msg.move }).catch((e) => {
                    console.error('[Checkmate SW] tabs.sendMessage failed:', e.message);
                });
            }
        } else if (msg.action === 'status') {
            statusToTab(msg.text);
        }
    });

    port.onDisconnect.addListener(() => {
        offscreenPort = null;
        console.log('[Checkmate SW] offscreen port disconnected');
    });

    // Dispatch any analysis that arrived before the port was ready.
    if (pendingAnalysis) {
        const { fen } = pendingAnalysis;
        pendingAnalysis = null;
        offscreenPort.postMessage({ action: 'analyze', fen });
    }
});

async function ensureOffscreen() {
    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen/offscreen.html'),
            reasons: ['WORKERS'],
            justification: 'Run Stockfish WASM chess engine',
        });
        console.log('[Checkmate SW] offscreen document created');
        // offscreen.js connects via port as soon as it loads — handled in onConnect above.
    } catch (e) {
        if (e.message?.includes('single offscreen document')) {
            // Offscreen doc already exists (SW restarted). Its reconnect timer will fire shortly.
            console.log('[Checkmate SW] offscreen already exists, waiting for port reconnect');
        } else {
            console.error('[Checkmate SW] offscreen create failed:', e.message);
            statusToTab('ERR:' + e.message.slice(0, 30));
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action !== 'analyze') return;
    lastTabId = sender.tab?.id;
    console.log('[Checkmate SW] analyze from tab', lastTabId);
    statusToTab('SW:got FEN');

    if (offscreenPort) {
        offscreenPort.postMessage({ action: 'analyze', fen: request.fen });
    } else {
        pendingAnalysis = { fen: request.fen };
        ensureOffscreen();
    }
});
