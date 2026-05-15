(async () => {
    const StatusModel = globalThis.CheckmateStatusModel;
    let reader = null;
    let renderer = null;
    let ui = null;
    let observer = null;
    let rootObserver = null;
    let observedBoard = null;
    let debounceTimer = null;
    let lastSentFen = null; // deduplicate — don't re-analyze same position
    let lastStatus = '';
    let latestAnalyzeRequestId = 0;

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggle') {
            if (request.enabled) {
                startSession();
            } else {
                endSession();
            }
        } else if (request.action === 'bestMove') {
            if (renderer && request.move && request.move !== '(none)') {
                if (request.requestId && request.requestId !== latestAnalyzeRequestId) {
                    return;
                }

                if (!isUsersTurnNow()) {
                    const waitingStatus = StatusModel.createStatus(StatusModel.STATUS.WAITING);
                    renderer.clear();
                    if (ui) ui.updateNotation(StatusModel.toNotationText(waitingStatus));
                    reportStatus(waitingStatus);
                    return;
                }
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

    function isUsersTurnNow() {
        if (!reader) return true;
        const playerColor = reader.getPlayerColor();
        const sideToMove = reader.getSideToMove();
        return sideToMove ? (sideToMove === playerColor) : reader.isUserTurn();
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
        if (renderer) { renderer.remove(); renderer = null; }
        stopObserving();
        reader = null;
        lastSentFen = null;
        latestAnalyzeRequestId = 0;
        reportStatus(StatusModel.createStatus(StatusModel.STATUS.OFF));
    }

    function startObserving() {
        const board = reader.getBoardElement();
        if (!board) return;

        const analyze = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const state = reader.parsePosition();
                if (!state) return;

                const playerColor = reader.getPlayerColor();
                const sideToMove = reader.getSideToMove();
                const isUsersTurn = isUsersTurnNow();

                const fen = reader.toFEN(state, sideToMove || playerColor);
                if (fen === lastSentFen) return;
                lastSentFen = fen;

                const nextStatus = StatusModel.createStatus(
                    isUsersTurn ? StatusModel.STATUS.ANALYZING : StatusModel.STATUS.WAITING
                );
                if (!isUsersTurn && renderer) renderer.clear();
                if (ui) ui.updateNotation(StatusModel.toNotationText(nextStatus));
                reportStatus(nextStatus);

                latestAnalyzeRequestId += 1;
                const requestId = latestAnalyzeRequestId;
                chrome.runtime.sendMessage({ action: 'analyze', fen, requestId })
                    .catch((error) => console.warn('[Checkmate] analyze send failed:', error?.message || error));
            }, 400); 
        };

        const attachBoard = (nextBoard) => {
            if (!nextBoard) return;
            if (observedBoard === nextBoard) return;

            if (observer) observer.disconnect();
            observedBoard = nextBoard;
            lastSentFen = null;
            latestAnalyzeRequestId = 0;

            if (renderer) renderer.remove();
            renderer = new MoveRenderer(nextBoard);

            observer = new MutationObserver(() => {
                if (renderer) renderer.clear();
                analyze();
            });
            observer.observe(nextBoard, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class'],
            });
        };

        attachBoard(board);

        rootObserver = new MutationObserver(() => {
            const latestBoard = reader.getBoardElement();
            if (latestBoard && latestBoard !== observedBoard) {
                attachBoard(latestBoard);
                analyze();
            }
        });
        rootObserver.observe(document.body, { childList: true, subtree: true });
        analyze();
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
        if (rootObserver) { rootObserver.disconnect(); rootObserver = null; }
        clearTimeout(debounceTimer);
        debounceTimer = null;
        observedBoard = null;
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
