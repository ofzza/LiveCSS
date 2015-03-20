// =====================================================================================================================
// Live CSS, Dynamic CSS module for AngularJS
// ... developed by: ofzza
// =====================================================================================================================

(function() {
    "use strict";
    var $debug = false;

    // Angular module system integration
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * Instantiate AngularJS module for LiveCss (LCSS) if not already present
         */
        try { angular.module("LCSS"); } catch(err) { angular.module('LCSS', ['ng']); }

        /**
         * LiveCss Globals object
         * @returns {{$get: *}}
         * @constructor
         */
        var LiveCssGlobalsProvider = [ function () {
            // Extend LiveCss Globals object to meet service interface
            LiveCssGlobals.$get = function() { return LiveCssGlobals; };
            // Return LiveCss Globals object
            return LiveCssGlobals;
        }];

        /**
         * Defines LiveCSS provider
         * - Exposes a LiveCss Globals object
         */
        angular.module('LCSS').provider('LCSSGlobals', LiveCssGlobalsProvider);

    }

    // LiveCss Globals object
    // -----------------------------------------------------------------------------------------------------------------
    {

        /**
         * Shared, internal, global object
         * @type {{}}
         */
        var LiveCssGlobals = {

            // Holds debug output flag
            $debug: false,

            // Reference to LiveCss RootScope, child of $rootScope
            $scope: null

        }

    }

})();