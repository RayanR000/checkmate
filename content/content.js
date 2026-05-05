(async () => {
    let reader = null;
    let renderer = null;
    let ui = null;
    let observer = null;
    let stockfish = null;

    function initStockfish() {
        // Blob URL runs at page origin — avoids chrome-extension:// cross-origin Worker error.
        // importScripts can still reach extension URLs listed in web_accessible_resources.
        const sfUrl = chrome.runtime.getURL('worker/stockfish.js');
        const code = `
let engine = null;
self.onmessage = async (e) => {
    const { command, fen } = e.data;
    if (command === 'init') {
        importScripts('${sfUrl}');
        engine = await Stockfish();
        engine.addMessageListener((line) => {
            if (line.startsWith('bestmove')) {
                const move = line.split(' ')[1];
                self.postMessage({ bestMove: move });
            }
        });
        engine.postMessage('uci');
        engine.postMessage('isready');
    } else if (command === 'analyze' && engine) {
        engine.postMessage('stop');
        engine.postMessage('position fen ' + fen);
        engine.postMessage('go depth 15');
    }
};`;
        const blob = new Blob([code], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        worker.postMessage({ command: 'init' });
        worker.onerror = (e) => console.error('[Checkmate] Stockfish worker error:', e);
        worker.onmessage = (e) => {
            const move = e.data.bestMove;
            console.log('[Checkmate] bestMove:', move);
            if (move && move !== '(none)' && renderer) {
                renderer.drawArrow(uciToIndex(move.substring(0, 2)), uciToIndex(move.substring(2, 4)));
                if (ui) ui.updateNotation(move);
            }
        };
        return worker;
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
            if (request.enabled) {
                startSession();
            } else {
                endSession();
            }
        }
    });

    function uciToIndex(uci) {
        const file = uci.charCodeAt(0) - 97;
        const rank = parseInt(uci[1]) - 1;
        return rank * 8 + file;
    }

    function startSession() {
        if (ui) return;
        reader = new BoardReader();
        const board = reader.getBoardElement();
        if (!board) { console.warn('[Checkmate] board not found'); return; }
        if (!stockfish) stockfish = initStockfish();
        renderer = new MoveRenderer(board);
        ui = new ToggleUI((enabled) => { if (!enabled) endSession(); });
        startObserving();
        console.log('[Checkmate] session started');
    }

    function endSession() {
        if (ui) { ui.remove(); ui = null; }
        if (renderer) { renderer.clear(); renderer = null; }
        stopObserving();
        reader = null;
    }

    function startObserving() {
        const board = reader.getBoardElement();
        if (!board) return;

        let debounceTimer = null;
        const analyze = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const state = reader.parsePosition();
                if (!state) return;
                const fen = reader.toFEN(state);
                console.log('[Checkmate] analyzing FEN:', fen);
                stockfish.postMessage({ command: 'analyze', fen });
            }, 150);
        };

        observer = new MutationObserver(analyze);
        observer.observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        analyze();
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }
})();
