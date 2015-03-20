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
            LCSSExtensionProvider.create('Math', {
                resource: {
                    static: function() { return Math; }
                }
            }, true);

        }]);

    }

})();