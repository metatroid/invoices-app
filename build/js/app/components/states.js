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
    .state('app', {
      url: '/projects',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html'
        },
        'landing@app': {
          templateUrl: templateDir + '/auth.html',
          controller: 'authCtrl'
        },
        'app@app': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@app': {
          templateUrl: templateDir + '/nav.html'
        }
      },
      data: {
        css: cssDir + '/app.css'
      }
    })
    .state('app.settings', {
      url: '/settings',
      views: {
        'profile': {
          templateUrl: templateDir + '/profile.html',
          controller: 'userCtrl'
        }
      }
    })
    .state('app.newProject', {
      url: '/new'
    })
    .state('app.editProject', {
      url: '/edit/:id/:index/:event'
    })
    .state('app.intervalList', {
      url: '/intervals/:id/:index/:event'
    })
    .state('app.invoicePreview', {
      url: '/invoice/:id/:event'
    })
  ;
}]);