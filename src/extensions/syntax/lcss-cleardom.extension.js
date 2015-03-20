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

            // Initialize extension element
            var element = document.createElement('lcss-cleardom-extension');

            /**
             * Strips out all text and comment nodes and removes all DOM elements
             * @param element Elements to strip content from
             * @return {Array} Array of text content stripped out from passed element
             */
            var stripDOM = function(element) {
                var texts = [ ];
                for (var i=0; i<element.childNodes.length; i++) {
                    // Extract child node content
                    if (element.childNodes[i].nodeName == "#text") {
                        texts.push( element.childNodes[i].textContent );
                    } else if (element.childNodes[i].nodeName == "#comment") {
                        texts.push( '/* ' + element.childNodes[i].textContent + '*/' );
                    } else {
                        var inner = stripDOM( element.childNodes[i] );
                        for (var j=0; j<inner.length; j++) texts.push( inner[j] );
                    }
                    // Remove child node
                    element.removeChild( element.childNodes[i] );
                }
                return texts;
            }

            // Create extension
            LCSSExtensionProvider.create('lcss.ClearDOM', {
                syntax: {
                    compilation: function(syntax) {
                        // Set syntax
                        element.innerHTML = syntax;
                        // Remove DOM
                        var texts = stripDOM(element),
                            text = '';
                        for (var i=0; i<texts.length; i++) text += texts[i];
                        // Return syntax
                        return text;
                    }
                }
            }, true);

        }]);

    }

})();