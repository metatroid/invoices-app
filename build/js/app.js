angular.module('invoices', [
               'invoices.controllers',
               'invoices.states'
]);

angular.module('invoices.controllers', []);

angular.module('invoices')
  .config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
  }
]);
angular.module('invoices.controllers', [])
  .controller('mainCtrl', ['$scope', function($scope){
    $scope.testMessage = "success";
  }])
;
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
    .state('home', {
      url: '/',
      views: {
        'main': {
          templateUrl: templateDir + '/home.html',
          controller: 'mainCtrl'
        }
      }
    });
}]);