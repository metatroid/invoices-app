angular.module('invoices', [
               'ngMaterial',
               'invoices.controllers',
               'invoices.states',
               'invoices.services',
               'invoices.directives',
               'invoices.filters',
               'djangoRESTResources',
               'ui.mask',
               'datetime',
               'angular-sortable-view',
               'ui.bootstrap',
               'mwl.calendar'
]);

angular.module('invoices.states', []);
angular.module('invoices.services', []);
angular.module('invoices.directives', []);
angular.module('invoices.filters', []);

angular.module('invoices')
  .config(['$httpProvider', '$compileProvider', '$mdThemingProvider', function($httpProvider, $compileProvider, $mdThemingProvider){
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
    $mdThemingProvider.theme('default')
      .primaryPalette('grey')
      .accentPalette('blue-grey');
    $mdThemingProvider.theme('docs-dark', 'default')
      .primaryPalette('yellow')
      .dark();
  }
]);
angular.module('invoices.controllers', []);
angular.module('invoices.directives', []);
angular.module('invoices.filters', []);
angular.module('invoices.services', []);
angular.module('invoices.states', ['ui.router', 'uiRouterStyles']);
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
function pad(n, width, z){
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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
function timeDeltaToSeconds(delta){
  var pieces = delta.split(":"),
      hours = pieces[0],
      minutes = pieces[1],
      seconds = pieces[2],
      timeDiff = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseFloat(seconds);
  return timeDiff;
}
function itemProgressIndicator(showEl, hideEl){
  showEl.classList.remove('hidden');
  hideEl.classList.add('hidden');
}
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
angular.module('invoices.controllers')
  .controller('authCtrl', ['$scope', 
    function($scope){
      $scope.showAuthForm = true;
    }
  ])
;
angular.module('invoices.controllers')
  .controller('anonCtrl', ['$scope', 
    function($scope){
      $scope.domain = window.location.hostname.charAt(0).toUpperCase() + window.location.hostname.slice(1);
    }
  ])
;
angular.module('invoices.controllers')
  .controller('userCtrl', [
              '$scope', 
              '$state', 
              '$log', 
              'apiSrv', 
    function($scope, $state, $log, apiSrv){
      $scope.updateProfile = function(userData){
        apiSrv.request('PUT', 'users/'+$scope.user.id+'/', userData, function(data){
          $log.info(data);
        }, function(err){
          $log.error(err);
        });
      };
    }
  ])
;
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
        $scope.newProject.deadline = data.deadline_date;
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
              overlay = true;
              document.getElementsByTagName('md-dialog-content')[0].scrollTop = 0;
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
        data.deadline = data.deadline_date;
        apiSrv.request('PUT', 'projects/'+data.id, data, function(project){
          $scope.closeDialog();
          $scope.projects.splice(index, 1, project);
        }, function(err){$log.error(err);});
      };

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
          $scope.timers.push(id);
          apiSrv.request('POST', 'projects/'+id+'/intervals/', {start: (new Date())},
           function(data){
            $scope.intervals[id].interval = data.id;
           },
           function(err){
            $log.error(err);
           }
          );
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
      
      $scope.showIntervalList = function(ev, pid, index){
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
angular.module('invoices.controllers')
  .controller('intervalListCtrl', ['$log', 
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
      var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
      this.parent.newInterval = new Interval();
      this.parent.intervals = Interval.query({project_id: vars.pid}, function(intervals){
        for(var i=0;i<intervals.length;i++){
          intervals[i].work_date = new Date(intervals[i].work_day);
        }
        it.parent.intervals = orderByFilter(intervals, ['position', 'work_day']);
      });
      this.parent.project = Project.get({id: vars.pid});

      this.parent.updatePosition = function(el, project_id){
        var that = this,
            orderObj = [];
        for(var i=0;i<el.parentNode.children.length;i++){
          var id = el.parentNode.children[i].id.replace('interval_', ''),
              obj = {id: id};
          orderObj.push(obj);
        }
        apiSrv.request('POST', 'projects/'+project_id+'/interval_sort/', {intervalList: orderObj},
          function(data){
            for(var i=0;i<data.intervals.length;i++){
              data.intervals[i].work_date = new Date(data.intervals[i].work_day);
            }
            el.classList.remove('highlight');
            $timeout(function(){
              that.intervals = data.intervals;
            }, 500);
          },
          function(err){
            $log.error(err);
          }
        );
      };
      this.parent.movePositionUp = function(interval){
        var el = document.getElementById("interval_"+interval.id),
            project_id = interval.project;
        if(el.previousElementSibling){
          el.parentNode.insertBefore(el,el.previousElementSibling);
          el.classList.add('highlight');
          this.updatePosition(el, project_id);
        }
      };
      this.parent.movePositionDown = function(interval){
        var el = document.getElementById("interval_"+interval.id),
            project_id = interval.project;
        if(el.nextElementSibling){
          el.parentNode.insertBefore(el.nextElementSibling, el);
          el.classList.add('highlight');
          this.updatePosition(el, project_id);
        }
      };
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
        apiSrv.request('POST', 'projects/'+vars.pid+'/intervals/', interval,
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
    }
  ])
;
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
angular.module('invoices.controllers')
  .controller('calCtrl', ['$scope',
                          '$log',
                          'apiSrv',
    function($scope, $log, apiSrv){
      $scope.calendarView = 'month';
      $scope.calendarDay = new Date();
      var project_ids = [];
      apiSrv.request('GET', 'projects/intervals/', {}, function(intervals){
        for(var i=0;i<intervals.length;i++){
          var s = new Date(intervals[i].work_day),
              e = new Date(intervals[i].work_day);
          if(project_ids.indexOf(intervals[i].project) === -1){
            project_ids.push(intervals[i].project);
          }
          // project_ids = project_ids.filter(function(value,index,self){return self.indexOf(value)===index;})
          intervals[i].title = "<strong>"+intervals[i].project_name+"</strong>" + ": " + intervals[i].description;
          intervals[i].type = 'info';
          intervals[i].startsAt = s;
          intervals[i].endsAt = e;
          intervals[i].editable = false;
          intervals[i].deletable = false;
          intervals[i].draggable = false;
          intervals[i].resizable = false;
          intervals[i].incrementsBadgeTotal = true;
          intervals[i].cssClass = "project_"+(project_ids.indexOf(intervals[i].project) + 1);
        }
        $scope.events = intervals;
      }, function(err){
        $log.error(err);
      });
    }
  ])
;
var smoothScroll = function(element, options){
  options = options || {};
  var duration = 800,
      offset = 0;

  var easing = function(n){
    return n < 0.5 ? 8 * Math.pow(n, 4) : 1 - 8 * (--n) * Math.pow(n, 3);
  };

  var getScrollLocation = function(){
    return window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop;
  };

  setTimeout(function(){
    var startLocation = getScrollLocation(),
        timeLapsed = 0,
        percentage, position;

    var getEndLocation = function(element){
      var location = 0;
      if(element.offsetParent){
        do {
          location += element.offsetTop;
          element = element.offsetParent;
        } while (element);
      }
      location = Math.max(location - offset, 0);
      return location;
    };

    var endLocation = getEndLocation(element);
    var distance = endLocation - startLocation;

    var stopAnimation = function(){
      var currentLocation = getScrollLocation();
      if(position == endLocation || currentLocation == endLocation || ((window.innerHeight + currentLocation) >= document.body.scrollHeight)){
        clearInterval(runAnimation);
      }
    };

    var animateScroll = function(){
      timeLapsed += 16;
      percentage = (timeLapsed / duration);
      percentage = (percentage > 1) ? 1 : percentage;
      position = startLocation + (distance * easing(percentage));
      window.scrollTo(0, position);
      stopAnimation();
    };

    var runAnimation = setInterval(animateScroll, 16);
  }, 0);
};

var msToTimeString = function(ms){
  var seconds = Math.floor(ms / 1000),
      h = 3600,
      m = 60,
      hours = Math.floor(seconds/h),
      minutes = Math.floor((seconds % h)/m),
      scnds = Math.floor((seconds % m)),
      timeString = '';
  if(scnds < 10) scnds = "0"+scnds;
  if(hours < 10) hours = "0"+hours;
  if(minutes < 10) minutes = "0"+minutes;
  timeString = hours +":"+ minutes +":"+scnds;
  return timeString;
};

function urlToBase64(img){
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  dataURL = canvas.toDataURL("image/png");
  return dataURL;
}
angular.module('invoices.directives')
  .directive('infocus', ['$timeout', 
    function($timeout){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          $timeout(function(){
            $element[0].focus();
          }, 1000);
        }
      };
    }
  ])
