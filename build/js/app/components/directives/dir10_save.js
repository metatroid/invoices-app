angular.module('invoices.directives')
  .directive("insave", ['$mdDialog', 
                        '$log', 
                        'apiSrv',
                        'msgSrv',
    function($mdDialog, $log, apiSrv, msgSrv){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('click', function(ev){
            var project = JSON.parse($attrs.insave),
                projectId = project.id,
                invoiceHtml = document.getElementById('invoice').outerHTML,
                progress = document.querySelector("md-progress-linear");
            progress.classList.remove("hidden");
            apiSrv.request('POST', 'projects/'+projectId+'/statements/', {markup: invoiceHtml}, function(invoice){
              progress.classList.add("hidden");
              msgSrv.emitMsg('updateProject', project);
              $mdDialog.show(
                $mdDialog.alert()
                  .parent(angular.element(document.querySelector('.view-panel.active')))
                  .clickOutsideToClose(true)
                  .title('Invoice ready')
                  .content('<button class="invoice-btn md-icon-button md-button md-default-theme">' +
                            '<a href="'+invoice.url+'" target="_blank">' +
                              '<md-icon class="md-default-theme">' +
                                '<span class="fa fa-file-pdf-o"></span>' +
                              '</md-icon> ' +
                              'View PDF' +
                            '</a>' +
                           '</button>'
                          )
                  .ariaLabel('Invoice link')
                  .ok('Dismiss')
                  .targetEvent(ev)
              );
            }, function(err){
              $log.error(err);
            });
          });
        }
      };
    }
  ])
;