class BoardReader {
    constructor() {
        this.boardSelector = 'wc-chess-board';
    }

    getBoardElement() {
        return document.querySelector(this.boardSelector);
    }

    getPlayerColor() {
        const board = this.getBoardElement();
        if (!board) return 'w';
        return board.classList.contains('flipped') ? 'b' : 'w';
    }

    getSideToMove() {
        const board = this.getBoardElement();
        if (!board) return null;

        const classNames = Array.from(board.classList);
        const fullClassString = classNames.join(' ');
        if (classNames.includes('turn-w') || /\bturn[-_]white\b/i.test(fullClassString) || /\bwhite[-_]turn\b/i.test(fullClassString)) {
            return 'w';
        }
        if (classNames.includes('turn-b') || /\bturn[-_]black\b/i.test(fullClassString) || /\bblack[-_]turn\b/i.test(fullClassString)) {
            return 'b';
        }

        const clockTurn = this.getSideToMoveFromClock();
        if (clockTurn) return clockTurn;

        return this.getSideToMoveFromHighlights();
    }

    getSideToMoveFromHighlights() {
        const board = this.getBoardElement();
        if (!board) return null;

        const highlights = Array.from(board.querySelectorAll('.highlight'));
        if (highlights.length === 0) {
            return 'w';
        }

        const pieces = Array.from(board.querySelectorAll('[class*="piece"]'));
        const pieceMap = new Map();
        pieces.forEach(p => {
            const squareClass = Array.from(p.classList).find(c => c.startsWith('square-'));
            if (squareClass) {
                const squareNum = parseInt(squareClass.replace('square-', ''));
                const typeClass = Array.from(p.classList).find(c => c.length === 2 && /^[wb][pnbrqk]$/.test(c));
                if (typeClass) pieceMap.set(squareNum, typeClass[0]);
            }
        });

        // The 'to' square of the last move is highlighted AND has a piece on it.
        // The 'from' square of the last move is highlighted but is now empty.
        let lastMovedColor = null;
        for (const h of highlights) {
            const squareClass = Array.from(h.classList).find(c => c.startsWith('square-'));
            if (squareClass) {
                const squareNum = parseInt(squareClass.replace('square-', ''));
                const colorAtSquare = pieceMap.get(squareNum);
                if (colorAtSquare) {
                    lastMovedColor = colorAtSquare;
                    break; 
                }
            }
        }

        if (lastMovedColor === 'w') return 'b';
        if (lastMovedColor === 'b') return 'w';

        return 'w';
    }

    getSideToMoveFromClock() {
        const board = this.getBoardElement();
        if (!board) return null;

        const activeClock = this.getActiveClockElement();
        if (!activeClock) return null;

        const className = String(activeClock.className || '');
        if (/\bclock[-_\s]?white\b/i.test(className)) return 'w';
        if (/\bclock[-_\s]?black\b/i.test(className)) return 'b';

        const dataCy = String(activeClock.getAttribute?.('data-cy') || '');
        if (dataCy.includes('white')) return 'w';
        if (dataCy.includes('black')) return 'b';

        const isBottomClock = activeClock.matches?.('[data-cy="clock-bottom"], .clock-bottom, [class*="clock-bottom"]');
        if (isBottomClock) return this.getPlayerColor();

        const isTopClock = activeClock.matches?.('[data-cy="clock-top"], .clock-top, [class*="clock-top"]');
        if (isTopClock) return this.getPlayerColor() === 'w' ? 'b' : 'w';

        return null;
    }

    getActiveClockElement() {
        const activeClock = document.querySelector(
            '.clock-component.clock-player-turn,' +
            '.clock-player-turn,' +
            '[data-cy="clock-bottom"].clock-player-turn,' +
            '[data-cy="clock-top"].clock-player-turn'
        );
        if (!activeClock) return null;

        return activeClock.closest?.('[data-cy="clock-bottom"], [data-cy="clock-top"], .clock-component, .clock-bottom, .clock-top') || activeClock;
    }

    isUserTurn() {
        const sideToMove = this.getSideToMove();
        if (!sideToMove) return false;
        return sideToMove === this.getPlayerColor();
    }

    parsePosition() {
        const board = this.getBoardElement();
        if (!board) return null;

        const pieces = board.querySelectorAll('[class*="piece"]');
        const boardState = new Array(64).fill(null);

        pieces.forEach(piece => {
            const classes = piece.className.split(' ');
            // chess.com format: color first then piece type, e.g. "wp" = white pawn
            const typeClass = classes.find(c => c.length === 2 && /^[wb][pnbrqk]$/.test(c));
            const squareClass = classes.find(c => c.startsWith('square-'));

            if (typeClass && squareClass) {
                // square-{file}{rank}: e.g. square-14 = file 1, rank 4
                const squareNum = parseInt(squareClass.replace('square-', ''));
                const file = Math.floor(squareNum / 10) - 1;
                const rank = (squareNum % 10) - 1;
                boardState[rank * 8 + file] = typeClass;
            }
        });

        return boardState;
    }

    toFEN(boardState, turn = 'w') {
        let fen = '';
        for (let row = 7; row >= 0; row--) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row * 8 + col];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    // piece[0] = color (w/b), piece[1] = type (p/n/b/r/q/k)
                    const color = piece[0];
                    const p = piece[1];
                    fen += (color === 'w') ? p.toUpperCase() : p.toLowerCase();
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row > 0) fen += '/';
        }
        const castling = this.inferCastlingRights(boardState);
        return `${fen} ${turn} ${castling} - 0 1`;
    }

    inferCastlingRights(boardState) {
        let rights = '';
        if (boardState[4] === 'wk' && boardState[7] === 'wr') rights += 'K';
        if (boardState[4] === 'wk' && boardState[0] === 'wr') rights += 'Q';
        if (boardState[60] === 'bk' && boardState[63] === 'br') rights += 'k';
        if (boardState[60] === 'bk' && boardState[56] === 'br') rights += 'q';
        return rights || '-';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoardReader;
}