;
angular.module('invoices.directives')
  .directive('inready', ['$timeout', 
    function($timeout){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var elementClass = $attrs.inready,
              el = angular.element($element);
          angular.element(document).ready(function(){
            $element.addClass(elementClass);
          });
        }
      };
    }
  ])
;
angular.module('invoices.directives')
  .directive('inscroll', ['$window', 
    function($window){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($window).bind('scroll', function(){
            var elements = document.querySelectorAll("[inview]");
            for(var i=0;i<elements.length;i++){
              var el = elements[i],
                  top = el.getBoundingClientRect().top,
                  dist = window.innerHeight;
              if(top<((dist/2)+(dist/4))){
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
    }
  ])
;
angular.module('invoices.directives')
  .directive('inview', 
    function(){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('inview', function(){
            this.classList.add('inview');
          });
          angular.element($element).on('outview', function(){
            this.classList.remove('inview');
          });
        }
      };
    }
  )
;
angular.module('invoices.directives')
  .directive('inscrollto', 
    function(){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var targetElement;
          
          $element.on('click', function(e){
            e.preventDefault();
            this.blur();
            var targetId = $attrs.inscrollto;

            targetElement = document.getElementById(targetId);
            if(!targetElement) return; 

            smoothScroll(targetElement, {});

            return false;
          });
        }
      };
    }
  )
