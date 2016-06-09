angular.module('md-edit.components').directive('editor', function ($timeout, FileService, $rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/editor.html',
        scope: {
            ngModel: '=',
            delegate: '=',
            config: '='
        },
        link: function (scope, element, attr) {

            var $element = $(element);
            var $textarea = $('textarea', element);
            var textarea = $textarea[0];

            function insertText(myValue) {
                if (textarea.selectionStart || textarea.selectionStart == '0') {
                    var startPos = textarea.selectionStart;
                    var endPos = textarea.selectionEnd;
                    textarea.value = textarea.value.substring(0, startPos)
                        + myValue
                        + textarea.value.substring(endPos, textarea.value.length);
                    textarea.selectionEnd = startPos + myValue.length;
                } else {
                    textarea.value += myValue;
                }
                scope.ngModel = textarea.value;
            }

            $textarea.bind('scroll', function (event) {
                scope.delegate.onScroll(textarea.scrollTop, textarea.scrollHeight, textarea.clientHeight);
            });

            $textarea.bind("keydown click focus", function () {
                $timeout(function () {
                    var tmp = textarea.value.substr(0, textarea.selectionStart).split("\n");
                    $rootScope.indicator.active = true;
                    $rootScope.indicator.row = tmp.length;
                    $rootScope.indicator.col = tmp[tmp.length - 1].length;
                });
            });

            $element.bind('mousewheel DOMMouseScroll', function (event) {
                if (event.ctrlKey == true) {
                    event.preventDefault();
                    if (event.originalEvent.deltaY < 0) {
                        scope.config.fontSize += 1.5;
                        if (scope.config.fontSize > 50)
                            scope.config.fontSize = 50;
                        scope.$apply();
                    } else {
                        scope.config.fontSize -= 1.5;
                        if (scope.config.fontSize < 10)
                            scope.config.fontSize = 10;
                        scope.$apply();
                    }

                    scope.delegate.configChanged(scope.config);
                }
            });

            scope.onChange = function () {
                scope.delegate.onChange(scope.ngModel);
            }
        }
    }
});
