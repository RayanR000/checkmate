// Runs at extension origin — can create Workers from chrome-extension:// URLs.
let stockfish = null;

function initStockfish() {
    // This works here because offscreen.html is an extension page (not chess.com page).
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        if (e.data.bestMove) {
            // Route bestMove back through the service worker to the content script tab.
            chrome.runtime.sendMessage({ action: 'sf_bestMove', move: e.data.bestMove });
        }
    };
    worker.onerror = (e) => console.error('[Checkmate Offscreen] worker error:', e);
    return worker;
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'sf_analyze') {
        if (!stockfish) stockfish = initStockfish();
        stockfish.postMessage({ command: 'analyze', fen: request.fen });
    }
});

console.log('[Checkmate Offscreen] ready');