;
angular.module('invoices.directives')
  .directive('inbokeh', ['$interval', 
    function($interval){
      return {
        restrict: 'A',
        link: function($scope, $elements, $attrs){
          var container = document.getElementById('strip'),
              width = container.clientWidth,
              height = 450,
              canvas = document.getElementById('blur'),
              con = canvas.getContext('2d'),
              rint = 60,
              g,
              pxs = [];
          canvas.width = width;
          canvas.height = height;
          for(var i=0;i<100;i++){
            pxs[i] = new Circle();
            pxs[i].reset();
          }
          $interval(draw, rint);
          function draw(){
            con.clearRect(0,0,width,height);
            for(var i=0;i<pxs.length;i++){
              pxs[i].fade();
              pxs[i].move();
              pxs[i].draw();
            }
          }
          function Circle(){
            this.s = {ttl:8000, xmax:3, ymax:2, rmax:200, rt:1, xdef:960, ydef:540, xdrift:2, ydrift:2, random:true, blink:true};
            var crFill = [
              ['rgba(10,56,67,0)', 'rgba(10,56,67,1)'],
              ['rgba(11,67,99,0)', 'rgba(11,67,99,1)'],
              ['rgba(8,46,49,0)', 'rgba(8,46,49,1)'],
              ['rgba(7,64,60,0)', 'rgba(7,64,60,1)']
            ];
            var opacityFill = "."+Math.floor(Math.random()*5)+1;

            this.reset = function(){
              this.x = (this.s.random ? width*Math.random() : this.s.xdef);
              this.y = (this.s.random ? height*Math.random() : this.s.ydef);
              this.r = ((this.s.rmax-1)*Math.random()) + 1;
              this.dx = (Math.random()*this.s.xmax) * (Math.random() < 0.5 ? -1 : 1);
              this.dy = (Math.random()*this.s.ymax) * (Math.random() < 0.5 ? -1 : 1);
              this.hl = (this.s.ttl/rint)*(this.r/this.s.rmax);
              this.rt = Math.random()*this.hl;
              this.s.rt = Math.random()+1;
              this.stop = Math.random()*0.2+0.4;
              this.s.xdrift *= Math.random() * (Math.random() < 0.5 ? -1 : 1);
              this.s.ydrift *= Math.random() * (Math.random() < 0.5 ? -1 : 1);
              this.opacityFill = opacityFill;
              this.currentColor = Math.floor(Math.random()*crFill.length);
            };

            this.fade = function(){
              this.rt += this.s.rt;
            };

            this.draw = function(){
              if(this.s.blink && (this.rt <= 0 || this.rt >= this.hl)){
                this.s.rt = this.s.rt*-1;
              }
              else if(this.rt >= this.hl){
                this.reset();
              }
              con.beginPath();
              con.arc(this.x,this.y,this.r,0,Math.PI*2,true);
              con.globalAlpha = opacityFill;
              var newo = 1-(this.rt/this.hl);
              var cr = this.r*newo;
              gradient = con.createRadialGradient(this.x,this.y,0,this.x,this.y,(cr <= 0 ? 1 : cr));
              gradient.addColorStop(0.0, crFill[(this.currentColor)][1]);
              gradient.addColorStop(0.7, crFill[(this.currentColor)][1]);
              gradient.addColorStop(1.0, crFill[(this.currentColor)][0]);
              con.fillStyle = gradient;
              con.fill();
              con.closePath();
            };

            this.move = function(){
              this.x += (this.rt/this.hl)*this.dx;
              this.y += (this.rt/this.hl)*this.dy;
              if(this.x > width || this.x < 0){
                this.dx *= -1;
              } 
              if(this.y > height || this.y < 0){
                this.dy *= -1;
              } 
            };

            this.getX = function(){return this.x;};
            this.getY = function(){return this.y;};
          }
          window.onresize = function(e){
            width = container.clientWidth;
            canvas.width = width;
          };
        }
      };
    }
  ])
