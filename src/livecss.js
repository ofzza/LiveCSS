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
         * LiveCss Provider
         * @returns {{$get: *}}
         * @constructor
         */
        var LiveCssProvider = function () {
            LCSS.$get = function() { return LCSS; };
            return LCSS;
        }

        /**
         * Defines LiveCSS document service
         * - Exposes a LiveCss Root Object
         */
        angular.module('LCSS').provider('LCSS', LiveCssProvider);

    }

    // LiveCss ROOT
    // -----------------------------------------------------------------------------------------------------------------
    {

        var LCSS = { }

    }

    // LiveCss INIT
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Holds initialized status
        var initialized = {
            config: false,
            run: false
        };

        // Initializes LiveCSS when module is configured
        angular.module('LCSS').config(
            [
                'LCSSGlobalsProvider', 'LCSSDocumentProvider',
                function( LCSSGlobalsProvider, LCSSDocumentProvider ) {
                    // Check initialized flag
                    if (!initialized.config) {

                        // Set debugging flag
                        $debug = LCSSGlobalsProvider.$debug;
                        LCSS.$debug = $debug = LCSSGlobalsProvider.$debug = false;
                        Object.defineProperty(LCSS, '$debug', {
                            get: function() { return LCSSGlobalsProvider.$debug; },
                            set: function(val) { $debug = LCSSGlobalsProvider.$debug = val; }
                        });

                        // Expose LiveCss document class
                        LCSS.Document = LCSS.Doc = LCSSDocumentProvider;
                        // Expose target function (sets host element for embedded LiveCss syntax elements)
                        LCSS.target = function(targetEl) { LCSSDocumentProvider.target = targetEl; }

                        // Set initialized flag
                        initialized.config = true;

                    }
                }
            ]
        );

        // Initializes LiveCSS runtime when module runs
        angular.module('LCSS').run(
            [
                'LCSSGlobals', 'LCSSDocument', 'LCSSParser', '$rootScope',
                function( LCSSGlobals, LCSSDocument, LCSSParser, $rootScope ) {
                    // Check initialized flag
                    if (!initialized.run) {

                        // Expose LiveCss parser function
                        LCSS.parse = LCSSParser;
                        // Expose LiveCss document class
                        LCSS.Document = LCSS.Doc = LCSSDocument;

                        // Link child scope of $rootScope to LCSSDocument class and expose on $rootScope
                        $rootScope.LCSS = LCSSGlobals.$scope = $rootScope.$new();

                        // Set initialized flag
                        initialized.run = true;

                    }
                }
            ]
        );

    }

})();