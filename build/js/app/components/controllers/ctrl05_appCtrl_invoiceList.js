angular.module('invoices.controllers')
  .controller('invoiceListCtrl', ['$log', 
                                   'apiSrv',
                                   'msgSrv',
                                   'djResource',
                                   'orderByFilter',
                                   '$timeout',
                                   '$mdDialog',
    function($log, apiSrv, msgSrv, djResource, orderByFilter, $timeout, $mdDialog){
      var $scope = msgSrv.getScope('appCtrl');
      var vars = msgSrv.getVars();
      var Project = djResource('api/projects/:id', {'id': "@id"});
      var it = this;
      this.parent = $scope;
      var Invoice = djResource('api/projects/:project_id/statements/:id', {'project_id': '@pid', 'id': "@id"});
      
      this.parent.newInvoice = new Invoice();
      this.parent.invoices = Invoice.query({project_id: vars.pid}, function(invoices){
        it.parent.invoices = orderByFilter(invoices, ['created_at']);
      });
      $scope.$on('updateInvoiceList', function(){
        this.parent.invoices = Invoice.query({project_id: vars.pid}, function(invoices){
          it.parent.invoices = orderByFilter(invoices, ['created_at']);
        });
      });
      this.parent.project = Project.get({id: vars.pid});
      this.parent.editInvoice = function(invoice, index, ev){
        $mdDialog.show({
          controller: function(){
            this.parent = $scope;
            this.parent.invoice = invoice;
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/invoice-edit.html',
          parent: angular.element(document.querySelector('.view-panel.project-view')),
          targetEvent: ev,
          clickOutsideToClose: true,
          onComplete: function(){
            document.querySelector('.view-panel.project-view').scrollTop = 0;
          }
        });
      };
      this.parent.cancelInvoiceEdit = function(e){
        $mdDialog.cancel();
      };
      this.parent.duplicateInvoice = function(projectId, invoice, index, event){
        var actionsParent = event.target.parentElement.parentElement.parentElement,
            progress = actionsParent.querySelector('.invoice-action-progress'),
            actions = actionsParent.querySelector('.md-actions');
        var invoiceIndicator = $timeout(itemProgressIndicator, 500, true, progress, actions);
        apiSrv.request('POST', 'projects/'+projectId+'/statements/', {markup: invoice.markup}, function(data){
          $timeout.cancel(invoiceIndicator);
          $scope.invoices.push(data);
          progress.classList.add('hidden');
          actions.classList.remove('hidden');
          actions.querySelector('button.delete-btn').classList.add('success');
          $timeout(function(){
            actions.querySelector('button.delete-btn').classList.remove('success');
          }, 1000);
        }, function(err){
          $timeout.cancel(invoiceIndicator);
          $log.error(err);
          progress.classList.add('hidden');
          actions.classList.remove('hidden');
        });
      };
      this.parent.deleteInvoice = function(invoice, ev, index){
        var that = this;
        var actionsParent = ev.target.parentElement.parentElement.parentElement,
            progress = actionsParent.querySelector('.invoice-action-progress'),
            actions = actionsParent.querySelector('.md-actions');
        var invoiceIndicator = $timeout(itemProgressIndicator, 500, true, progress, actions);
        var confirm = $mdDialog.confirm()
            .title('You are about to delete this invoice.')
            .content('This action cannot be undone. Are you sure you wish to proceed?')
            .ariaLabel('Confirm delete')
            .targetEvent(ev)
            .ok('Delete this invoice')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+invoice.project+'/statements/'+invoice.id, {},
            function(data){
              $timeout.cancel(invoiceIndicator);
              $scope.invoices.splice(index, 1);
              progress.classList.add('hidden');
              actions.classList.remove('hidden');
              actions.querySelector('button.delete-btn').classList.add('success');
              $timeout(function(){
                actions.querySelector('button.delete-btn').classList.remove('success');
              }, 1000);
            },
            function(err){
              $timeout.cancel(invoiceIndicator);
              $log.error(err);
              progress.classList.add('hidden');
              actions.classList.remove('hidden');
            }
          );
        }, function() {
          $timeout.cancel(invoiceIndicator);
          $log.info('cancelled delete');
          progress.classList.add('hidden');
          actions.classList.remove('hidden');
        });
      };
    }
  ])
;