;
angular.module('invoices.directives')
  .directive('infile', 
    function(){
      return {
        scope: {
          infile: "="
        },
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var currentLogo = $scope.$eval($attrs.currentLogo);
          var addRemoveLink = function(){
            var removeLogo = document.createElement('a');
            removeLogo.id = "removeLogo";
            removeLogo.setAttribute('href', '#');
            removeLogo.innerHTML = "<span class='fa fa-remove'></span>";
            removeLogo.addEventListener('click', function(e){
              e.preventDefault();
              document.getElementById('logoPreview').remove();
              document.getElementById('removeLogo').remove();
              $scope.$apply(function(){
                $scope.infile = null;
              });
            });
            angular.element($element)[0].parentElement.appendChild(removeLogo);
          };
          if(currentLogo){
            var img = new Image();
            var preview = document.getElementById('logoPreview') || document.createElement('img');
            preview.id = "logoPreview";
            preview.setAttribute('src', currentLogo);
            preview.style.width = "100px";
            angular.element($element)[0].parentElement.appendChild(preview);
            addRemoveLink();
            img.onload = function(){
              $scope.$apply(function(){
                $scope.infile = urlToBase64(img);
              });
            };
            img.src = currentLogo;
          }
          angular.element($element).on('change', function(e){
            var reader = new FileReader(),
                filename = '',
                input = this,
                data;
            if(this.files && this.files[0]){
              reader.onload = function(ev){
                data = ev.target.result;
                console.log(data);
                var preview = document.getElementById('logoPreview') || document.createElement('img');
                preview.id = "logoPreview";
                preview.setAttribute('src', reader.result);
                preview.style.width = "100px";
                input.parentElement.appendChild(preview);
                addRemoveLink();
                $scope.$apply(function(){
                  $scope.infile = data;
                });
              };
              reader.readAsDataURL(this.files[0]);
              filename = e.target.value.split('\\').pop().length > 14 ? e.target.value.split('\\').pop().slice(0,11)+"&hellip;" : e.target.value.split('\\').pop();
            }
            if(filename){
              this.nextSibling.querySelector('span.label').innerHTML = filename;
            } else {
              this.nextSibling.querySelector('span.label').innerHTML = 'Project Logo';
            }
          });
        }
      };
    }
  )
;
angular.module('invoices.directives')
  .directive('intimer', 
    function(){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('click', function(){
            var el = this.parentElement.querySelector(".counter");
            var timerEvent = $attrs.intimer;
            var timeEvent = new Event(timerEvent);
            el.dispatchEvent(timeEvent);
          });
        }
      };
    }
  )
