angular.module('invoices.controllers', [])
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
  .controller('authCtrl', ['$scope', 
    function($scope){
      $scope.showAuthForm = true;
    }
  ])
  .controller('anonCtrl', ['$scope', 
    function($scope){
      //
    }
  ])
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
    function($rootScope, $scope, $state, $log, $sce, apiSrv, $mdDialog, $mdBottomSheet, $mdToast, djResource, $timeout, $filter){
      function pad(n, width, z){
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
      }
      $scope.openProject = 0;
      $scope.currentState = $state.current.name;
      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        $scope.currentState = toState.name;
      });
      var Project = djResource('api/projects/:id', {'id': "@id"});
      $scope.projects = Project.query();
      $scope.newProject = new Project();
      $scope.newProject.hourly_rate = $scope.user.default_rate;
      $scope.newProject.deadline = $filter('date')($scope.newProject.deadline_date, 'yyyy-MM-dd'); // js date format workaround

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
          }
        });
      };
      $scope.closeDialog = function() {
        $mdDialog.cancel();
      };
      function closeToast(){
        $mdToast.hide();
      }

      function detachProjectAndClearFields(id){
        var targetProject = Project.get({id: id}, function(){
          $scope.projects.push(targetProject);
          $scope.newProject = new Project();
        });
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
        $scope.newProject.$save(function(project){
          $scope.closeDialog();
          detachProjectAndClearFields(project.id);
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
        // $scope.timers.splice($scope.timers.indexOf(id), 1);
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
            timerBtn = timerEl.querySelector('.counter');
        apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', intervalData,
          function(data){
            $scope.projects.splice(index, 1, data);
            $scope.intervals[id].timerRunning = false;
            $scope.timers.splice(index, 1);
            $scope.timeEvent = "startTimer";
            $scope.intervalObj.description = "";
          },
          function(err){
            $log.error(err);
          }
        );
      };
      $scope.discardInterval = function(id, index){
        var intervalId = $scope.intervals[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer"),
            timerBtn = timerEl.querySelector('.counter');
        apiSrv.request('DELETE', 'projects/'+id+'/intervals/'+intervalId+'/', {},
          function(data){
            $scope.projects.splice(index, 1, data);
            $scope.intervals[id].timerRunning = false;
            $scope.timers.splice(index, 1);
            $scope.timeEvent = "startTimer";
            // $scope.intervalObj.description = "";
            // timerEl.classList.remove('saving');
          },
          function(err){
            $log.error(err);
          }
        );
      };
      $scope.showIntervalList = function(ev, pid, index){
        $scope.openProject = index;
        $mdBottomSheet.show({
          controller: function(){
            this.parent = $scope;
            var Interval = djResource('api/projects/:project_id/intervals/:id', {'project_id': '@pid', 'id': "@id"});
            this.parent.newInterval = new Interval();
            this.parent.intervals = Interval.query({project_id: pid});
            this.parent.project = Project.get({id: pid});
            this.parent.updateInterval = function(interval, ev, index){
              var that = this;
              var start = new Date(interval.start),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  newEnd = new Date(start.getTime() + timeDiff*1000);
              interval.end = newEnd;
              apiSrv.request('PUT', 'projects/'+interval.project+'/intervals/'+interval.id+'/', interval,
                function(data){
                  $scope.projects.splice($scope.openProject, 1, data);
                  that.project = data;
                },
                function(err){
                  $log.error(err);
                }
              );
            };
            this.parent.deleteInterval = function(interval, ev, index){
              var that = this;
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
                    $scope.intervals.splice(index, 1);
                    Project.get({id: interval.project}, function(project){
                      $scope.projects.splice($scope.openProject, 1, project);
                      that.project = project;
                    });
                  },
                  function(err){
                    $log.error(err);
                  }
                );
              }, function() {
                $log.info('cancelled delete');
              });
            };
            this.parent.insertInterval = function(interval, ev){
              var that = this;
              var start = new Date(),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  end = new Date(start.getTime() + timeDiff*1000);
              interval.end = end;
              interval.start = start;
              apiSrv.request('POST', 'projects/'+pid+'/intervals/', interval,
                function(data){
                  var targetInterval = Interval.get({project_id: data.project, id: data.id}, function(){
                    that.intervals.push(targetInterval);
                    that.newInterval = new Interval();
                  });
                  Project.get({id: data.project}, function(project){
                    $scope.projects.splice($scope.openProject, 1, project);
                    that.project = project;
                  });
                },
                function(err){
                  $log.error(err);
                }
              );
            };
            this.parent.clearInterval = function(interval, ev){
              this.newInterval.description = "";
              this.newInterval.total = "";
            };
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/interval-list.html',
          parent: angular.element(document.querySelector('.view-panel.active'))
        });
      };

      $scope.showInvoiceMenu = function($mdOpenMenu, ev){
        $mdOpenMenu(ev);
      };
      $scope.openInvoiceDialog = function(projectId, ev){
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
            clickOutsideToClose: true
          });
        }, function(err){$log.error(err);});
      };
      $scope.showProjectEditor = function(ev, projectId, index){
        apiSrv.request('GET', 'projects/'+projectId, {}, function(project){
          $mdDialog.show({
            controller: function(){
              this.parent = $scope;
              this.parent.project = project;
              this.parent.project.deadline = $filter('date')(this.parent.project.deadline, 'yyyy-MM-dd'); // js date format workaround
              this.parent.project_index = index;
            },
            controllerAs: 'ctrl',
            templateUrl: 'angular/partials/project-edit.html',
            parent: angular.element(document.querySelector('.view-panel.active')),
            targetEvent: ev,
            clickOutsideToClose: true
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
        data.deadline = data.dead_date; // js date format workaround
        apiSrv.request('PUT', 'projects/'+data.id, data, function(project){
          $scope.closeDialog();
          $scope.projects.splice(index, 1, project);
        }, function(err){$log.error(err);});
      };

      $scope.saveInvoice = function(projectId, html){
        $log.info(html);
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