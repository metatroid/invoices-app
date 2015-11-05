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