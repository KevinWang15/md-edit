angular.module('md-edit.components').directive('tabs', function (FileService) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/tabs.html',
        scope: {
            files: '='
        },
        link: function (scope, element, attr) {
            scope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
            scope.switchFile = function (index) {
                FileService.switchFile(index);
                scope.safeApply();
            }
        }
    }
});
