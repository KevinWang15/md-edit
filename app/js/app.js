// window.server_url = "http://127.0.0.1:13636/";
window.server_url = "http://139.196.50.217:13636/";


angular.module('md-edit.components', []);
angular.module('md-edit.services', []);
angular.module('md-edit', ['ui.router', 'md-edit.components', 'md-edit.services', 'ui.ace']);

angular.module('md-edit')
    .run(function ($rootScope) {
        $rootScope.indicator = {};
        setupMarked();
        setupElectron();
    })

    .config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {

        $stateProvider
            .state('index', {
                url: "/",
                templateUrl: "templates/pages/editor.html",
                controller: 'EditorCtrl'
            });

        $urlRouterProvider.otherwise('/');
    }]);