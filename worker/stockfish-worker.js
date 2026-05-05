let engine = null;

self.onmessage = async (e) => {
    const { command, fen, stockfishUrl } = e.data;
    if (command === 'init') {
        console.log('[Checkmate Worker] init, loading:', stockfishUrl);
        importScripts(stockfishUrl);
        engine = await Stockfish();
        engine.addMessageListener((line) => {
            console.log('[Checkmate Worker] engine:', line);
            if (line.startsWith('bestmove')) {
                const move = line.split(' ')[1];
                self.postMessage({ bestMove: move });
            }
        });
        engine.postMessage('uci');
        engine.postMessage('isready');
        console.log('[Checkmate Worker] engine ready');
    } else if (command === 'analyze' && engine) {
        engine.postMessage('stop');
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage('go depth 15');
    }
};
