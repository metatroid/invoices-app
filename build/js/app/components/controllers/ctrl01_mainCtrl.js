angular.module('invoices.controllers')
  .controller('mainCtrl', ['$scope', 
                           '$state', 
                           '$log', 
                           'apiSrv',
                           'msgSrv',
    function($scope, $state, $log, apiSrv, msgSrv){
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
              msgSrv.setState('showForm');
            }
            if($state.is("app.editProject")){
              var editorSettings = {
                id: $state.params.id,
                index: $state.params.index,
                event: $state.params.event
              };
              msgSrv.setState('showEditor', editorSettings);
            }
            if($state.is("app.intervalList")){
              var intervalSettings = {
                id: $state.params.id,
                index: $state.params.index,
                ev: $state.params.event
              };
              msgSrv.setState('showIntervals', intervalSettings);
            }
            if($state.is("app.invoicePreview")){
              var previewSettings = {
                id: $state.params.id,
                ev: $state.params.event
              };
              msgSrv.setState('showInvoice', previewSettings);
            }
            if($state.is("app.invoiceList")){
              var invoiceSettings = {
                id: $state.params.id,
                ev: $state.params.event
              };
              msgSrv.setState('showInvoices', invoiceSettings);
            }
          }
        }, 
        function(er){
          $log.error(er);
        }
      );
    }
  ])
;