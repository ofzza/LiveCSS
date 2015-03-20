// =====================================================================================================================
// Live CSS, Demo Project
// ... developed by: ofzza
// =====================================================================================================================

"use strict";
(function() {
    window.addEventListener('load', function() {

        // Initialize test module
        var app = angular.module('myApp', ['LCSS']);

        // Configure startup functionality
        app.run(['$rootScope', 'LCSS', function($rootScope, LCSS) {

            // Generates an array with set number of elements
            $rootScope.LCSS.generateArrayOfLength = function(N) {
                var arr = [ ];
                for (var i=0; i<N; i++) arr.push(i);
                return arr;
            }

        }]);

        // Bootstrap angular
        angular.bootstrap(document, ['myApp']);

    });
})();