// Extension page — can use chrome-extension:// Workers without SecurityError.
let stockfish = null;
let lastTabId = null;

function initStockfish() {
    const worker = new Worker(chrome.runtime.getURL('worker/stockfish-worker.js'));
    worker.postMessage({ command: 'init', stockfishUrl: chrome.runtime.getURL('worker/stockfish.js') });
    worker.onmessage = (e) => {
        const move = e.data.bestMove;
        if (!move) return;
        console.log('[Checkmate Offscreen] bestMove:', move, '→ tab', lastTabId);
        if (lastTabId) {
            chrome.tabs.sendMessage(lastTabId, { action: 'bestMove', move }).catch((err) => {
                console.error('[Checkmate Offscreen] tabs.sendMessage failed:', err.message);
            });
        }
    };
    worker.onerror = (e) => console.error('[Checkmate Offscreen] worker error:', e.message);
    return worker;
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action !== 'sf_analyze') return;
    console.log('[Checkmate Offscreen] received analyze, tab:', msg.tabId, 'FEN:', msg.fen);
    lastTabId = msg.tabId;
    if (!stockfish) stockfish = initStockfish();
    stockfish.postMessage({ command: 'analyze', fen: msg.fen });
});

// Signal readiness so the SW can dispatch any queued analysis.
chrome.runtime.sendMessage({ action: 'offscreen_ready' }).catch(() => {});
console.log('[Checkmate Offscreen] loaded and ready');