;
angular.module('invoices.directives')
  .directive('incounting', ['$interval', 
    function($interval){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          var self = this,
              timer,
              timeSync,
              startTime,
              totalElapsed = 0,
              elapsed = 0,
              timerEl = angular.element($element),
              projectId = timerEl[0].getAttribute('data-project'),
              intervalId = timerEl[0].getAttribute('data-interval');
          timerEl.on('startTimer', function(){
            startTime = new Date();
            timer = $interval(function(){
              var now = new Date();
              elapsed = now.getTime() - startTime.getTime();
              angular.element($element).html(msToTimeString(totalElapsed+elapsed));
            }, 1001);
          });
          angular.element($element).on('stopTimer', function(){
            $interval.cancel(timer);
            timer = undefined;
            totalElapsed += elapsed;
            elapsed = 0;
          });
        }
      };
    }
  ])
;
angular.module('invoices.directives')
  .directive("insave", ['$mdDialog', 
                        '$log', 
                        'apiSrv', 
    function($mdDialog, $log, apiSrv){
      return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
          angular.element($element).on('click', function(ev){
            var projectId = $attrs.insave,
                invoiceHtml = document.getElementById('invoice').outerHTML,
                progress = document.querySelector("md-progress-linear");
            progress.classList.remove("hidden");
            apiSrv.request('POST', 'projects/'+projectId+'/statements/', {markup: invoiceHtml}, function(invoice){
              progress.classList.add("hidden");
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
angular.module('invoices.directives')
  .directive("inupdate", ['$state', 
                          '$mdDialog', 
                          '$log', 
                          'apiSrv',
                          'msgSrv',
    function($state, $mdDialog, $log, apiSrv, msgSrv){
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
              msgSrv.emitMsg('updateInvoiceList');
              $mdDialog.cancel();
            }, function(err){
              $log.error(err);
            });
          });
        }
      };
    }
  ])
;
angular.module('invoices.filters')
  .filter('msToTimeString', 
    function(){
      return function(millseconds){
        var seconds = Math.floor(millseconds / 1000),
            h = 3600,
            m = 60,
            hours = Math.floor(seconds/h),
            minutes = Math.floor((seconds % h)/m),
            scnds = Math.floor((seconds % m)),
            timeString = '';
        if(scnds < 10){
          scnds = "0" + scnds;
        }
        if(hours < 10){
          hours = "0" + hours;
        }
        if(minutes < 10){
          minutes = "0" + minutes;
        }
        timeString = hours + ":" + minutes + ":" + scnds;
        return timeString;
      };
    }
  )
;
angular.module('invoices.filters')
  .filter('secondsToTimeString', 
    function(){
      return function(seconds){
        var h = 3600,
            m = 60,
            hours = Math.floor(seconds/h),
            minutes = Math.floor((seconds % h)/m),
            scnds = Math.floor((seconds % m)),
            timeString = '';
        if(scnds < 10){
          scnds = "0" + scnds;
        }
        if(hours < 10){
          hours = "0" + hours;
        }
        if(minutes < 10){
          minutes = "0" + minutes;
        }
        timeString = hours + ":" + minutes + ":" + scnds;
        return timeString;
      };
    }
  )
;
angular.module('invoices.filters')
  .filter('telephone', 
    function(){
      return function(telephone){
        if(!telephone){
          return "";
        }
        var value = telephone.toString().trim().replace(/^\+/, '');
        if(value.match(/[^0-9]/)){
          return telephone;
        }
        var country, city, number;
        switch(value.length){
          case 10:
            country = 1;
            city = value.slice(0,3);
            number = value.slice(3);
            break;
          case 11:
            country = value[0];
            city = value.slice(1,4);
            number = value.slice(4);
            break;
          case 12:
            country = value.slice(0,3);
            city = value.slice(3,5);
            number = value.slice(5);
            break;
          default:
            return telephone;
        }
        if(country === 1){
          country = "";
        }
        number = number.slice(0, 3) + '-' + number.slice(3);
        return (country + " (" + city + ") " + number).trim();
      };
    }
  )
;
angular.module('invoices.filters')
  .filter('timeDeltaToHours', 
    function(){
      return function(delta){
        var pieces = delta.split(":"),
            hours = pieces[0],
            minutes = pieces[1],
            seconds = pieces[2];
        return parseInt(hours) + (parseInt(minutes)/60) + (parseFloat(seconds)/60/60);
      };
    }
  )
;
angular.module('invoices.services')
  .factory('apiSrv', ['$http', 
    function($http){
      var apiSrv = {};
      apiSrv.request = function(method, url, args, successFn, errorFn){
        return $http({
          method: method,
          url: '/api/' + url,
          data: JSON.stringify(args)
        }).success(successFn).error(errorFn);
      };
      return apiSrv;
    }
  ])
;
angular.module('invoices.services')
  .factory('msgSrv', ['$rootScope',
    function($rootScope){
      var msgSrv = {};
      msgSrv.state = {};
      msgSrv.appScope = [];
      msgSrv.vars = {};
      msgSrv.setVars = function(obj){
        msgSrv.vars = obj;
      };
      msgSrv.getVars = function(){
        return msgSrv.vars;
      };
      msgSrv.setState = function(stateLabel, data){
        msgSrv.state = {
          fn: stateLabel,
          args: data
        };
        $rootScope.$broadcast('updateState');
      };
      msgSrv.setScope = function(key, value){
        msgSrv.appScope[key] = value;
      };
      msgSrv.getScope = function(key){
        return msgSrv.appScope[key];
      };
      msgSrv.emitMsg = function(message){
        $rootScope.$broadcast(message);
      };
      
      return msgSrv;
    }
  ])
;
angular.module('invoices.states')
  .run(['$rootScope', 
        '$state', 
        '$stateParams', 
    function($rootScope, $state, $stateParams){
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
    }
  ])
  .config(['$stateProvider', 
           '$urlRouterProvider', 
    function($stateProvider, $urlRouterProvider){
      var templateDir = 'angular/partials',
          cssDir = "static/assets/css";

      $urlRouterProvider.otherwise('/');

      $stateProvider
        .state('initial', {
          url: '/',
          views: {
            'main': {
              templateUrl: templateDir + '/main.html'
            },
            'landing@initial': {
              templateUrl: templateDir + '/landing.html',
              controller: 'anonCtrl'
            },
            'auth@initial': {
              templateUrl: templateDir + '/auth.html'
            }
          },
          data: {
            css: cssDir + '/landing.css'
          }
        })
        .state('app', {
          url: '/projects',
          views: {
            'main': {
              templateUrl: templateDir + '/main.html'
            },
            'landing@app': {
              templateUrl: templateDir + '/auth.html',
              controller: 'authCtrl'
            },
            'app@app': {
              templateUrl: templateDir + '/app-main.html',
              controller: 'appCtrl'
            },
            'nav@app': {
              templateUrl: templateDir + '/nav.html'
            }
          },
          data: {
            css: cssDir + '/app.css'
          }
        })
        .state('app.settings', {
          url: '/settings',
          views: {
            'profile': {
              templateUrl: templateDir + '/profile.html',
              controller: 'userCtrl'
            }
          }
        })
        .state('app.calendar', {
          url: '/calendar',
          views: {
            'calendar': {
              templateUrl: templateDir + '/calendar.html',
              controller: 'calCtrl'
            }
          },
          data: {
            css: cssDir + '/calendar.css'
          }
        })
        .state('app.archive', {
          url: '/archive',
          views: {
            'archive': {
              templateUrl: templateDir + '/archive.html'
            }
          }
        })
        .state('app.newProject', {
          url: '/new'
        })
        .state('app.editProject', {
          url: '/edit/:id/:index/:event'
        })
        .state('app.intervalList', {
          url: '/intervals/:id/:index/:event'
        })
        .state('app.invoicePreview', {
          url: '/invoice/:id/:event'
        })
        .state('app.invoiceList', {
          url: '/invoices/:id/:event'
        })
      ;
    }
  ])
;