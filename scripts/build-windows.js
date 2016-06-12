#!/usr/bin/env node

var exec = require('child_process').exec;

function run(command) {
    var d = Promise.defer();
    var cmd = exec(command);
    cmd.stdout.pipe(process.stdout);
    cmd.on('exit', function () {
        d.resolve();
    });
    return d.promise;
}

run('gulp')
    .then(function () {
        return run('gulp');
    })
    .then(function () {
        return run('asar pack app dist/windows/resources/app.asar');
    })
    .then(function () {
        console.info("\nDone, zip dist/windows and distribute.");
    });