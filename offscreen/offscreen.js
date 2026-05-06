// Extension page — can use chrome-extension:// Workers without SecurityError.
let stockfish = null;
let swPort = null;
let currentTabId = null;

function initStockfish() {
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        if (e.data.error) {
            console.error('[Checkmate Offscreen] worker error:', e.data.error);
            return;
        }
        if (e.data.bestMove && swPort) {
            // Route back through SW — offscreen can't call chrome.tabs.sendMessage.
            swPort.postMessage({ action: 'bestMove', move: e.data.bestMove, tabId: currentTabId });
        }
    };
    worker.onerror = (e) => console.error('[Checkmate Offscreen] worker onerror:', e.message);
    return worker;
}

function connectToSW() {
    swPort = chrome.runtime.connect({ name: 'offscreen' });

    swPort.onMessage.addListener((msg) => {
        if (msg.action === 'analyze') {
            currentTabId = msg.tabId;
            if (!stockfish) stockfish = initStockfish();
            stockfish.postMessage({ command: 'analyze', fen: msg.fen });
        }
    });

    swPort.onDisconnect.addListener(() => {
        swPort = null;
        setTimeout(connectToSW, 200);
    });
}

connectToSW();
