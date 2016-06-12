angular.module('md-edit')
    .controller('EditorCtrl', function ($scope, $element, $sce, $q, FileService, $rootScope, PdfExport, MdStruct, $timeout) {
        $scope.editorConfig = JSON.parse(localStorage['editorConfig'] || null) || {fontSize: 20};
        $scope.previewConfig = JSON.parse(localStorage['previewConfig'] || null) || {zoom: 1};
        $rootScope.scrollSync = true;

        var self = this;

        var $separator = $('.separator', $element);

        var draggingSeparator = false;

        $separator.bind('mousedown', function () {
            draggingSeparator = true;
        });

        var element = $($element)[0];

        element.ondragover = element.ondragend = element.ondragleave = function () {
            return false;
        };

        element.ondrop = function (e) {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            FileService._openFile(file.path);
            return false;
        };


        $element.bind('mousemove', function (e) {
            if (draggingSeparator) {
                var editorWidth = $('.page-editor').width();
                if (e.pageX < 60 || e.pageX > editorWidth - 60) return;
                $scope.separatorPos.left = e.pageX;
                $scope.separatorPos.percentage = $scope.separatorPos.left / editorWidth;
                onWindowResize();
                $scope.safeApply();
            }
        });

        $(window).mouseup(function () {
            draggingSeparator = false;
        });

        $scope.$on('EditorScopeApply', function () {
            $scope.$apply();
        });

        $scope.safeApply = function (fn) {
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };
        function calcSeparatorPos() {
            $scope.separatorPos.windowWidth = $('.page-editor').width();
            $scope.separatorPos.left = $scope.separatorPos.windowWidth * $scope.separatorPos.percentage;
            $scope.safeApply();
        }

        var resizing = false;

        function resize() {
            var html = marked(FileService.openFiles[FileService.currentlyOpen].text);
            MdStruct.buildMap(FileService.openFiles[FileService.currentlyOpen].text, html, $preview);
        }

        function onWindowResize() {
            calcSeparatorPos();
            if (!resizing) {
                resizing = true;
                $timeout(function () {
                    resizing = false;
                    resize();
                }, 500);
            }
        }

        var editorSession;

        function syncScroll() {
            var _topRow = (self._editor.renderer.getScrollTopRow());
            var i = 0;

            var last = 0;

            for (var topRow = 0; topRow < _topRow; topRow++) {
                last = i;
                i += editorSession.getRowLength(topRow);
                if (i > _topRow) break;
            }

            var offset = (_topRow - last) / editorSession.getRowLength(topRow);
            $scope.previewDelegate.scrollTo(MdStruct.getScrollTop(topRow + offset));
        }

        function aceLoaded(_editor) {
            const remote = window.electron.remote;
            const Menu = window.electron.Menu;
            const MenuItem = window.electron.MenuItem;

            const menu = new Menu();
            var menuItems = [
                new MenuItem({
                    label: 'Cut',
                    role: 'cut'
                }),
                new MenuItem({
                    label: 'Copy',
                    role: 'copy'
                }),
                new MenuItem({
                    label: 'Paste',
                    role: 'paste'
                }),
                new MenuItem({
                    label: 'Delete',
                    role: 'delete'
                }),
                new MenuItem({
                    type: 'separator'
                }),
                new MenuItem({
                    label: 'Undo',
                    click: function () {
                        _editor.getSession().getUndoManager().undo();
                    }
                }),
                new MenuItem({
                    label: 'Redo',
                    click: function () {
                        _editor.getSession().getUndoManager().redo();
                    }
                }),
                new MenuItem({
                    type: 'separator'
                }),

                new MenuItem({
                    label: 'Select All',
                    click: function () {
                        _editor.selectAll();
                    }
                })
            ];

            menuItems.forEach(function (item) {
                menu.append(item);
            });
            var $aceEditor = $('.ace_editor', $element);

            $aceEditor[0].addEventListener('contextmenu', function (e) {
                e.preventDefault();
                menu.popup(remote.getCurrentWindow())
            }, false);

            self._editor = _editor;
            _editor.$blockScrolling = Infinity;
            _editor.setFontSize($scope.editorConfig.fontSize);

            _editor.on("changeSelection", function () {
                var c = _editor.selection.lead;
                $rootScope.indicator.text = (c.row + 1) + ":" + c.column;
                $scope.safeApply();
            });


            editorSession = _editor.getSession();
            editorSession.on("changeScrollTop", function () {
                FileService.openFiles[FileService.currentlyOpen].scrollPos = _editor.renderer.getScrollTop();
                if (!$rootScope.scrollSync) return;
                syncScroll();
            });


            $scope.separatorPos = {
                windowWidth: 0,
                percentage: 0.5,
                left: -10000
            };


            calcSeparatorPos();


            $(window).resize(onWindowResize);

            $scope.$on('fileSwitched', function () {
                resize();
                self._editor.renderer.scrollToY(FileService.openFiles[FileService.currentlyOpen].scrollPos);
                $timeout(function () {
                    syncScroll();
                });
            });

            $aceEditor.bind('mousewheel DOMMouseScroll', function (event) {
                if (event.ctrlKey == true) {
                    event.preventDefault();
                    if (event.originalEvent.deltaY < 0) {
                        $scope.editorConfig.fontSize += 1.5;
                        if ($scope.editorConfig.fontSize > 50)
                            $scope.editorConfig.fontSize = 50;
                        $scope.$apply();
                    } else {
                        $scope.editorConfig.fontSize -= 1.5;
                        if ($scope.editorConfig.fontSize < 10)
                            $scope.editorConfig.fontSize = 10;
                        $scope.$apply();
                    }

                    _editor.setFontSize($scope.editorConfig.fontSize);
                    localStorage['editorConfig'] = JSON.stringify($scope.editorConfig);
                }
            });
        }

        $scope.aceConfig = {
            useWrapMode: true,
            showGutter: true,
            mode: 'markdown',
            theme: 'github',
            showPrintMargin: false,
            onLoad: aceLoaded
        };


        window.onbeforeunload = function (e) {
            FileService.exitApp();
            if (!FileService.exitingApp)
                return false;
        };

        $scope.$on('MenuEvent', function (_, type) {
            if (typeof type == 'string') {
                var i;
                switch (type) {
                    case 'save':
                        FileService.saveCurrentFile();
                        break;
                    case 'save_as':
                        FileService.saveCurrentFile(true);
                        break;
                    case 'undo':
                        self._editor.getSession().getUndoManager().undo();
                        break;
                    case 'redo':
                        self._editor.getSession().getUndoManager().redo();
                        break;
                    case 'open':
                        FileService.openFile();
                        break;
                    case 'close':
                        FileService.closeCurrentFile();
                        break;
                    case 'presentation_mode':
                        $rootScope.presentationMode = !$rootScope.presentationMode;

                        //TODO: refactor
                        for (i = 0; i < window.menuTemplate[2].submenu.length; i++)
                            if (window.menuTemplate[2].submenu[i].presentationMode)
                                break;

                        window.menuTemplate[2].submenu[i].checked = $rootScope.presentationMode;
                        break;
                    case 'print':
                        if (!$rootScope.presentationMode) {
                            $rootScope.presentationMode = true;
                            $scope.$apply();
                            window.print();
                            $rootScope.presentationMode = false;
                        } else {
                            window.print();
                        }
                        break;
                    case 'export_pdf':
                        PdfExport.export();
                        break;
                    case 'export_pdf_web':
                        PdfExport.exportWebService();
                        break;
                    case 'new':
                        FileService.newFile();
                        break;
                    case 'clear_recent_files':
                        FileService.clearRecentFiles();
                        break;

                    case 'toggle_scroll_sync':
                        for (i = 0; i < window.menuTemplate[2].submenu.length; i++)
                            if (window.menuTemplate[2].submenu[i].scrollSync)
                                break;

                        $rootScope.scrollSync = !$rootScope.scrollSync;
                        window.menuTemplate[2].submenu[i].checked = $rootScope.scrollSync;

                        break;
                    case 'toggle_word_wrap':
                        for (i = 0; i < window.menuTemplate[2].submenu.length; i++)
                            if (window.menuTemplate[2].submenu[i].wordWrap)
                                break;

                        window.menuTemplate[2].submenu[i].checked = !window.menuTemplate[2].submenu[i].checked;

                        self._editor.getSession().setUseWrapMode(window.menuTemplate[2].submenu[i].checked);

                        break;

                    case 'toggle_line_no':
                        for (i = 0; i < window.menuTemplate[2].submenu.length; i++)
                            if (window.menuTemplate[2].submenu[i].lineNo)
                                break;

                        window.menuTemplate[2].submenu[i].checked = !window.menuTemplate[2].submenu[i].checked;
                        self._editor.renderer.setShowGutter(window.menuTemplate[2].submenu[i].checked);
                        break;


                    case 'toggle_vim':
                        for (i = 0; i < window.menuTemplate[1].submenu.length; i++)
                            if (window.menuTemplate[1].submenu[i].vimMode)
                                break;

                        window.menuTemplate[1].submenu[i].checked = !window.menuTemplate[1].submenu[i].checked;

                        if (window.menuTemplate[1].submenu[i].checked) {
                            self._editor.setKeyboardHandler(ace.require("ace/keyboard/vim").handler);
                        } else {
                            self._editor.setKeyboardHandler('');
                        }

                        break;
                    case 'exit':
                        FileService.exitApp();
                        break;
                }
            } else if (typeof type == 'object') {
                if (type.type == 'recent_file') {
                    FileService._openFile(type.path);
                }
            }

            $scope.$apply();
        });

        $(window).keydown(function (event) {
            if (event.keyCode == 9) {
                if (event.ctrlKey == true) {
                    if (event.shiftKey == true) {
                        FileService.switchTo(-1);
                    } else {
                        FileService.switchTo(1);
                    }
                }
                $scope.$apply();
            }
        });


        var $preview;


        $scope.onAceChange = function () {
            var html = marked(FileService.openFiles[FileService.currentlyOpen].text);
            FileService.openFiles[FileService.currentlyOpen].html = $sce.trustAsHtml(html);
            FileService.openFiles[FileService.currentlyOpen].saved = false;

            MdStruct.buildMap(FileService.openFiles[FileService.currentlyOpen].text, html, $preview).then(function () {

            });

        };


        $scope.previewDelegate = {
            ready: function (ele) {
                $preview = ele;
            },
            configChanged: function (config) {
                localStorage['previewConfig'] = JSON.stringify(config);
                onWindowResize();
            }
        };


    });