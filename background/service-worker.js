let currentTabId = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Checkmate SW] installed');
});

async function ensureOffscreen() {
    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen/offscreen.html'),
            reasons: ['WORKERS'],
            justification: 'Run Stockfish WASM chess engine in extension worker context',
        });
        console.log('[Checkmate SW] offscreen document created');
    } catch (e) {
        // Already exists — that's fine.
        if (!e.message?.includes('single offscreen document')) {
            console.error('[Checkmate SW] offscreen create error:', e);
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === 'analyze') {
        currentTabId = sender.tab?.id;
        console.log('[Checkmate SW] analyze from tab', currentTabId, 'FEN:', request.fen);
        ensureOffscreen().then(() => {
            chrome.runtime.sendMessage({ action: 'sf_analyze', fen: request.fen }).catch(() => {});
        });
    } else if (request.action === 'sf_bestMove') {
        // Reply from offscreen — forward to the chess.com tab.
        console.log('[Checkmate SW] bestMove', request.move, '→ tab', currentTabId);
        if (currentTabId) {
            chrome.tabs.sendMessage(currentTabId, { action: 'bestMove', move: request.move }).catch((e) => {
                console.error('[Checkmate SW] tabs.sendMessage failed:', e);
            });
        }
    }
});
