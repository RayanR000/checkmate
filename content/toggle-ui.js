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
            background: #1a1a1a;
            color: #fff;
            padding: 14px 18px;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            min-width: 160px;
            border: 1px solid #333;
        `;
        document.body.appendChild(div);
        return div;
    }

    _render() {
        this.container.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:13px; color:#aaa; user-select:none;">
                    <input type="checkbox" id="checkmate-switch" checked
                        style="width:14px; height:14px; cursor:pointer; accent-color:#4caf50;">
                    Checkmate
                </label>
            </div>
            <div style="font-size:11px; color:#666; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Best move</div>
            <div id="checkmate-notation" style="font-size:26px; font-weight:700; letter-spacing:2px; color:#4caf50;">--</div>
        `;
        this.container.querySelector('#checkmate-switch').addEventListener('change', (e) => {
            this.onToggle(e.target.checked);
        });
    }

    updateNotation(notation) {
        const el = this.container.querySelector('#checkmate-notation');
        if (!el) return;
        // Show status strings (like '...') as-is; format UCI moves as "e2 → e4"
        if (notation.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(notation)) {
            el.innerText = `${notation.slice(0, 2)} → ${notation.slice(2, 4)}`;
        } else {
            el.innerText = notation;
        }
    }

    remove() {
        if (this.container) this.container.remove();
    }
}
