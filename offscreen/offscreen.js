// Extension page — can use chrome-extension:// Workers without SecurityError.
let stockfish = null;
let swPort = null;
let currentTabId = null;
let lastFen = null;
let watchdog = null;

function clearWatchdog() {
    clearTimeout(watchdog);
    watchdog = null;
}

function armWatchdog(fen) {
    clearWatchdog();
    watchdog = setTimeout(() => {
        console.warn('[Checkmate Offscreen] watchdog: no bestMove in 6s, restarting worker');
        if (stockfish) { stockfish.terminate(); stockfish = null; }
        if (lastFen) analyze(lastFen); // retry with same FEN
    }, 6000);
}

function analyze(fen) {
    lastFen = fen;
    if (!stockfish) stockfish = initStockfish();
    stockfish.postMessage({ command: 'analyze', fen });
    armWatchdog(fen);
}

function initStockfish() {
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        if (e.data.error) {
            console.error('[Checkmate Offscreen] worker error:', e.data.error);
            clearWatchdog();
            stockfish = null;
            if (lastFen) setTimeout(() => analyze(lastFen), 500);
            return;
        }
        if (e.data.bestMove) {
            clearWatchdog();
            if (swPort) {
                swPort.postMessage({ action: 'bestMove', move: e.data.bestMove, tabId: currentTabId });
            }
        }
    };
    worker.onerror = (e) => {
        console.error('[Checkmate Offscreen] worker onerror:', e.message);
        clearWatchdog();
        stockfish = null;
        if (lastFen) setTimeout(() => analyze(lastFen), 500);
    };
    return worker;
}

function connectToSW() {
    swPort = chrome.runtime.connect({ name: 'offscreen' });

    swPort.onMessage.addListener((msg) => {
        if (msg.action === 'analyze') {
            currentTabId = msg.tabId;
            analyze(msg.fen);
        }
    });

    swPort.onDisconnect.addListener(() => {
        swPort = null;
        setTimeout(connectToSW, 200);
    });
}

connectToSW();
