angular.module('md-edit')
    .controller('EditorCtrl', function ($scope, $sce, FileService, $rootScope) {
        $scope.editorConfig = JSON.parse(localStorage['editorConfig'] || null) || {fontSize: 20};
        $scope.previewConfig = JSON.parse(localStorage['previewConfig'] || null) || {zoom: 1};

        $scope.$on('EditorScopeApply', function () {
            $scope.$apply();
        });

        window.onbeforeunload = function (e) {
            FileService.exitApp();
            if (!FileService.exitingApp)
                return false;
        };

        $scope.$on('MenuEvent', function (_, type) {
            switch (type) {
                case 'save':
                    $scope.editorDelegate.onSave();
                    break;
                case 'save_as':
                    $scope.editorDelegate.onSave(true);
                    break;
                case 'open':
                    FileService.openFile();
                    break;
                case 'close':
                    FileService.closeCurrentFile();
                    break;
                case 'presentation_mode':
                    $rootScope.presentationMode = !$rootScope.presentationMode;
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
                case 'new':
                    FileService.newFile();
                    break;
                case 'exit':
                    FileService.exitApp();
                    break;
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

        $scope.editorDelegate = {
            onSave: function (saveAs) {
                FileService.saveCurrentFile(saveAs);

            },
            configChanged: function (config) {
                localStorage['editorConfig'] = JSON.stringify(config);
            },
            onChange: function (newValue) {
                FileService.openFiles[FileService.currentlyOpen].html = $sce.trustAsHtml(marked(newValue));
                FileService.openFiles[FileService.currentlyOpen].saved = false;
            },
            onScroll: function (top, height, client_height) {
                $scope.previewDelegate.scrollToPercentage((top ) / (height - client_height));
            }
        };

        $scope.previewDelegate = {
            configChanged: function (config) {
                localStorage['previewConfig'] = JSON.stringify(config);
            }
        };


    });