angular.module('invoices.states', [
               'ui.router'
])
.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams){
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
  var templateDir = 'angular/partials';

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('main', {
      url: '/',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html'
        },
        'landing@main': {
          templateUrl: templateDir + '/landing.html',
          controller: 'anonCtrl'
        },
        'app@main': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@main': {
          templateUrl: templateDir + '/nav.html'
        },
        'auth@main': {
          templateUrl: templateDir + '/auth.html'
        }
      }
    });
}]);