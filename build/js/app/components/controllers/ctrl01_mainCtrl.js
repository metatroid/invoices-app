angular.module('invoices.controllers')
  .controller('mainCtrl', ['$rootScope', 
                           '$scope', 
                           '$state', 
                           '$log', 
                           'apiSrv',
    function($rootScope, $scope, $state, $log, apiSrv){
      $scope.showAuthForm = false;
      $scope.toggleAuthForm = function(){
        $scope.showAuthForm = !$scope.showAuthForm;
      };
      $scope.user = {};
      apiSrv.request('GET', 'user', {}, 
        function(user){
          $scope.user = user;
          if(user){
            $scope.bodyclass = "app";
            if($state.is('initial')){
              $state.go('app');
            }
            if($state.is("app.newProject")){
              $rootScope.$emit("showForm");
            }
            if($state.is("app.editProject")){
              var id1 = $state.params.id,
                  index1 = $state.params.index,
                  ev1 = $state.params.event;
              $rootScope.$emit("showEditor", {id: id1, index: index1, ev: ev1});
            }
            if($state.is("app.intervalList")){
              var id2 = $state.params.id,
                  index2 = $state.params.index,
                  ev2 = $state.params.event;
              $rootScope.$emit("showIntervals", {id: id2, index: index2, ev: ev2});
            }
            if($state.is("app.invoicePreview")){
              var id3 = $state.params.id,
                  ev3 = $state.params.event;
              $rootScope.$emit("showInvoice", {id: id3, ev: ev3});
            }
            if($state.is("app.invoiceList")){
              var id4 = $state.params.id,
                  ev4 = $state.params.event;
              $rootScope.$emit("showInvoices", {id: id4, ev: ev4});
            }
            $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){ 
              if(toState.name === "initial"){
                $state.go('app');
              }
            });
          }
        }, 
        function(er){
          $log.error(er);
        }
      );
    }
  ])
;