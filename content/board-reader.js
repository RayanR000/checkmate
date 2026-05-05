export class BoardReader {
    constructor() {
        this.boardSelector = 'wc-chess-board';
    }

    getBoardElement() {
        return document.querySelector(this.boardSelector);
    }

    // Parses pieces based on Chess.com's piece class naming convention
    // e.g., 'piece wp square-14' -> 'wp' at index 14
    parsePosition() {
        const board = this.getBoardElement();
        if (!board) return null;

        const pieces = board.querySelectorAll('[class*="piece"]');
        const boardState = new Array(64).fill(null);

        pieces.forEach(piece => {
            const classes = piece.className.split(' ');
            const typeClass = classes.find(c => c.length === 2 && /^[pnbrqk][wb]$/.test(c));
            const squareClass = classes.find(c => c.startsWith('square-'));

            if (typeClass && squareClass) {
                const squareIndex = parseInt(squareClass.replace('square-', '')) - 1;
                boardState[squareIndex] = typeClass;
            }
        });

        return boardState;
    }

    // Placeholder: Converts board array to FEN
    toFEN(boardState, turn = 'w') {
        // Implementation needed to convert array of pieces to FEN string
        return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
}
