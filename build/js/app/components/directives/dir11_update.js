angular.module('invoices.directives')
  .directive("inupdate", ['$rootScope', 
                          '$state', 
                          '$mdDialog', 
                          '$log', 
                          'apiSrv', 
    function($rootScope, $state, $mdDialog, $log, apiSrv){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('click', function(ev){
            var invoiceId = $attrs.inupdate,
                projectId = angular.element($element)[0].getAttribute("data-project"),
                invoiceHtml = document.querySelector('.markup').innerHTML,
                progress = document.querySelector("md-progress-linear");
            progress.classList.remove("hidden");
            apiSrv.request('PUT', 'projects/'+projectId+'/statements/'+invoiceId+'/', {markup: invoiceHtml}, function(invoice){
              progress.classList.add("hidden");
              document.getElementById('invoice_'+invoiceId).querySelector('.preview').innerHTML = invoice.markup;
              $rootScope.$emit('updateInvoiceList');
              $mdDialog.cancel();
            }, function(err){$log.error(err);});
          });
        }
      };
    }
  ])
;