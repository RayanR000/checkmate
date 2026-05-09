class ToggleUI {
    constructor(onToggle) {
        this.container = this._createContainer();
        this.onToggle = onToggle;
        this._render();
    }

    _createContainer() {
        const div = document.createElement('div');
        div.id = 'checkmate-ui';
        div.style.cssText = `
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 9999;
            background: rgba(22, 25, 31, 0.92);
            color: #f2f3f5;
            padding: 12px 14px;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
            min-width: 160px;
            border: 1px solid rgba(212, 149, 60, 0.35);
            backdrop-filter: blur(2px);
        `;
        div.setAttribute('role', 'status');
        div.setAttribute('aria-live', 'polite');
        document.body.appendChild(div);
        return div;
    }

    _render() {
        this.container.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:#b8bcc3; text-transform:uppercase; letter-spacing:0.06em; user-select:none;">
                    <input type="checkbox" id="checkmate-switch" checked
                        style="width:14px; height:14px; cursor:pointer; accent-color:#d4953c;">
                    Checkmate
                </label>
            </div>
            <div style="font-size:11px; color:#8e949f; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px;">Best move</div>
            <div id="checkmate-notation" style="font-size:20px; font-weight:700; letter-spacing:0.05em; color:#d4953c;">--</div>
        `;
        this.container.querySelector('#checkmate-switch').addEventListener('change', (e) => {
            this.onToggle(e.target.checked);
        });
    }

    updateNotation(notation) {
        const el = this.container.querySelector('#checkmate-notation');
        if (!el) return;
        el.innerText = notation;
    }

    remove() {
        if (this.container) this.container.remove();
    }
}
