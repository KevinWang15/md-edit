#!/usr/bin/env node
var spawn = require('child_process').spawn;
var readlineSync = require('readline-sync');

var node = null;
while (true) {
    if (node) node.kill();
    node = spawn('C:\\Users\\Kevin\\AppData\\Roaming\\npm\\node_modules\\electron-prebuilt\\dist\\electron.exe', ['app/main.js'], {stdio: 'inherit'})
    readlineSync.question('Press enter to restart');
}