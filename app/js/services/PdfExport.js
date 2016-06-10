angular.module('md-edit.services')
    .service('PdfExport', function ($sce, $rootScope, $q, FileService) {
        const server_url = "http://139.196.50.217:13636/convert";
        var fs = require('fs');
        var request = require('request');
        var sys = require('sys');
        var exec = require('child_process').exec;

        function getOpenCommandLine() {
            switch (process.platform) {
                case 'darwin' :
                    return 'open';
                case 'win32' :
                    return 'start';
                case 'win64' :
                    return 'start';
                default :
                    return 'xdg-open';
            }
        }

        this.export = function () {

            sweetAlert({
                allowEscapeKey: true,
                title: 'PDF export instructions',
                text: 'You can export PDF by printing it to a PDF file. \nIn the next Dialog, choose "Adobe PDF".\n\nAlternatively, you can use our free web service.',
                showConfirmButton: true,
                showCancelButton: true,
                type: 'info',
                allowOutsideClick: false
            }).then(function (isConfirm) {
                if (isConfirm) {
                    setTimeout(function () {
                        angular.element($('html')).scope().$broadcast('MenuEvent', 'print');
                    }, 230);
                }
            });
        };

        this.exportWebService = function () {


            function cancelExport() {
                cancelled = true;
                if (!!f) {
                    f.end();
                }
                fs.unlink(path);
            }


            var f;
            var path = window.electron.remote.dialog.showSaveDialog({
                filters: [
                    {
                        name: "PDF files (*.pdf)",
                        extensions: ['pdf']
                    }],
                defaultPath: (!!FileService.openFiles[FileService.currentlyOpen].path) ? (FileService.openFiles[FileService.currentlyOpen].path + '.pdf') : "",
                properties: ['openFile', 'openDirectory', 'createDirectory']
            });

            if (!path) return;

            var cancelled = false;
            sweetAlert({
                allowEscapeKey: true,
                title: 'Please wait',
                text: 'Your request is being processed.\n (Press [Esc] to cancel)',
                showConfirmButton: false,
                showCancelButton: false,
                type: 'info',
                allowOutsideClick: false
            }).then(function (isConfirm) {
                if (!isConfirm) {
                    cancelExport();
                }
            });

            var file = FileService.openFiles[FileService.currentlyOpen];

            f = fs.createWriteStream(path);

            f.on('error', function (err) {
                cancelExport();
                sweetAlert({
                    allowEscapeKey: true,
                    title: 'Error',
                    text: 'Error writing to file ' + path,
                    showConfirmButton: true,
                    showCancelButton: false,
                    type: 'error',
                    allowOutsideClick: true
                });
            });
            var req = request.post(
                {
                    url: server_url,
                    form: {filename: file.title, text: file.text},
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }, function (err, httpResponse, body) {
                    if (!cancelled) {
                        if (!!body && body.length > 4 && body.substr(0, 4) == '%PDF') {
                            sweetAlert({
                                allowEscapeKey: true,
                                title: 'Done',
                                text: 'Your file has been generated',
                                showConfirmButton: true,
                                showCancelButton: false,
                                type: 'success',
                                allowOutsideClick: true
                            });
                            f.end();
                            exec(getOpenCommandLine() + ' ' + path);
                        } else {
                            sweetAlert({
                                allowEscapeKey: true,
                                title: 'Error',
                                text: 'Bad response from server', //+'\n\n' + body,
                                showConfirmButton: true,
                                showCancelButton: false,
                                type: 'error',
                                allowOutsideClick: true
                            });
                            f.end();
                            fs.unlink(path);
                        }
                    }
                });

            req.on('response', function (res) {
                if (cancelled) return;
                res.pipe(f);
            });

        };
    });