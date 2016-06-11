angular.module('md-edit.components').directive('preview', function () {
        return {
            restrict: 'E',
            templateUrl: 'templates/directives/preview.html',
            scope: {
                ngModel: '=',
                delegate: '=',
                config: '='
            },
            link: function (scope, element, attr) {

                var $element = $(element);
                var $preview = $('.preview', element);
                var preview = $preview[0];

                scope.delegate.scrollToPercentage = function (percentage) {
                    preview.scrollTop = (preview.scrollHeight - preview.clientHeight) * percentage;
                };

                scope.delegate.scrollTo = function (top) {
                    console.log('scrolling ', top);
                    preview.scrollTop = top;
                };

                const remote = window.electron.remote;
                const Menu = window.electron.Menu;
                const MenuItem = window.electron.MenuItem;

                const menu = new Menu();
                var menuItems = [
                    new MenuItem({
                            label: 'Select All',
                            role: 'selectall'
                        }
                    )];

                menuItems.forEach(function (item) {
                    menu.append(item);
                });

                scope.delegate.ready($('.preview'));
                $(element)[0].addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    menu.popup(remote.getCurrentWindow())
                }, false);

                $(element).bind('mousewheel DOMMouseScroll', function (event) {
                    if (event.ctrlKey == true) {
                        event.preventDefault();
                        if (event.originalEvent.deltaY < 0) {
                            scope.config.zoom += 0.1;
                            if (scope.config.zoom > 3)
                                scope.config.zoom = 3;
                            scope.$apply();
                        } else {
                            scope.config.zoom -= 0.1;
                            if (scope.config.zoom < 0.4)
                                scope.config.zoom = 0.4;
                            scope.$apply();
                        }
                        scope.delegate.configChanged(scope.config);
                    }
                });
            }
        }
    }
);
