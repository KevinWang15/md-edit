angular.module('md-edit.components').directive('imageUpload', function (FileService, $q, $timeout) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/image-upload.html',
        scope: {},
        link: function (scope, element, attr) {
            var fs = require('fs');
            var request = require('request');
            var md5File = require('md5-file');
            var path_module = require('path');
            var deferred;

            var cancelled = false;

            var imgs = null;

            scope.$on('imageUploadRequired', function (_, data) {
                showDialog(data.data).then(function (data2) {
                    data.deferred.resolve(data2);
                });
            });

            scope.extSupported = function (fName) {
                if (['.jpg', '.jpeg', '.png'].indexOf(path_module.extname(fName).trim().toLowerCase()) != -1) {
                    return true;
                } else {
                    scope.hasUnsupportedExtension = true;
                    return false;
                }
            };

            function error() {
                scope.visible = false;
                sweetAlert({
                    allowEscapeKey: true,
                    title: 'Error',
                    text: 'Bad response from server', //+'\n\n' + body,
                    showConfirmButton: true,
                    showCancelButton: false,
                    type: 'error',
                    allowOutsideClick: true
                });
            }

            scope.visible = false;

            var self = this;

            var exists = {};
            scope.files = [];

            function showDialog(data) {
                imgs = data;
                scope.cancelled = false;
                scope.uploading = false;
                scope.visible = true;
                scope.dataFetchedFromServer = false;
                scope.hasUnsupportedExtension = false;
                scope.fileNotFound = false;
                deferred = $q.defer();
                scope.files.splice(0);
                exists = {};

                var hashes = [];

                var fileStatsPromises = [];

                data.forEach(function (item) {
                    if (exists[item.path.trim()])
                        return;
                    exists[item.path.trim()] = true;

                    var d = $q.defer();
                    fileStatsPromises.push(d.promise);
                    try {
                        fs.stat(item.path, function (err, stats) {

                            var tmp = item.path.split(/[\\\/]/);
                            if (err) {
                                scope.fileNotFound = true;
                                scope.files.push({
                                    name: tmp[tmp.length - 1],
                                    path: item.path,
                                    size: -1,
                                    hash: '',
                                    progress: 0,
                                    serverHas: false
                                });
                                d.resolve();
                                return;
                            }
                            md5File(item.path, function (err, hash) {
                                item.hash = hash;

                                var fileObj = {
                                    name: tmp[tmp.length - 1],
                                    path: item.path,
                                    size: stats["size"],
                                    hash: hash,
                                    progress: 0,
                                    serverHas: false
                                };

                                scope.files.push(fileObj);
                                hashes.push(fileObj.hash);
                                d.resolve();
                            });
                        });

                    } catch (ex) {

                    }
                });

                $q.all(fileStatsPromises).then(function () {
                    scope.fileInfoReady = true;
                    var req = request.post({
                        url: window.server_url + 'file-presence',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        form: {
                            list: hashes
                        }
                    }, function (err, resp, body) {
                        if (err) {
                            error();
                        } else {
                            var rsp = JSON.parse(body);
                            scope.files.forEach(function (file) {
                                file.serverHas = rsp[file.hash];
                            });
                            scope.dataFetchedFromServer = true;
                            scope.$apply();
                        }
                    });
                });
                return deferred.promise;
            }

            scope.upload = function () {
                scope.uploading = true;

                var promises = [];

                scope.files.forEach(function (file) {

                    if (file.serverHas) {
                        promises.push($q.resolve());
                        return;
                    }

                    var deferred = $q.defer();
                    promises.push(deferred.promise);

                    var req = request.post(window.server_url + 'upload', function (err, resp, body) {
                        if (err) {
                            error();
                            deferred.reject();
                        } else {
                            deferred.resolve();
                        }
                    });

                    var interval_id = setInterval(function () {
                        file.progress = req.req.connection._bytesDispatched / file.size;
                        scope.$apply();
                        if (req.req.connection._bytesDispatched >= file.size) {
                            clearInterval(interval_id);
                        }
                    }, 100);
                    var form = req.form();

                    form.append('file', fs.createReadStream(file.path));
                    form.append('filename', (file.name));
                });

                $q.all(promises).then(function () {
                    if (scope.cancelled) return;
                    scope.visible = false;
                    deferred.resolve(imgs);
                })
            };

            scope.cancel = function () {
                scope.cancelled = true;
                scope.visible = false;
                deferred.reject();
            };

        }
    }
});
