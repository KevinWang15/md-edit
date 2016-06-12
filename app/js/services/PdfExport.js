angular.module('md-edit.services')
    .service('PdfExport', function ($sce, $rootScope, $q, FileService) {
        var fs = require('fs');
        var request = require('request');
        var util = require('util');
        var exec = require('child_process').exec;
        var path_module = require('path');

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

            var images = window.detectImages(FileService.openFiles[FileService.currentlyOpen].text);

            var localImages = images.localImages;
            var remoteImages = images.remoteImages;


            if (remoteImages.length > 0) {
                var imgs = [];

                remoteImages.forEach(function (img) {
                    imgs.push(img.original);
                });

                sweetAlert({
                    allowEscapeKey: true,
                    title: 'Error',
                    text: 'Remote images not supported.\n Please download the images,\nreference them from your file system\nand try again.\n\n' + imgs.join('\n'),
                    showConfirmButton: true,
                    showCancelButton: false,
                    type: 'error',
                    allowOutsideClick: false
                }).then(function (isConfirm) {
                    cancelExport();
                });
                return;
            }

            var localImagesUploaded = $q.defer();

            if (localImages.length == 0)
                localImagesUploaded.resolve();
            else {
                $rootScope.$broadcast('imageUploadRequired', {data: localImages, deferred: localImagesUploaded});
            }

            localImagesUploaded.promise.then(function (data) {

                sweetAlert({
                    allowEscapeKey: true,
                    title: 'Please wait',
                    text: 'Your document is being generated.\n (Press [Esc] to cancel)',
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
                var fileText = file.text;

                if (!!data) {
                    data.forEach(function (item) {
                        console.log(item);
                        // fileText = fileText.replace(new RegExp(search.replaceAll('\\', '\\\\'), 'g'), replacement)
                        fileText = fileText.replaceAll(item.originalMd, item.originalMd.replaceAll(item.original, 'upload/' + item.hash + path_module.extname(item.original)));
                    });

                }
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
                        url: window.server_url + 'convert',
                        form: {filename: file.title, text: fileText},
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
                                    text: 'Bad response from server',
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
            });
        };
    });