let engine = null;
let engineReady = false;
let searching = false;
let pendingJob = null; // latest position waiting to be analyzed
let activeRequestId = null;

self.onmessage = async (e) => {
    const { command, fen, requestId, stockfishUrl } = e.data;
    try {
        if (command === 'init') {
            importScripts(stockfishUrl);
            engine = await Stockfish({ mainScriptUrlOrBlob: stockfishUrl });
            engine.addMessageListener((line) => {
                if (line.startsWith('readyok')) {
                    engineReady = true;
                    self.postMessage({ engineReady: true });
                    if (pendingJob !== null) {
                        const job = pendingJob; pendingJob = null;
                        startSearch(job.fen, job.requestId);
                    }
                }
                if (line.startsWith('bestmove')) {
                    const move = line.split(' ')[1];
                    searching = false;
                    if (move && move !== '(none)') {
                        self.postMessage({ bestMove: move, requestId: activeRequestId });
                    }
                    activeRequestId = null;
                    // Start next search if one was queued while we were busy.
                    if (pendingJob !== null) {
                        const job = pendingJob; pendingJob = null;
                        startSearch(job.fen, job.requestId);
                    }
                }
            });
            engine.postMessage('uci');
            engine.postMessage('isready');

        } else if (command === 'analyze') {
            if (!engineReady) {
                pendingJob = { fen, requestId }; // will run when readyok arrives
            } else if (searching) {
                pendingJob = { fen, requestId }; // queue: picked up after current bestmove arrives
                // Do NOT send stop — that would corrupt UCI state with a stray bestmove
            } else {
                startSearch(fen, requestId);
            }
        }
    } catch (err) {
        console.error('[Stockfish Worker] error:', err);
        self.postMessage({ error: String(err) });
    }
};

function startSearch(fen, requestId) {
    searching = true;
    activeRequestId = requestId ?? null;
    engine.postMessage(`position fen ${fen}`);
    
    // Performance telemetry
    const startTime = performance.now();
    
    // Hybrid Strategy: Depth 15 or 1 second, whichever comes first
    console.log('[Stockfish] Searching with hybrid: depth 15, movetime 1000');
    engine.postMessage('go depth 15 movetime 1000');

    engine.addMessageListener((line) => {
        if (line.startsWith('bestmove')) {
            const duration = performance.now() - startTime;
            console.log(`[Stockfish] Search finished in ${duration.toFixed(2)}ms`);
        }
    }, { once: true });
}
