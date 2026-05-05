// Import the engine factory
importScripts('stockfish.js');

let engine = null;

// Initialize when ready
Stockfish().then((sf) => {
    engine = sf;
    engine.addMessageListener((line) => {
        if (line.startsWith('bestmove')) {
            const move = line.split(' ')[1];
            self.postMessage({ bestMove: move });
        }
    });
    
    // Set up basic engine config
    engine.postMessage('uci');
    engine.postMessage('isready');
});

self.onmessage = (e) => {
    const { command, fen } = e.data;
    if (command === 'analyze' && engine) {
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage('go depth 15');
    }
};
