angular.module('invoices.controllers')
  .controller('anonCtrl', ['$scope', 
    function($scope){
      $scope.domain = window.location.hostname.charAt(0).toUpperCase() + window.location.hostname.slice(1);
    }
  ])
;