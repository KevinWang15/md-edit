var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var path = require('path');


function createWindow() {
    const modalPath = path.join('file://', __dirname, 'app/index.html');
    var win = new BrowserWindow({width: 1366, height: 768});
    win.on('closed', function () {
        win = null
    });
    win.loadURL(modalPath);
    win.webContents.openDevTools();
    win.show();
}

electron.app.on('ready', createWindow);