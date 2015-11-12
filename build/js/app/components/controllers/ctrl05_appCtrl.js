angular.module('invoices.controllers')
  .controller('appCtrl', ['$scope', 
                          '$state', 
                          '$log', 
                          '$sce', 
                          'apiSrv',
                          'msgSrv',
                          '$mdDialog',
                          '$mdBottomSheet', 
                          '$mdToast', 
                          'djResource', 
                          '$filter',
                          'orderByFilter',
    function($scope, $state, $log, $sce, apiSrv, msgSrv, $mdDialog, $mdBottomSheet, $mdToast, djResource, $filter, orderByFilter){
      $scope.htmlSafe = $sce.trustAsHtml;
      $scope.showPaid = false;
      $scope.onlyActiveProjects = true;
      var baseViewChange = false,
          overlay = false;
      var progressIndicator = document.querySelector('.application-progress-indicator');
      $scope.openProject = 0;
      $scope.currentState = $state.current.name;
      $scope.$on('updateState', function(){
        switch(msgSrv.state.fn){
          case "showForm":
            $scope.showNewProjectForm();
            break;
          case "showEditor":
            $scope.showProjectEditor(msgSrv.state.args.event, msgSrv.state.args.id, msgSrv.state.args.index);
            break;
          case "showIntervals":
            $scope.showIntervalList(msgSrv.state.args.event, msgSrv.state.args.id, msgSrv.state.args.index);
            break;
          case "showInvoice":
            $scope.openInvoiceDialog(msgSrv.state.args.id, msgSrv.state.args.event);
            break;
          case "showInvoices":
            $scope.openInvoiceList(msgSrv.state.args.id, msgSrv.state.args.event);
            break;
          default:
            $log.info(msgSrv.state);
            break;
        }
      });

      $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        $scope.currentState = toState.name;
        baseViewChange = false;
        var from = fromState.name;
        var id = toParams.id,
            index = toParams.index,
            ev = toParams.event;
        switch($scope.currentState){
          case "app":
            $mdDialog.cancel();
            $mdBottomSheet.hide();
            break;
          case "initial":
            $state.go('app');
            break;
          case "app.settings":
            baseViewChange = true;
            break;
          case "app.calendar":
            baseViewChange = true;
            break;
          case "app.archive":
            baseViewChange = true;
            break;
          case "app.newProject":
            if(!overlay){$scope.showNewProjectForm();}
            break;
          case "app.editProject":
            if(!overlay){$scope.showProjectEditor(ev, id, index);}
            break;
          case "app.intervalList":
            if(!overlay){$scope.showIntervalList(ev, id, index);}
            break;
          case "app.invoicePreview":
            if(!overlay){$scope.openInvoiceDialog(id, ev);}
            break;
          case "app.invoiceList":
            if(!overlay){$scope.openInvoiceList(id, ev);}
            break;
          default:
            break;
        }
      });
      var Project = djResource('api/projects/:id', {'id': "@id"});
      $scope.projects = Project.query(function(projects){
        projects = orderByFilter(projects, ['-active', 'position', 'created_at']);
      });
      $scope.newProject = new Project();
      $scope.newProject.hourly_rate = $scope.user.default_rate;
      $scope.newProject.deadline = $filter('date')($scope.newProject.deadline_date, 'yyyy-MM-dd'); // js date format workaround

      $scope.sortProjects = function(item, partFrom, partTo, indexFrom, indexTo){
        progressIndicator.classList.remove("hidden");
        var data = {projectList: partFrom};
        apiSrv.request('POST', 'projects/project_sort/', data,
          function(data){
            progressIndicator.classList.add("hidden");
          },
          function(err){
            $log.error(err);
            progressIndicator.classList.add("hidden");
          }
        );
      };
      $scope.showNewProjectForm = function(ev){
        $mdDialog.show({
          controller: function(){
            this.parent = $scope;
            this.parent.newProject.hourly_rate = $scope.user.default_rate;
            this.parent.newProject.deadline = $filter('date')(this.parent.newProject.deadline_date, 'yyyy-MM-dd'); // js date format workaround
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/project-new.html',
          parent: angular.element(document.querySelector('.view-panel.project-view')),
          targetEvent: ev,
          clickOutsideToClose: true,
          onComplete: function(){
            document.getElementsByTagName('md-dialog-content')[0].scrollTop = 0;
            document.querySelectorAll("md-dialog-content input")[0].focus();
            overlay = true;
            document.querySelector('.view-panel.project-view').classList.add('no-scroll');
          }
        }).finally(function(){
          if(!baseViewChange){
            $state.go("app");
          }
          overlay = false;
          document.querySelector('.view-panel.project-view').classList.remove('no-scroll');
        });
      };
      $scope.closeDialog = function() {
        $mdDialog.cancel();
        overlay = false;
      };
      function closeToast(){
        $mdToast.hide();
      }
      
      $scope.createProject = function(data){
        var that = this;
        $scope.newProject.deadline = data.deadline_date;
        $scope.newProject.position = $scope.projects.length;
        apiSrv.request('POST', 'projects/', $scope.newProject, function(project){
          $scope.closeDialog();
          that.projects.push(project);
          that.newProject = new Project();
        }, function(err){
          $log.error(err);
        });
      };
      $scope.deleteProject = function(ev, project){
        var confirm = $mdDialog.confirm()
            .title('You are about to delete this project.')
            .content('This action cannot be undone. Are you sure you wish to proceed?')
            .ariaLabel('Confirm delete')
            .targetEvent(ev)
            .ok('Delete this project')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+project.id, {},
            function(data){
              $scope.projects.splice($scope.projects.indexOf(project), 1);
            },
            function(err){
              $log.error(err);
            }
          );
        }, function() {
          $log.info('cancelled delete');
        });
      };
      $scope.showProjectEditor = function(ev, projectId, index){
        apiSrv.request('GET', 'projects/'+projectId, {}, function(project){
          $mdDialog.show({
            controller: function(){
              this.parent = $scope;
              this.parent.project = project;
              if(this.parent.project.deadline){
                this.parent.project.deadline_date = new Date(this.parent.project.deadline);
              }
              for(var i=0;i<$scope.projects.length;i++){
                if($scope.projects[i].id == projectId){
                  index = i; //get unfiltered index
                }
              }
              this.parent.project_index = index;
            },
            controllerAs: 'ctrl',
            templateUrl: 'angular/partials/project-edit.html',
            parent: angular.element(document.querySelector('.view-panel.active')),
            targetEvent: ev,
            clickOutsideToClose: true,
            onComplete: function(){
              overlay = true;
              document.getElementsByTagName('md-dialog-content')[0].scrollTop = 0;
              var panel = document.querySelector('.view-panel.active');
              panel.scrollTop = 0;
              panel.classList.add('no-scroll');
            }
          }).finally(function(){
            if(!baseViewChange && $scope.currentState !== 'app.archive'){
              $state.go("app");
            }
            overlay = false;
            document.querySelector('.view-panel.active').classList.remove('no-scroll');
          });
        }, function(err){$log.error(err);});
      };
      $scope.updateProject = function(data, index){
        data.deadline = data.deadline_date;
        apiSrv.request('PUT', 'projects/'+data.id, data, function(project){
          $scope.closeDialog();
          if((typeof $scope.projectTiming[data.id] === 'undefined') || !$scope.projectTiming[data.id].timerRunning){
            $scope.projects.splice(index, 1, project);
          } else {
            var toast = $mdToast.simple()
                          .content("Changes will be reflected when this project's timer is saved or discarded.")
                          .action('Ok')
                          .highlightAction(false)
                          .hideDelay(10000)
                          .position('top right');
            $mdToast.show(toast).then(function(){});
          }
          $scope.projects = orderByFilter($scope.projects, ['-active', 'position', 'created_at']);
        }, function(err){$log.error(err);});
      };
      $scope.$on('updateProject', function(){
        var project = msgSrv.msgArgs.args,
            pid = project.id;
        if((typeof $scope.projectTiming[pid] === 'undefined') || !$scope.projectTiming[pid].timerRunning){
          Project.get({id: pid}, function(data){
            var ix = 0;
            for(var i=0;i<$scope.projects.length;i++){
              if($scope.projects[i].id == pid){
                ix = i;
              }
            }
            $scope.projects.splice(ix, 1, data);
          });
        } else {
          var toast = $mdToast.simple()
                        .content("Changes will be reflected when this project's timer is saved or discarded.")
                        .action('Ok')
                        .highlightAction(false)
                        .hideDelay(10000)
                        .position('top right');
          $mdToast.show(toast).then(function(){});
        }
      });

      $scope.timeEvent = "startTimer";
      var timerRunning = false;
      $scope.timers = [];
      $scope.projectTiming = {};
      var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
      
      var startTimer = function(id){
        $scope.timeEvent = "startTimer";
        $scope.projectTiming[id] = typeof $scope.projectTiming[id] === "undefined" ? {} : $scope.projectTiming[id];
        $scope.projectTiming[id].timerRunning = true;
        msgSrv.setTimingStatus($scope.projectTiming);
        var timerEl = document.getElementById("project_"+id).querySelector(".timer");
        timerEl.classList.remove('saving');
        if($scope.timers.indexOf(id) === -1){
          $scope.timers.push(id);
          apiSrv.request('POST', 'projects/'+id+'/intervals/', {start: (new Date())},
           function(data){
            $scope.projectTiming[id].interval = data.id;
           },
           function(err){
            $log.error(err);
           }
          );
        }
      };
      var stopTimer = function(id){
        $scope.timeEvent = "stopTimer";
        $scope.projectTiming[id].timerRunning = false;
        msgSrv.setTimingStatus($scope.projectTiming);
        var intervalId = $scope.projectTiming[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer"),
            counter = document.getElementById("project_"+id).querySelector(".counter");
        timerEl.setAttribute('data-interval', intervalId);
        timerEl.classList.add('saving');
        Interval.get({project_id: id, id: intervalId}, function(interval){
          var start = new Date(interval.start),
              diff = counter.textContent,
              timeDiff = timeDeltaToSeconds(diff),
              newEnd = new Date(start.getTime() + timeDiff*1000);
          apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', {end: newEnd},
            function(data){
              document.getElementById("project_"+id).querySelector(".counter").setAttribute('data-interval', intervalId);
            },
            function(err){
              $log.error(err);
            }
          );
        });
      };
      $scope.startstopTimer = function(id){
        // var ix = $scope.timers.indexOf(id);
        if(!timerRunning && (typeof $scope.projectTiming[id] === "undefined" || !$scope.projectTiming[id].timerRunning)){
          startTimer(id);
        } else {
          stopTimer(id);
        }
      };

      $scope.intervalObj = {"description": ""};
      $scope.saveInterval = function(project){
        var intervalData = {
          "description": $scope.intervalObj.description
        };
        var intervalId = $scope.projectTiming[project.id].interval,
            timerEl = document.getElementById("project_"+project.id).querySelector(".timer"),
            timerBtn = timerEl.querySelector('.counter'),
            intervalIx = $scope.timers.indexOf(intervalId);
        apiSrv.request('PUT', 'projects/'+project.id+'/intervals/'+intervalId+'/', intervalData,
          function(data){
            $scope.projects.splice($scope.projects.indexOf(project), 1, data);
            $scope.projectTiming[project.id].timerRunning = false;
            msgSrv.setTimingStatus($scope.projectTiming);
            $scope.timers.splice(intervalIx, 1);
            $scope.timeEvent = "startTimer";
            $scope.intervalObj.description = "";
          },
          function(err){
            $log.error(err);
          }
        );
      };
      $scope.discardInterval = function(project, index, ev){
        index = $scope.projects.indexOf(project);
        var intervalId = $scope.projectTiming[project.id].interval,
            confirm = $mdDialog.confirm()
              .title('You are about to discard this time period.')
              .content('This action cannot be undone. Are you sure you wish to proceed?')
              .ariaLabel('Confirm discard')
              .targetEvent(ev)
              .ok('Discard this interval')
              .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+project.id+'/intervals/'+intervalId+'/', {},
            function(data){
              $scope.projects.splice(index, 1, data);
              $scope.projectTiming[project.id].timerRunning = false;
              msgSrv.setTimingStatus($scope.projectTiming);
              $scope.timers.splice(index, 1);
              $scope.timeEvent = "startTimer";
            },
            function(err){
              $log.error(err);
            }
          );
        }, function() {
          $log.info('cancelled delete');
        });
      };
      
      $scope.showIntervalList = function(ev, pid, index){
        for(var i=0;i<$scope.projects.length;i++){
          if($scope.projects[i].id == pid){
            index = i; //get original index from filtered collection
          }
        }
        $scope.openProject = index;
        overlay = true;
        document.querySelector('.view-panel.project-view').scrollTop = 0;
        document.querySelector('.view-panel.project-view').classList.add('no-scroll');
        msgSrv.setScope('appCtrl', $scope);
        msgSrv.setVars({pid: pid,
                        ev: ev,
                        index: index
        });
        $mdBottomSheet.show({
          controller: 'intervalListCtrl',
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/interval-list.html',
          parent: angular.element(document.querySelector('.view-panel.project-view'))
        }).finally(function(){
          if(!baseViewChange){
            $state.go("app");
          }
          document.querySelector('.view-panel.project-view').classList.remove('no-scroll');
          overlay = false;
        });
      };

      $scope.showInvoiceMenu = function($mdOpenMenu, ev){
        $mdOpenMenu(ev);
      };
      $scope.openInvoiceDialog = function(projectId, ev){
        document.querySelector('.view-panel.active').scrollTop = 0;
        apiSrv.request('GET', 'projects/'+projectId, {}, function(project){
          $mdDialog.show({
            controller: function(){
              this.parent = $scope;
              this.parent.project = project;
              this.parent.today = new Date();
              this.parent.invoice_number = pad(project.statements.length + 1, 3);
            },
            controllerAs: 'ctrl',
            templateUrl: 'angular/partials/invoice-display.html',
            parent: angular.element(document.querySelector('.view-panel.active')),
            targetEvent: ev,
            clickOutsideToClose: true,
            onComplete: function(){
              overlay = true;
              document.querySelector('.view-panel.active').classList.add('no-scroll');
            }
          }).finally(function(){
            if(!baseViewChange && $scope.currentState !== 'app.archive'){
              $state.go("app");
            }
            overlay = false;
            document.querySelector('.view-panel.active').classList.remove('no-scroll');
          });
        }, function(err){$log.error(err);});
      };
      
      $scope.openInvoiceList = function(pid, ev){
        overlay = true;
        document.querySelector('.view-panel.project-view').scrollTop = 0;
        document.querySelector('.view-panel.project-view').classList.add('no-scroll');
        msgSrv.setScope('appCtrl', $scope);
        msgSrv.setVars({pid: pid,
                        ev: ev
        });
        $mdBottomSheet.show({
          controller: 'invoiceListCtrl',
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/invoice-list.html',
          parent: angular.element(document.querySelector('.view-panel.project-view'))
        }).finally(function(){
          if(!baseViewChange){
            $state.go("app");
          }
          document.querySelector('.view-panel.project-view').classList.remove('no-scroll');
          overlay = false;
        });
      };

      $scope.deleteInvoice = function(project, invoice, index, ev){
        var that = this;
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
              project.statements.splice(index, 1);
            },
            function(err){
              $log.error(err);
            }
          );
        }, function() {
          $log.info('cancelled delete');
        });
      };
    }
  ])
;