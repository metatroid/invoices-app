angular.module('invoices.controllers')
  .controller('appCtrl', ['$rootScope', 
                          '$scope', 
                          '$state', 
                          '$log', 
                          '$sce', 
                          'apiSrv',
                          '$mdDialog',
                          '$mdBottomSheet', 
                          '$mdToast', 
                          'djResource', 
                          '$timeout', 
                          '$filter',
                          'datetime',
                          'orderByFilter',
    function($rootScope, $scope, $state, $log, $sce, apiSrv, $mdDialog, $mdBottomSheet, $mdToast, djResource, $timeout, $filter, datetime, orderByFilter){
      function pad(n, width, z){
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
      }
      $scope.showPaid = false;
      $rootScope.dialogOpen = false;
      $rootScope.sheetOpen = false;
      var progressIndicator = document.querySelector('.application-progress-indicator');
      $scope.openProject = 0;
      $scope.currentState = $state.current.name;
      $rootScope.$on("showForm", function(){
        $scope.showNewProjectForm();
      });
      $rootScope.$on("showEditor", function(event, args){
        $scope.showProjectEditor(args.e, args.id, args.index);
      });
      $rootScope.$on("showIntervals", function(event, args){
        $scope.showIntervalList(args.e, args.id, args.index);
      });
      $rootScope.$on("showInvoice", function(event, args){
        $scope.openInvoiceDialog(args.id, args.e);
      });
      $rootScope.$on("showInvoices", function(event, args){
        $scope.openInvoiceList(args.id, args.e);
      });

      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        $scope.currentState = toState.name;
        if(toState.name === "app.newProject"){
          $scope.showNewProjectForm();
        }
        if(toState.name === "app.editProject"){
          var id1 = toParams.id,
              index1 = toParams.index,
              e1 = toParams.event;
          $scope.showProjectEditor(e1, id1, index1);
        }
        if(toState.name === "app.intervalList"){
          var id2 = toParams.id,
              index2 = toParams.index,
              e2 = toParams.event;
          $scope.showIntervalList(e2, id2, index2);
        }
        if(toState.name === "app.invoicePreview"){
          var id3 = toParams.id,
              e3 = toParams.event;
          $scope.openInvoiceDialog(id3, e3);
        }
        if(toState.name === "app.invoiceList"){
          var id4 = toParams.id,
              e4 = toParams.event;
          $scope.openInvoiceList(id4, e4);
        }
        if(fromState.name === "app.newProject" || fromState.name === "app.editProject" || fromState.name === "app.invoicePreview" || fromState.name === "app.intervalList"){
          if(toState.name === "app"){
            if($rootScope.dialogOpen){
              $scope.closeDialog();
            }
          } else {
            $mdDialog.cancel();
          }
        }
        if(fromState.name === "app.intervalList" || fromState.name === "app.invoiceList"){
          if(toState.name === "app"){
            $rootScope.stateChange = false;
          } else {
            $rootScope.stateChange = true;
          }
          if($rootScope.sheetOpen){
            $mdBottomSheet.hide();
          }
        }
      });
      var Project = djResource('api/projects/:id', {'id': "@id"});
      $scope.projects = Project.query(function(projects){
        projects = orderByFilter(projects, ['position', 'created_at']);
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
          parent: angular.element(document.querySelector('.view-panel.active')),
          targetEvent: ev,
          clickOutsideToClose: true,
          onComplete: function(){
            document.getElementsByTagName('md-dialog-content')[0].scrollTop = 0;
            document.querySelectorAll("md-dialog-content input")[0].focus();
            $rootScope.dialogOpen = true;
          }
        });
      };
      $scope.closeDialog = function() {
        $mdDialog.cancel();
        $rootScope.dialogOpen = false;
        $state.go("app");
      };
      function closeToast(){
        $mdToast.hide();
      }
      
      function xhrfile() {
        return supportFileAPI() && supportAjaxUploadProgressEvents();
        function supportFileAPI() {
            var input = document.createElement('input');
            input.type = 'file';
            return 'files' in input;
        }
        function supportAjaxUploadProgressEvents() {
            var xhr = new XMLHttpRequest();
            return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
        }
      }
      $scope.createProject = function(data){
        var that = this;
        if(!xhrfile() && data.project_logo){
          var toast = $mdToast.simple()
                        .content('Your browser does not support xhr file uploads. Selected image will be removed.')
                        .action('Ok')
                        .highlightAction(false)
                        .hideDelay(6000)
                        .position('top right');
          $mdToast.show(toast).then(function(){
            if(data.project_logo){
              data.project_logo = null;
            }
          });
        }
        $scope.newProject.deadline = data.deadline_date; // js date format workaround
        apiSrv.request('POST', 'projects/', $scope.newProject, function(project){
          $scope.closeDialog();
          that.projects.push(project);
          that.newProject = new Project();
        }, function(err){
          $log.error(err);
        });
      };
      $scope.deleteProject = function(ev, id, index){
        var confirm = $mdDialog.confirm()
            .title('You are about to delete this project.')
            .content('This action cannot be undone. Are you sure you wish to proceed?')
            .ariaLabel('Confirm delete')
            .targetEvent(ev)
            .ok('Delete this project')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+id, {},
            function(data){
              $scope.projects.splice(index, 1);
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
              this.parent.project_index = index;
            },
            controllerAs: 'ctrl',
            templateUrl: 'angular/partials/project-edit.html',
            parent: angular.element(document.querySelector('.view-panel.active')),
            targetEvent: ev,
            clickOutsideToClose: true,
            onComplete: function(){
              $rootScope.dialogOpen = true;
            }
          });
        }, function(err){$log.error(err);});
      };
      $scope.updateProject = function(data, index){
        if(!xhrfile() && data.project_logo){
          var toast = $mdToast.simple()
                        .content('Your browser does not support xhr file uploads. Selected image will be removed.')
                        .action('Ok')
                        .highlightAction(false)
                        .hideDelay(6000)
                        .position('top right');
          $mdToast.show(toast).then(function(){
            if(data.project_logo){
              data.project_logo = null;
            }
          });
        }
        data.deadline = data.deadline_date; // js date format workaround
        apiSrv.request('PUT', 'projects/'+data.id, data, function(project){
          $scope.closeDialog();
          $scope.projects.splice(index, 1, project);
        }, function(err){$log.error(err);});
      };

      function timeDeltaToSeconds(delta){
        var pieces = delta.split(":"),
            hours = pieces[0],
            minutes = pieces[1],
            seconds = pieces[2],
            timeDiff = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseFloat(seconds);
        return timeDiff;
      }
      $scope.timeEvent = "startTimer";
      var timerRunning = false;
      $scope.timers = [];
      $scope.intervals = {};
      var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
      var startTimer = function(id){
        $scope.timeEvent = "startTimer";
        $scope.intervals[id] = typeof $scope.intervals[id] === "undefined" ? {} : $scope.intervals[id];
        $scope.intervals[id].timerRunning = true;
        var timerEl = document.getElementById("project_"+id).querySelector(".timer");
        timerEl.classList.remove('saving');
        if($scope.timers.indexOf(id) === -1){
          //create
          $scope.timers.push(id);
          apiSrv.request('POST', 'projects/'+id+'/intervals/', {start: (new Date())},
           function(data){
            $scope.intervals[id].interval = data.id;
           },
           function(err){
            $log.error(err);
           }
          );
        } else {
          //update
        }
        
      };
      var stopTimer = function(id){
        $scope.timeEvent = "stopTimer";
        $scope.intervals[id].timerRunning = false;
        var intervalId = $scope.intervals[id].interval,
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
        var ix = $scope.timers.indexOf(id);
        if(!timerRunning && (typeof $scope.intervals[id] === "undefined" || !$scope.intervals[id].timerRunning)){
          startTimer(id);
        } else {
          stopTimer(id);
        }
      };

      $scope.intervalObj = {"description": ""};
      $scope.saveInterval = function(id, index){
        var intervalData = {
          "description": $scope.intervalObj.description
        };
        var intervalId = $scope.intervals[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer"),
            timerBtn = timerEl.querySelector('.counter'),
            intervalIx = $scope.timers.indexOf(intervalId);
        apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', intervalData,
          function(data){
            $scope.projects.splice(index, 1, data);
            $scope.intervals[id].timerRunning = false;
            $scope.timers.splice(intervalIx, 1);
            $scope.timeEvent = "startTimer";
            $scope.intervalObj.description = "";
          },
          function(err){
            $log.error(err);
          }
        );
      };
      $scope.discardInterval = function(id, index, ev){
        var intervalId = $scope.intervals[id].interval,
            confirm = $mdDialog.confirm()
              .title('You are about to discard this time period.')
              .content('This action cannot be undone. Are you sure you wish to proceed?')
              .ariaLabel('Confirm discard')
              .targetEvent(ev)
              .ok('Discard this interval')
              .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
          apiSrv.request('DELETE', 'projects/'+id+'/intervals/'+intervalId+'/', {},
            function(data){
              $scope.projects.splice(index, 1, data);
              $scope.intervals[id].timerRunning = false;
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
      function itemProgressIndicator(showEl, hideEl){
        showEl.classList.remove('hidden');
        hideEl.classList.add('hidden');
      }
      $scope.showIntervalList = function(ev, pid, index){
        $scope.openProject = index;
        $rootScope.sheetOpen = true;
        document.querySelector('.view-panel.active').scrollTop = 0;
        document.querySelector('.view-panel.active').classList.add('no-scroll');
        $mdBottomSheet.show({
          controller: function(){
            var it = this;
            this.parent = $scope;
            var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
            this.parent.newInterval = new Interval();
            this.parent.intervals = Interval.query({project_id: pid}, function(intervals){
              for(var i=0;i<intervals.length;i++){
                intervals[i].work_date = new Date(intervals[i].work_day);
              }
              it.parent.intervals = orderByFilter(intervals, ['position', 'work_day']);
            });
            this.parent.project = Project.get({id: pid});
            this.parent.updateInterval = function(interval, ev, index){
              var that = this;
              var actionsParent = ev.target.parentElement.parentElement.parentElement,
                  progress = actionsParent.querySelector('.interval-action-progress'),
                  actions = actionsParent.querySelector('.md-actions');
              var intervalIndicator = $timeout(itemProgressIndicator, 500, true, progress, actions);
              var start = new Date(interval.start),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  newEnd = new Date(start.getTime() + timeDiff*1000);
              interval.end = newEnd;
              interval.work_day = interval.work_date;
              apiSrv.request('PUT', 'projects/'+interval.project+'/intervals/'+interval.id+'/', interval,
                function(data){
                  $timeout.cancel(intervalIndicator);
                  $scope.projects.splice($scope.openProject, 1, data);
                  that.project = data;
                  progress.classList.add('hidden');
                  actions.classList.remove('hidden');
                  actions.querySelector('button.update-btn').classList.add('success');
                  $timeout(function(){
                    actions.querySelector('button.update-btn').classList.remove('success');
                  }, 1000);
                },
                function(err){
                  $timeout.cancel(intervalIndicator);
                  $log.error(err);
                  progress.classList.add('hidden');
                  actions.classList.remove('hidden');
                }
              );
            };
            this.parent.deleteInterval = function(interval, ev, index){
              var that = this;
              var actionsParent = ev.target.parentElement.parentElement.parentElement,
                  progress = actionsParent.querySelector('.interval-action-progress'),
                  actions = actionsParent.querySelector('.md-actions');
              var intervalIndicator = $timeout(itemProgressIndicator, 500, true, progress, actions);
              var confirm = $mdDialog.confirm()
                  .title('You are about to delete this time period.')
                  .content('This action cannot be undone. Are you sure you wish to proceed?')
                  .ariaLabel('Confirm delete')
                  .targetEvent(ev)
                  .ok('Delete this interval')
                  .cancel('Cancel');
              $mdDialog.show(confirm).then(function() {
                apiSrv.request('DELETE', 'projects/'+interval.project+'/intervals/'+interval.id, {},
                  function(data){
                    $timeout.cancel(intervalIndicator);
                    $scope.intervals.splice(index, 1);
                    Project.get({id: interval.project}, function(project){
                      $scope.projects.splice($scope.openProject, 1, project);
                      that.project = project;
                    });
                    progress.classList.add('hidden');
                    actions.classList.remove('hidden');
                    actions.querySelector('button.delete-btn').classList.add('success');
                    $timeout(function(){
                      actions.querySelector('button.delete-btn').classList.remove('success');
                    }, 1000);
                  },
                  function(err){
                    $timeout.cancel(intervalIndicator);
                    $log.error(err);
                    progress.classList.add('hidden');
                    actions.classList.remove('hidden');
                  }
                );
              }, function() {
                $timeout.cancel(intervalIndicator);
                $log.info('cancelled delete');
                progress.classList.add('hidden');
                actions.classList.remove('hidden');
              });
            };
            this.parent.insertInterval = function(interval, ev){
              var that = this;
              var actionsParent = ev.target.parentElement.parentElement.parentElement,
                  progress = actionsParent.querySelector('.interval-action-progress'),
                  actions = actionsParent.querySelector('.md-actions');
              var intervalIndicator = $timeout(itemProgressIndicator, 500, true, progress, actions);
              var start = new Date(),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  end = new Date(start.getTime() + timeDiff*1000);
              interval.end = end;
              interval.start = start;
              interval.work_day = interval.work_date;
              interval.position = that.project.intervals.length;
              apiSrv.request('POST', 'projects/'+pid+'/intervals/', interval,
                function(data){
                  $timeout.cancel(intervalIndicator);
                  data.work_date = new Date(data.work_day);
                  that.intervals.push(data);
                  that.newInterval = new Interval();
                  Project.get({id: data.project}, function(project){
                    $scope.projects.splice($scope.openProject, 1, project);
                    that.project = project;
                  });
                  progress.classList.add('hidden');
                  actions.classList.remove('hidden');
                  actions.querySelector('button.insert-btn').classList.add('success');
                  $timeout(function(){
                    actions.querySelector('button.insert-btn').classList.remove('success');
                  }, 1000);
                },
                function(err){
                  $timeout.cancel(intervalIndicator);
                  $log.error(err);
                  progress.classList.add('hidden');
                  actions.classList.remove('hidden');
                }
              );
            };
            this.parent.clearInterval = function(interval, ev){
              this.newInterval.description = "";
              this.newInterval.total = "";
              this.newInterval.work_date = "";
            };
            this.parent.sortIntervals = function(item, partFrom, partTo, indexFrom, indexTo){
              var that = this;
              var project_id = item.project,
                  data = {intervalList: partFrom};
              apiSrv.request('POST', 'projects/'+project_id+'/interval_sort/', data,
                function(data){
                  for(var i=0;i<data.intervals.length;i++){
                    data.intervals[i].work_date = new Date(data.intervals[i].work_day);
                  }
                  that.intervals = data.intervals;
                },
                function(err){
                  $log.error(err);
                }
              );
            };
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/interval-list.html',
          parent: angular.element(document.querySelector('.view-panel.active'))
        }).finally(function(){
          $rootScope.sheetOpen = false;
          if(!$rootScope.stateChange){
            $state.go("app");
          }
          document.querySelector('.view-panel.active').classList.remove('no-scroll');
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
              $rootScope.dialogOpen = true;
            }
          });
        }, function(err){$log.error(err);});
      };
      
      $scope.openInvoiceList = function(pid, ev){
        $rootScope.sheetOpen = true;
        document.querySelector('.view-panel.active').scrollTop = 0;
        document.querySelector('.view-panel.active').classList.add('no-scroll');
        $mdBottomSheet.show({
          controller: function(){
            var it = this;
            this.parent = $scope;
            var Invoice = djResource('api/projects/:project_id/statements/:id', {'project_id': '@pid', 'id': "@id"});
            this.parent.newInvoice = new Invoice();
            this.parent.invoices = Invoice.query({project_id: pid}, function(invoices){
              it.parent.invoices = orderByFilter(invoices, ['created_at']);
            });
            $rootScope.$on('updateInvoiceList', function(){
              this.parent.invoices = Invoice.query({project_id: pid}, function(invoices){
                it.parent.invoices = orderByFilter(invoices, ['created_at']);
              });
            });
            this.parent.project = Project.get({id: pid});
            this.parent.editInvoice = function(invoice, index, ev){
              $mdDialog.show({
                controller: function(){
                  this.parent = $scope;
                  this.parent.invoice = invoice;
                },
                controllerAs: 'ctrl',
                templateUrl: 'angular/partials/invoice-edit.html',
                parent: angular.element(document.querySelector('.view-panel.active')),
                targetEvent: ev,
                clickOutsideToClose: true,
                onComplete: function(){
                  document.querySelector('.view-panel.active').scrollTop = 0;
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
            this.parent.insertInvoice = function(invoice, ev){
              var that = this;
              var actionsParent = ev.target.parentElement.parentElement.parentElement,
                  progress = actionsParent.querySelector('.invoice-action-progress'),
                  actions = actionsParent.querySelector('.md-actions');
              var invoiceIndicator = $timeout(itemProgressIndicator, 500, true, progress, actions);
              apiSrv.request('POST', 'projects/'+pid+'/statements/', invoice,
                function(data){
                  $timeout.cancel(invoiceIndicator);
                  that.invoices.push(data);
                  that.newInvoice = new Invoice();
                  progress.classList.add('hidden');
                  actions.classList.remove('hidden');
                  actions.querySelector('button.insert-btn').classList.add('success');
                  $timeout(function(){
                    actions.querySelector('button.insert-btn').classList.remove('success');
                  }, 1000);
                },
                function(err){
                  $timeout.cancel(invoiceIndicator);
                  $log.error(err);
                  progress.classList.add('hidden');
                  actions.classList.remove('hidden');
                }
              );
            };
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/invoice-list.html',
          parent: angular.element(document.querySelector('.view-panel.active'))
        }).finally(function(){
          $rootScope.sheetOpen = false;
          if(!$rootScope.stateChange){
            $state.go("app");
          }
          document.querySelector('.view-panel.active').classList.remove('no-scroll');
        });
      };

      $scope.htmlSafe = $sce.trustAsHtml;
      var formatErr = function(err){
        var errString = JSON.stringify(err),
            errArray = errString.split(','),
            responseString = "";
        for(var i=0;i<errArray.length;i++){
          var clean = errArray[i].replace(/\[|\]|"|{|}/g,''),
              item = clean.match(/.*(?=:)/)[0],
              message = clean.match(/(:)(.*)/)[2];
          responseString += "<li>"+item+": "+message+"</li>";
        }
        return responseString;
      };
    }
  ])
;