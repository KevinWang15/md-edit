var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var path = require('path');

const ipc = require('electron').ipcMain;

ipc.on('query-argv', function (event, arg) {
    event.returnValue = process.argv.splice(1);
});

function createWindow() {
    const modalPath = path.join('file://', __dirname, 'index.html');
    var win = new BrowserWindow({width: 1366, height: 768});
    win.on('closed', function () {
        win = null
    });
    win.loadURL(modalPath);
    win.webContents.openDevTools();
    win.show();
}

electron.Menu.setApplicationMenu(new electron.Menu());
electron.app.on('ready', createWindow); 