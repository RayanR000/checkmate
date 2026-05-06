// Extension page — can use chrome-extension:// Workers without SecurityError.
let stockfish = null;
let swPort = null;

function initStockfish() {
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        if (e.data.error && swPort) {
            swPort.postMessage({ action: 'status', text: 'ERR:' + e.data.error.slice(0, 25) });
            return;
        }
        if (e.data.bestMove && swPort) {
            swPort.postMessage({ action: 'bestMove', move: e.data.bestMove });
        }
    };
    worker.onerror = (e) => console.error('[Checkmate Offscreen] worker error:', e.message);
    return worker;
}

function connectToSW() {
    swPort = chrome.runtime.connect({ name: 'offscreen' });

    swPort.onMessage.addListener((msg) => {
        if (msg.action === 'analyze') {
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
