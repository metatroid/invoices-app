angular.module('invoices.controllers', [])
  .controller('mainCtrl', ['$scope', '$log', 'apiSrv', function($scope, $log, apiSrv){
    // $scope.bodyclass = "app";
    $scope.showAuthForm = false;
    $scope.toggleAuthForm = function(){
      $scope.showAuthForm = !$scope.showAuthForm;
    };
    apiSrv.request('GET', 'user', {}, 
      function(user){
        $scope.user = user;
        $scope.ready = true;
        if(user){
          $scope.bodyclass = "app";
          // $scope.$apply();
        }
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