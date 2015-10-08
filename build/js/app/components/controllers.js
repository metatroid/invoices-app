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
      $scope.openProject;
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

      $scope.timeEvent = "startTimer";
      var timerRunning = false;
      $scope.timers = [];
      var intervals = {};
      var startTimer = function(id){
        $scope.timeEvent = "startTimer";
        intervals[id] = {};
        intervals[id].timerRunning = true;
        var timerEl = document.getElementById("project_"+id).querySelector(".timer");
        timerEl.classList.remove('saving');
        if($scope.timers.indexOf(id) === -1){
          //create
          $scope.timers.push(id);
          apiSrv.request('POST', 'projects/'+id+'/intervals/', {start: (new Date())},
           function(data){
            intervals[id].interval = data.id;
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
        intervals[id].timerRunning = false;
        var intervalId = intervals[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer");
        timerEl.setAttribute('data-interval', intervalId);
        timerEl.classList.add('saving');
        apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', {end: (new Date())},
          function(data){
            document.getElementById("project_"+id).querySelector(".counter").setAttribute('data-interval', intervalId);
          },
          function(err){
            $log.error(err);
          }
        );
      };
      $scope.startstopTimer = function(id){
        var ix = $scope.timers.indexOf(id);
        if(!timerRunning && (typeof intervals[id] === "undefined" || !intervals[id].timerRunning)){
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
        var intervalId = intervals[id].interval,
            timerEl = document.getElementById("project_"+id).querySelector(".timer"),
            timerBtn = timerEl.querySelector('.counter');
        apiSrv.request('PUT', 'projects/'+id+'/intervals/'+intervalId+'/', intervalData,
          function(data){
            $scope.projects.splice(index, 1, data);
            intervals[id].timerRunning = false;
            $scope.timers.splice(index, 1);
            $scope.timeEvent = "startTimer";
            $scope.intervalObj.description = "";
          },
          function(err){
            $log.error(err);
          }
        );
      };
      function timeDeltaToSeconds(delta){
        var pieces = delta.split(":"),
            hours = pieces[0],
            minutes = pieces[1],
            seconds = pieces[2],
            timeDiff = (parseInt(hours)*60*60) + (parseInt(minutes)*60) + parseFloat(seconds);
        return timeDiff;
      }
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
              var start = new Date(interval.start),
                  diff = interval.total,
                  timeDiff = timeDeltaToSeconds(diff),
                  newEnd = new Date(start.getTime() + timeDiff*1000);
              interval.end = newEnd;
              apiSrv.request('PUT', 'projects/'+interval.project+'/intervals/'+interval.id+'/', interval,
                function(data){
                  $scope.projects.splice($scope.openProject, 1, data);
                  project = data;
                },
                function(err){
                  $log.error(err);
                }
              );
            };
            this.parent.deleteInterval = function(interval, ev, index){
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
                  },
                  function(err){
                    $log.error(err);
                  }
                );
              }, function() {
                $log.info('cancelled delete');
              });
            };
          },
          controllerAs: 'ctrl',
          templateUrl: 'angular/partials/interval-list.html'
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