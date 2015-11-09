angular.module('invoices.controllers')
  .controller('intervalListCtrl', ['$log', 
                                   'apiSrv',
                                   'msgSrv',
                                   'djResource',
                                   'orderByFilter',
                                   '$timeout',
                                   '$mdDialog',
                                   '$mdToast',
    function($log, apiSrv, msgSrv, djResource, orderByFilter, $timeout, $mdDialog, $mdToast){
      var $scope = msgSrv.getScope('appCtrl');
      var vars = msgSrv.getVars();
      var timingStatus = msgSrv.getTimingStatus();
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
            if((typeof timingStatus[vars.pid] === 'undefined') || !timingStatus[vars.pid].timerRunning){
              $scope.projects.splice($scope.openProject, 1, data);
              that.project = data;
            } else {
              var toast = $mdToast.simple()
                            .content("Changes will be reflected when this project's timer is saved or discarded.")
                            .action('Ok')
                            .highlightAction(false)
                            .hideDelay(10000)
                            .position('top right');
              $mdToast.show(toast).then(function(){});
            }
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
              $scope.intervals.splice($scope.intervals.indexOf(interval), 1);
              if((typeof timingStatus[vars.pid] === 'undefined') || !timingStatus[vars.pid].timerRunning){
                Project.get({id: interval.project}, function(project){
                  $scope.projects.splice($scope.openProject, 1, project);
                  that.project = project;
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
            if((typeof timingStatus[vars.pid] === 'undefined') || !timingStatus[vars.pid].timerRunning){
              Project.get({id: data.project}, function(project){
                $scope.projects.splice($scope.openProject, 1, project);
                that.project = project;
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