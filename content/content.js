(async () => {
    const StatusModel = globalThis.CheckmateStatusModel;
    let reader = null;
    let renderer = null;
    let ui = null;
    let observer = null;
    let lastSentFen = null; // deduplicate — don't re-analyze same position
    let lastStatus = '';

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
            if (request.enabled) {
                startSession();
            } else {
                endSession();
            }
        } else if (request.action === 'bestMove') {
            if (renderer && request.move && request.move !== '(none)') {
                const status = StatusModel.statusFromBestMove(request.move);
                renderer.drawArrow(
                    uciToIndex(request.move.substring(0, 2)),
                    uciToIndex(request.move.substring(2, 4))
                );
                if (ui) ui.updateNotation(StatusModel.toNotationText(status));
                reportStatus(status);
            }
        } else if (request.action === 'status') {
            const status = StatusModel.normalizeStatus(request.status || request.text, true);
            if (ui) ui.updateNotation(StatusModel.toNotationText(status));
            reportStatus(status);
        }
    });

    async function reportStatus(statusLike) {
        const status = StatusModel.normalizeStatus(statusLike, true);
        const nextStatus = JSON.stringify(status);
        if (nextStatus === lastStatus) return;
        lastStatus = nextStatus;
        try {
            await chrome.runtime.sendMessage({ action: 'statusUpdate', status });
        } catch (error) {
            console.warn('[Checkmate] status update failed:', error?.message || error);
        }
    }

    async function setGlobalEnabled(enabled) {
        try {
            await chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
        } catch (error) {
            console.warn('[Checkmate] setEnabled failed:', error?.message || error);
        }
    }

    function uciToIndex(uci) {
        const file = uci.charCodeAt(0) - 97;
        const rank = parseInt(uci[1]) - 1;
        return rank * 8 + file;
    }

    function startSession() {
        if (ui) return;
        reader = new BoardReader();
        const board = reader.getBoardElement();
        if (!board) {
            console.warn('[Checkmate] board not found');
            reportStatus(StatusModel.createStatus(StatusModel.STATUS.INFO, 'No board detected'));
            return;
        }
        renderer = new MoveRenderer(board);
        ui = new ToggleUI((enabled) => {
            if (!enabled) {
                setGlobalEnabled(false);
                endSession();
            }
        });
        reportStatus(StatusModel.createStatus(StatusModel.STATUS.READY));
        startObserving();
    }

    function endSession() {
        if (ui) { ui.remove(); ui = null; }
        if (renderer) { renderer.clear(); renderer = null; }
        stopObserving();
        reader = null;
        lastSentFen = null;
        reportStatus(StatusModel.createStatus(StatusModel.STATUS.OFF));
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

                const playerColor = reader.getPlayerColor();
                const sideToMove = reader.getSideToMove();
                const isUsersTurn = sideToMove ? (sideToMove === playerColor) : reader.isUserTurn();

                // Hide arrow and reset during opponent's turn
                if (!isUsersTurn) {
                    const waitingStatus = StatusModel.createStatus(StatusModel.STATUS.WAITING);
                    if (renderer) renderer.clear();
                    if (ui) ui.updateNotation(StatusModel.toNotationText(waitingStatus));
                    reportStatus(waitingStatus);
                    lastSentFen = null; // Reset so it triggers immediately when it becomes our turn
                    return;
                }

                const fen = reader.toFEN(state, sideToMove || playerColor);
                if (fen === lastSentFen) return;
                lastSentFen = fen;
                
                // Immediate feedback for user's turn
                const analyzingStatus = StatusModel.createStatus(StatusModel.STATUS.ANALYZING);
                if (ui) ui.updateNotation(StatusModel.toNotationText(analyzingStatus));
                reportStatus(analyzingStatus);
                chrome.runtime.sendMessage({ action: 'analyze', fen })
                    .catch((error) => console.warn('[Checkmate] analyze send failed:', error?.message || error));
            }, 400); 
        };

        observer = new MutationObserver(analyze);
        observer.observe(board, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });
        analyze();
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }

    try {
        const state = await chrome.runtime.sendMessage({ action: 'getState' });
        if (state?.enabled) {
            startSession();
        } else {
            reportStatus(StatusModel.createStatus(StatusModel.STATUS.OFF));
        }
    } catch (error) {
        console.warn('[Checkmate] initial state load failed:', error?.message || error);
    }
})();
