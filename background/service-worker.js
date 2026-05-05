let stockfish = null;
let currentTabId = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Checkmate SW] installed');
});

function initStockfish() {
    console.log('[Checkmate SW] initializing Stockfish worker');
    stockfish = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    stockfish.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    stockfish.onmessage = (e) => {
        console.log('[Checkmate SW] worker message:', e.data);
        if (e.data.bestMove && currentTabId) {
            console.log('[Checkmate SW] sending bestMove to tab', currentTabId, ':', e.data.bestMove);
            chrome.tabs.sendMessage(currentTabId, { action: 'bestMove', move: e.data.bestMove }).catch((err) => {
                console.error('[Checkmate SW] tabs.sendMessage failed:', err);
            });
        }
    };
    stockfish.onerror = (e) => {
        console.error('[Checkmate SW] worker error:', e);
    };
}

chrome.runtime.onMessage.addListener((request, sender) => {
    console.log('[Checkmate SW] message received:', request.action, 'from tab:', sender.tab?.id);
    if (request.action === 'analyze') {
        if (!stockfish) initStockfish();
        currentTabId = sender.tab?.id;
        console.log('[Checkmate SW] analyzing FEN:', request.fen);
        stockfish.postMessage({ command: 'analyze', fen: request.fen });
    }
});
