export class MoveRenderer {
    constructor(boardElement) {
        this.board = boardElement;
        this.overlay = this._createOverlay();
    }

    _createOverlay() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1000';
        this.board.appendChild(svg);
        return svg;
    }

    drawArrow(fromSquareIndex, toSquareIndex) {
        this.clear();
        const rect = this.board.getBoundingClientRect();
        const squareSize = rect.width / 8;

        const getCoords = (index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            // Handle board flip if necessary; chess.com board is usually flipped for black
            const x = col * squareSize + squareSize / 2;
            const y = (7 - row) * squareSize + squareSize / 2;
            return { x, y };
        };

        const start = getCoords(fromSquareIndex);
        const end = getCoords(toSquareIndex);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', end.x);
        line.setAttribute('y2', end.y);
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', '5');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        this.overlay.appendChild(line);
    }

    clear() {
        while (this.overlay.firstChild) {
            this.overlay.removeChild(this.overlay.firstChild);
        }
    }
}
