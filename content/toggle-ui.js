class ToggleUI {
    constructor(onToggle) {
        this.container = this._createContainer();
        this.onToggle = onToggle;
        this._render();
    }

    _createContainer() {
        const div = document.createElement('div');
        div.id = 'checkmate-ui';
        div.style.position = 'fixed';
        div.style.top = '10px';
        div.style.right = '10px';
        div.style.zIndex = '9999';
        div.style.background = '#333';
        div.style.color = '#fff';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.fontFamily = 'sans-serif';
        document.body.appendChild(div);
        return div;
    }

    _render() {
        this.container.innerHTML = `
            <div style="margin-bottom: 5px;">
                <label>
                    <input type="checkbox" id="checkmate-switch" checked> Analysis
                </label>
            </div>
            <div id="checkmate-notation" style="font-weight: bold; font-size: 1.2em;">--</div>
        `;
        this.container.querySelector('#checkmate-switch').addEventListener('change', (e) => {
            this.onToggle(e.target.checked);
        });
    }

    updateNotation(notation) {
        const el = this.container.querySelector('#checkmate-notation');
        if (el) el.innerText = notation;
    }

    remove() {
        if (this.container) this.container.remove();
    }
}
