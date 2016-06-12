angular.module('md-edit.services')
    .service('FileService', function ($sce, $rootScope, $q) {
        var fs = require('fs');

        var self = this;

        var request = require('request');

        this.openFiles = [];
        this.recentFiles = [];
        this.currentlyOpen = 0;
        this.exitingApp = false;


        if (!!localStorage['recentFiles'])
            try {
                this.recentFiles = JSON.parse(localStorage['recentFiles']);
            } catch (ex) {
                this.recentFiles = [];
            }


        function setRecentFilesMenu() {

            var items = [];


            self.recentFiles.forEach(function (file) {
                items.push(
                    {
                        label: file,
                        click: function () {
                            $rootScope.$broadcast('MenuEvent', {type: 'recent_file', path: file})
                        }
                    }
                );
            });

            if (items.length > 0) {

                items.push(
                    {
                        type: 'separator'
                    });

                items.push(
                    {
                        label: 'Clear Recent Files',
                        click: function () {
                            $rootScope.$broadcast('MenuEvent', 'clear_recent_files')
                        }
                    });
            }

            for (var i = 0; i < window.menuTemplate[0].submenu.length; i++) {
                if (window.menuTemplate[0].submenu[i].recentFiles) {
                    window.menuTemplate[0].submenu[i].submenu = items;
                    break;
                }
            }

            window.electron.Menu.setApplicationMenu(window.electron.Menu.buildFromTemplate(window.menuTemplate));
        }

        setRecentFilesMenu();

        var getTitle = function (dir) {
            var tmp = dir.split(/[\/\\]/m);
            return tmp[tmp.length - 1];
        };

        var mdDialogFilters = [
            {name: "Markdown files (*.md)", extensions: ['md']},
            {name: "Text files (*.txt)", extensions: ['txt']},
            {name: "All (*.*)", extensions: ['*']}
        ];

        this.clearRecentFiles = function () {
            sweetAlert({
                title: 'Are you sure?',
                text: 'Are you sure to clear all recent files?',
                type: 'question',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showCancelButton: true
            }).then(function (confirm) {
                if (confirm) {
                    localStorage['recentFiles'] = '[]';
                    self.recentFiles = [];
                    setRecentFilesMenu();
                    sweetAlert({
                        title: 'Recent files cleared.',
                        type: 'success'
                    });
                }
            });
        };


        this.newFile = function () {
            self.openFiles.splice(self.currentlyOpen + 1, 0, {
                title: "New Document",
                path: "",
                saved: true,
                text: "",
                scrollPos: 0,
                html: $sce.trustAsHtml('')
            });
            self.currentlyOpen++;
            if (self.currentlyOpen >= self.openFiles.length)
                self.currentlyOpen = self.openFiles.length - 1;
            $rootScope.$broadcast('fileSwitched');
        };

        this.newFile();

        function pushToRecentFiles(fPath) {
            self.recentFiles.remove(fPath);
            self.recentFiles.unshift(fPath);
            self.recentFiles.splice(10);
            setRecentFilesMenu();
        }

        self._openFile = function (fPath) {
            pushToRecentFiles(fPath);

            localStorage['recentFiles'] = JSON.stringify(self.recentFiles);

            if (!!fPath) {
                for (var i = 0; i < self.openFiles.length; i++) {
                    if (self.openFiles[i].path == fPath) {
                        break;
                    }
                }
                if (i < self.openFiles.length) {
                    self.switchFile(i);
                    return;
                }
            }


            var obj = {
                title: getTitle(fPath),
                path: fPath,
                saved: true,
                scrollPos: 0,
                text: fs.readFileSync(fPath, {encoding: 'utf8'})
            };


            self.openFiles.splice(self.currentlyOpen + 1, 0, obj);
            self.currentlyOpen++;

            if (self.openFiles.length == 2 && (!self.openFiles[0].text) && (self.openFiles[0].saved) && (!self.openFiles[0].path)) {
                self.openFiles.splice(0, 1);
                self.currentlyOpen--;
            }

            obj.html = $sce.trustAsHtml(marked(obj.text));
            $rootScope.$broadcast('fileSwitched');
            $rootScope.$broadcast('EditorScopeApply');
        };

        this.exitApp = function () {
            var unsaved = [];
            for (var i = 0; i < self.openFiles.length; i++) {
                if (!self.openFiles[i].saved)
                    unsaved.push(self.openFiles[i].title)
            }
            if (unsaved.length == 0) {
                self.exitingApp = true;
                window.electron.app.quit();
            } else {
                var result = window.electron.dialog.showMessageBox({
                    type: 'question',
                    title: 'Unsaved changes',
                    message: 'You have unsaved changes to the following file' + (unsaved.length > 1 ? 's' : '') + ':\n\n' + unsaved.join('\n') + "\n\nAre you sure to exit?",
                    buttons: ['Yes', 'No']
                });
                if (result == 0) {
                    self.exitingApp = true;
                    window.electron.app.quit();
                }
            }
        };

        this.openFile = function () {
            var path = window.electron.remote.dialog.showOpenDialog({
                filters: mdDialogFilters,
                properties: ['openFile', 'multiSelections']
            });

            if (!!path)
                path.forEach(function (path) {
                    self._openFile(path);
                })
        };

        this.closeFile = function (i) {
            var quit = $q.defer();
            if (!self.openFiles[i].saved) {
                var result = window.electron.dialog.showMessageBox({
                    type: 'question',
                    title: 'Unsaved changes',
                    message: 'Would you like to save your changes for ' + self.openFiles[i].title + "?",
                    buttons: ['Yes', 'No', 'Cancel']
                });
                console.log(result);
                if (result == 2) {
                    quit.reject();
                }

                if (result == 0) {
                    self.saveFile(i);
                }
                quit.resolve();
            } else {
                quit.resolve();
            }
            quit.promise.then(function () {
                self.openFiles.splice(i, 1);
                if (self.openFiles.length == 0) {
                    window.electron.app.quit();
                } else {
                    if (self.currentlyOpen >= self.openFiles.length)
                        self.currentlyOpen--;
                    $rootScope.$broadcast('fileSwitched');
                }

            });
        };

        this.closeCurrentFile = function () {
            self.closeFile(self.currentlyOpen);
        };

        this.saveCurrentFile = function (saveAs) {
            self.saveFile(self.currentlyOpen, saveAs);
        };


        this.switchFile = function (id) {
            self.currentlyOpen = id;
            $rootScope.$broadcast('fileSwitched');
        };

        this.switchTo = function (increment) {
            if (increment == 1) {
                self.currentlyOpen++;
                if (self.currentlyOpen >= self.openFiles.length)
                    self.currentlyOpen = 0;
            } else if (increment == -1) {
                self.currentlyOpen--;
                if (self.currentlyOpen < 0)
                    self.currentlyOpen = self.openFiles.length - 1;
            }
            $rootScope.$broadcast('fileSwitched');
        };

        this.saveFile = function (i, saveAs) {
            var path = self.openFiles[i].path;
            if (!!saveAs || !path)
                path = window.electron.remote.dialog.showSaveDialog({
                    filters: mdDialogFilters,
                    properties: ['openFile', 'openDirectory', 'createDirectory']
                });

            if (!path)
                return;

            pushToRecentFiles(path);


            fs.writeFileSync(path, self.openFiles[i].text, {encoding: 'utf8'});
            self.openFiles[i].path = path;
            self.openFiles[i].title = getTitle(path);
            self.openFiles[i].saved = true;
            $rootScope.$broadcast('EditorScopeApply');
        };

        const ipc = require('electron').ipcRenderer;
        const reply = ipc.sendSync('query-argv');
        console.log(reply);

        reply.forEach(function (argv) {
            fs.exists(argv, function (exists) {
                if (exists) {
                    self._openFile(argv);
                }
            });
        });

        $rootScope.fs = this;
    });
