chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "activate") {
        console.log("Checkmate activated.");
        injectUI();
    }
});

function injectUI() {
    if (document.getElementById('checkmate-ui')) return;
    const ui = document.createElement('div');
    ui.id = 'checkmate-ui';
    ui.style.position = 'fixed';
    ui.style.top = '10px';
    ui.style.right = '10px';
    ui.style.zIndex = '9999';
    ui.style.background = 'white';
    ui.style.padding = '10px';
    ui.style.border = '1px solid black';
    ui.innerText = 'Checkmate Active';
    document.body.appendChild(ui);
}
