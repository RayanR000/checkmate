let stockfish = null;
let currentTabId = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log("Checkmate installed.");
});

function initStockfish() {
    stockfish = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    stockfish.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    stockfish.onmessage = (e) => {
        if (e.data.bestMove && currentTabId) {
            chrome.tabs.sendMessage(currentTabId, { action: 'bestMove', move: e.data.bestMove }).catch(() => {});
        }
    };
}

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === 'analyze') {
        if (!stockfish) initStockfish();
        currentTabId = sender.tab?.id;
        stockfish.postMessage({ command: 'analyze', fen: request.fen });
    }
});
