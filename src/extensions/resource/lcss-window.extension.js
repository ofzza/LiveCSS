// =====================================================================================================================
// Live CSS, Dynamic CSS module for AngularJS
// ... developed by: ofzza
// =====================================================================================================================

(function() {
    "use strict";
    var $debug = false;

    // LiveCss Math extension
    // -----------------------------------------------------------------------------------------------------------------
    {

        // Register extension
        angular.module('LCSS').config([ 'LCSSGlobalsProvider', 'LCSSExtensionProvider', function(LCSSGlobalsProvider, LCSSExtensionProvider) {

            // Set debugging flag
            $debug = LCSSGlobalsProvider.$debug;

            // Create extension
            LCSSExtensionProvider.create('Window', {
                resource: {
                    dynamic: function($updateFn) {
                        var resizeHandler = function(e) {
                            $updateFn({
                                size: {
                                    width: window.innerWidth,
                                    height: window.innerHeight
                                }
                            });
                        };
                        window.addEventListener('resize', resizeHandler);
                        resizeHandler();
                    }
                }
            });

        }]);

    }

})();