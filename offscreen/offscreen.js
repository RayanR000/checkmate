// Extension page — can use chrome-extension:// Workers without SecurityError.
let stockfish = null;
let swPort = null;
let currentTabId = null;
let lastFen = null;
let lastRequestId = null;
let watchdog = null;

function clearWatchdog() {
    clearTimeout(watchdog);
    watchdog = null;
}

function armWatchdog(fen, requestId) {
    clearWatchdog();
    watchdog = setTimeout(() => {
        console.warn('[Checkmate Offscreen] watchdog: no bestMove in 6s, restarting worker');
        if (stockfish) { stockfish.terminate(); stockfish = null; }
        if (lastFen) analyze(lastFen, requestId); // retry with same FEN and request
    }, 6000);
}

function analyze(fen, requestId) {
    lastFen = fen;
    lastRequestId = requestId ?? null;
    if (!stockfish) stockfish = initStockfish();
    stockfish.postMessage({ command: 'analyze', fen, requestId });
    armWatchdog(fen, requestId);
}

function initStockfish() {
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        if (e.data.error) {
            console.error('[Checkmate Offscreen] worker error:', e.data.error);
            clearWatchdog();
            stockfish = null;
            if (lastFen) setTimeout(() => analyze(lastFen, lastRequestId), 500);
            return;
        }
        if (e.data.bestMove) {
            clearWatchdog();
            if (swPort) {
                swPort.postMessage({
                    action: 'bestMove',
                    move: e.data.bestMove,
                    tabId: currentTabId,
                    requestId: e.data.requestId,
                });
            }
        }
    };
    worker.onerror = (e) => {
        console.error('[Checkmate Offscreen] worker onerror:', e.message);
        clearWatchdog();
        stockfish = null;
        if (lastFen) setTimeout(() => analyze(lastFen, lastRequestId), 500);
    };
    return worker;
}

function connectToSW() {
    swPort = chrome.runtime.connect({ name: 'offscreen' });

    swPort.onMessage.addListener((msg) => {
        if (msg.action === 'analyze') {
            currentTabId = msg.tabId;
            analyze(msg.fen, msg.requestId);
        }
    });

    swPort.onDisconnect.addListener(() => {
        swPort = null;
        setTimeout(connectToSW, 200);
    });
}

connectToSW();
