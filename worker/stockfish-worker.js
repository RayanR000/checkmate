let engine = null;
let ready = false;
let pendingFen = null;

self.onmessage = async (e) => {
    const { command, fen, stockfishUrl } = e.data;
    try {
        if (command === 'init') {
            importScripts(stockfishUrl);
            // Pass mainScriptUrlOrBlob so pthread sub-workers load the correct script
            // (without it, they get the directory path and hang indefinitely)
            engine = await Stockfish({ mainScriptUrlOrBlob: stockfishUrl });
            engine.addMessageListener((line) => {
                if (line.startsWith('readyok')) {
                    ready = true;
                    self.postMessage({ engineReady: true });
                    if (pendingFen !== null) {
                        runAnalysis(pendingFen);
                        pendingFen = null;
                    }
                }
                if (line.startsWith('bestmove')) {
                    const move = line.split(' ')[1];
                    self.postMessage({ bestMove: move });
                }
            });
            engine.postMessage('uci');
            engine.postMessage('isready');
        } else if (command === 'analyze') {
            if (ready) {
                runAnalysis(fen);
            } else {
                pendingFen = fen;
            }
        }
    } catch (err) {
        console.error('[Stockfish Worker] error:', err);
        self.postMessage({ error: String(err) });
    }
};

function runAnalysis(fen) {
    engine.postMessage('stop');
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage('go depth 12');
}
