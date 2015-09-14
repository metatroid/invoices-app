angular.module('invoices', [
               'invoices.controllers',
               'invoices.states'
]);

angular.module('invoices.controllers', []);

angular.module('invoices')
  .config(['$compileProvider', function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel):/);
  }
]);