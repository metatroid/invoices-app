angular.module('invoices.states', [
               'ui.router',
               'uiRouterStyles'
])
.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams){
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
  var templateDir = 'angular/partials',
      cssDir = "static/assets/css";

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('initial', {
      url: '/',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html'
        },
        'landing@initial': {
          templateUrl: templateDir + '/landing.html',
          controller: 'anonCtrl'
        },
        'auth@initial': {
          templateUrl: templateDir + '/auth.html'
        }
      },
      data: {
        css: cssDir + '/landing.css'
      }
    })
    .state('main', {
      url: '/invoices',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html'
        },
        'landing@main': {
          templateUrl: templateDir + '/auth.html',
          controller: 'authCtrl'
        },
        'app@main': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@main': {
          templateUrl: templateDir + '/nav.html'
        }
      },
      data: {
        css: cssDir + '/app.css'
      }
    });
}]);