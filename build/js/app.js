angular.module('invoices', [
               'invoices.controllers',
               'invoices.states',
               'invoices.services',
               'invoices.directives'
]);

angular.module('invoices.states', []);
angular.module('invoices.services', []);
angular.module('invoices.directives', []);

angular.module('invoices')
  .config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
  }
]);
angular.module('invoices.controllers', [])
  .controller('mainCtrl', ['$scope', '$log', 'apiSrv', function($scope, $log, apiSrv){
    apiSrv.request('GET', 'user', {}, 
      function(user){
        $scope.user = user;
        $scope.ready = true;
      }, 
      function(er){
        $log.error(er);
      }
    );
  }])
  .controller('appCtrl', ['$scope', '$log', 'apiSrv', function($scope, $log, apiSrv){
    apiSrv.request('GET', 'projects', {}, 
      function(projects){
        $scope.projects = projects;
      }, 
      function(err){
        $log.error(err);
      }
    );
  }])
;
angular.module('invoices.directives', [])
  .directive('inscroll', ['$window', function($window){
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        angular.element($window).bind('scroll', function(){
          var elements = document.querySelectorAll("[inview]");
          for(var i=0;i<elements.length;i++){
            var el = elements[i],
                top = el.getBoundingClientRect().top;
            if(top<((document.body.clientHeight/2)-150)){
              if(!el.classList.contains('inview')){
                var inviewEvent = new Event('inview');
                el.dispatchEvent(inviewEvent);
              }
            } else {
              var outviewEvent = new Event('outview');
                el.dispatchEvent(outviewEvent);
            }
          }
        });
      }
    };
  }])
  .directive('inview', function(){
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        angular.element(element).on('inview', function(){
          this.classList.add('inview');
        });
        angular.element(element).on('outview', function(){
          this.classList.remove('inview');
        });
      }
    };
  })
;
angular.module('invoices.services')
  .factory('apiSrv', ['$http', function($http){
    var apiSrv = {};

    apiSrv.request = function(method, url, args, successFn, errorFn){
      return $http({
        method: method,
        url: '/api/' + url + ".json",
        data: JSON.stringify(args)
      }).success(successFn);
    };

    return apiSrv;
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
    .state('main', {
      url: '/',
      views: {
        'main': {
          templateUrl: templateDir + '/main.html',
          controller: 'mainCtrl'
        },
        'landing@main': {
          templateUrl: templateDir + '/landing.html',
          controller: 'mainCtrl'
        },
        'app@main': {
          templateUrl: templateDir + '/app-main.html',
          controller: 'appCtrl'
        },
        'nav@main': {
          templateUrl: templateDir + '/nav.html',
          controller: 'appCtrl'
        }
      }
    });
}]);