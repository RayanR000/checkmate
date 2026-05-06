let engine = null;
let engineReady = false;
let searching = false;
let pendingFen = null; // latest position waiting to be analyzed

self.onmessage = async (e) => {
    const { command, fen, stockfishUrl } = e.data;
    try {
        if (command === 'init') {
            importScripts(stockfishUrl);
            engine = await Stockfish({ mainScriptUrlOrBlob: stockfishUrl });
            engine.addMessageListener((line) => {
                if (line.startsWith('readyok')) {
                    engineReady = true;
                    self.postMessage({ engineReady: true });
                    if (pendingFen !== null) {
                        const f = pendingFen; pendingFen = null;
                        startSearch(f);
                    }
                }
                if (line.startsWith('bestmove')) {
                    const move = line.split(' ')[1];
                    searching = false;
                    if (move && move !== '(none)') {
                        self.postMessage({ bestMove: move });
                    }
                    // Start next search if one was queued while we were busy.
                    if (pendingFen !== null) {
                        const f = pendingFen; pendingFen = null;
                        startSearch(f);
                    }
                }
            });
            engine.postMessage('uci');
            engine.postMessage('isready');

        } else if (command === 'analyze') {
            if (!engineReady) {
                pendingFen = fen; // will run when readyok arrives
            } else if (searching) {
                pendingFen = fen; // queue: picked up after current bestmove arrives
                // Do NOT send stop — that would corrupt UCI state with a stray bestmove
            } else {
                startSearch(fen);
            }
        }
    } catch (err) {
        console.error('[Stockfish Worker] error:', err);
        self.postMessage({ error: String(err) });
    }
};

function startSearch(fen) {
    searching = true;
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage('go depth 10');
}
