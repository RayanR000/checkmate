// Extension page — can use chrome-extension:// Workers.
let stockfish = null;
let swPort = null;

function initStockfish() {
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        if (e.data.engineReady && swPort) {
            console.log('[Checkmate Offscreen] engine ready');
            swPort.postMessage({ action: 'status', text: 'SF:ready' });
        }
        const move = e.data.bestMove;
        if (move && swPort) {
            console.log('[Checkmate Offscreen] bestMove:', move);
            swPort.postMessage({ action: 'bestMove', move });
        }
    };
    worker.onerror = (e) => {
        console.error('[Checkmate Offscreen] worker error:', e.message);
        if (swPort) swPort.postMessage({ action: 'status', text: 'ERR:worker ' + (e.message || '').slice(0, 20) });
    };
    return worker;
}

function connectToSW() {
    swPort = chrome.runtime.connect({ name: 'offscreen' });

    swPort.onMessage.addListener((msg) => {
        console.log('[Checkmate Offscreen] port message:', msg.action);
        if (msg.action === 'analyze') {
            if (!stockfish) {
                swPort.postMessage({ action: 'status', text: 'Offscreen:init SF' });
                stockfish = initStockfish();
            }
            swPort.postMessage({ action: 'status', text: 'Offscreen:analyzing' });
            stockfish.postMessage({ command: 'analyze', fen: msg.fen });
        }
    });

    swPort.onDisconnect.addListener(() => {
        console.log('[Checkmate Offscreen] SW disconnected');
        swPort = null;
        // Reconnect — also wakes the SW back up if it went to sleep.
        setTimeout(connectToSW, 200);
    });

    console.log('[Checkmate Offscreen] connected to SW');
    swPort.postMessage({ action: 'status', text: 'Offscreen:connected' });
}

connectToSW();
