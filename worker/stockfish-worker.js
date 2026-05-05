let engine = null;

self.onmessage = async (e) => {
    const { command, fen, stockfishUrl } = e.data;
    if (command === 'init') {
        importScripts(stockfishUrl);
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
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage('go depth 15');
    }
};
