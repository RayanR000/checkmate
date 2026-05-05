class MoveRenderer {
    constructor(boardElement) {
        this.board = boardElement;
        this.board.style.position = 'relative';
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

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'checkmate-arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', 'rgba(0,200,0,0.85)');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);

        this.board.appendChild(svg);
        return svg;
    }

    drawArrow(fromIndex, toIndex) {
        this.clear();
        const rect = this.board.getBoundingClientRect();
        const squareSize = rect.width / 8;

        const getCoords = (index) => {
            const file = index % 8;
            const rank = Math.floor(index / 8);
            return {
                x: file * squareSize + squareSize / 2,
                y: (7 - rank) * squareSize + squareSize / 2,
            };
        };

        const start = getCoords(fromIndex);
        const end = getCoords(toIndex);

        // Shorten line so arrowhead doesn't overlap the target square center
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const shorten = squareSize * 0.18;
        const ex = end.x - (dx / len) * shorten;
        const ey = end.y - (dy / len) * shorten;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', ex);
        line.setAttribute('y2', ey);
        line.setAttribute('stroke', 'rgba(0,200,0,0.85)');
        line.setAttribute('stroke-width', '8');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('marker-end', 'url(#checkmate-arrowhead)');

        this.overlay.appendChild(line);
    }

    clear() {
        // Remove all children except the defs block
        const children = Array.from(this.overlay.childNodes);
        children.forEach(child => {
            if (child.tagName !== 'defs') this.overlay.removeChild(child);
        });
    }
}
