let engine = null;
let ready = false;
let pendingFen = null;

self.onmessage = async (e) => {
    const { command, fen, stockfishUrl } = e.data;

    if (command === 'init') {
        importScripts(stockfishUrl);
        engine = await Stockfish();
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
            // Engine still loading WASM — queue and run once readyok arrives.
            pendingFen = fen;
        }
    }
};

function runAnalysis(fen) {
    engine.postMessage('stop');
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage('go depth 12');
}
