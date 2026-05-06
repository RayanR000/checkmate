let offscreenPort = null;
let lastTabId = null;
let pendingAnalysis = null;

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'offscreen') return;
    offscreenPort = port;

    port.onMessage.addListener(() => {}); // offscreen sends bestMove directly to tab

    port.onDisconnect.addListener(() => { offscreenPort = null; });

    if (pendingAnalysis) {
        const { fen, tabId } = pendingAnalysis;
        pendingAnalysis = null;
        offscreenPort.postMessage({ action: 'analyze', fen, tabId });
    }
});

async function ensureOffscreen() {
    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen/offscreen.html'),
            reasons: ['WORKERS'],
            justification: 'Run Stockfish WASM chess engine',
        });
    } catch (e) {
        if (!e.message?.includes('single offscreen document')) {
            console.error('[Checkmate SW] offscreen create failed:', e.message);
        }
        // Already exists — offscreen will reconnect port on its own.
    }
}

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action !== 'analyze') return;
    lastTabId = sender.tab?.id;

    if (offscreenPort) {
        offscreenPort.postMessage({ action: 'analyze', fen: request.fen, tabId: lastTabId });
    } else {
        pendingAnalysis = { fen: request.fen, tabId: lastTabId };
        ensureOffscreen();
    }
});
