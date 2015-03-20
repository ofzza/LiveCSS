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
         * Defines LiveCSS parser service
         * - Parses LiveCSS syntax and returns LiveCss Document references
         * - Run as: " LCSSParser( LiveCssDocumentParameters ) "
         *           LiveCssDocumentParameters = {
         *              global: [ true/false ] (optional),
         *              import: [ string[] ] (optional),
         *              syntax: [ string ] (optional),
         *              syntaxUrl: [ string ] (optional),
         *           }
         */
        angular.module('LCSS').provider('LCSSParser', [function () { return { $get: LiveCssParserFactory } }]);

    }

    // Syntax loading
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * LiveCss Parser service factory
         */
        var LiveCssParserFactory = ['$http', '$q', 'LCSSGlobals', 'LCSSDocument', function ($http, $q, LCSSGlobals, LCSSDocument) {

            // Set debugging flag
            $debug = LCSSGlobals.$debug;

            /**
             * LiveCSS Parser Initialization function
             * @param params LiveCssDocumentParameters object
             * @returns {*} Promise that will resolve to array of LiveCss Document objects created from loaded syntax
             * @constructor
             */
            var LiveCssParserLoadFn = function (params) {

                // Initialize parameters
                params = params || LCSSDocument.defaultParameters;

                // Resolve and return promise for parsed documents' references
                var defered =  $q.defer();

                // Get and parse syntax
                if (params.syntax) {
                    // Process syntax
                    var docs = LiveCssSyntaxParserFn(params.syntax, params, LCSSDocument);
                    // Echo debug info
                    if ($debug) console.log('> [LCSSParser]: ', 'Loaded ' + docs.length + ' documents from raw syntax');
                    // Resolve documents
                    defered.resolve( docs );
                } else if (params.syntaxUrl) {
                    // Get syntax from Url and process syntax
                    $http.get(params.syntaxUrl).then(
                        function (response) {
                            // Process syntax
                            var docs = LiveCssSyntaxParserFn(response.data, params, LCSSDocument);
                            // Echo debug info
                            if ($debug) console.log('> [LCSSParser]: ', 'Loaded ' + docs.length + ' documents from "' + params.syntaxUrl + '"');
                            // Resolve documents
                            defered.resolve( docs );
                        },
                        function (error) {
                            // Throw load syntax error
                            defered.reject();
                            throw new Error('Failed loading LiveCSS syntax from "' + params.syntaxUrl + '":', error);
                        }
                    );
                } else {
                    // Process empty syntax
                    var docs = LiveCssSyntaxParserFn(null, params, LCSSDocument);
                    // Echo debug info
                    if ($debug) console.log('> [LCSSParser]: ', 'Loaded ' + docs.length + ' documents from empty syntax');
                    // Resolve documents
                    defered.resolve( docs );
                }

                // Return promise
                return defered.promise;

            };

            // Return LiveCssParserFn
            return LiveCssParserLoadFn;
        }];
    }

    // Syntax parsing
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * Parses raw LiveCss syntax and returns LiveCss document references
         * @param syntax LiveCss raw syntax
         * @param params LiveCssDocumentParameters object
         * @param LCSSDocument LiveCss Document Service reference
         * @constructor
         */
        var LiveCssSyntaxParserFn = function (syntax, params, LCSSDocument) {

            // Host syntax inside html element for parsing
            var hostEl = document.createElement('syntax');
            hostEl.innerHTML = syntax;

            // Strip out nested elements and any orphaned syntax
            var documentElements = [ ],
                orphanedSegments = [ ];
            for (var i = 0; i < hostEl.childNodes.length; i++) {
                if (hostEl.childNodes[i].nodeName === '#text') {
                    // Digest text node
                    orphanedSegments.push( hostEl.childNodes[i].textContent );
                } else if (hostEl.childNodes[i].nodeName === '#comment') {
                    // Digest comment node
                    orphanedSegments.push( '/*' + hostEl.childNodes[i].textContent + '*/' );
                } else {
                    // Digest HtmlElement node
                    documentElements.push( hostEl.childNodes[i] );
                }
            }

            // Compose orphaned segments into extra document
            var orphanedDocumentContent = '';
            for (var i = 0; i < orphanedSegments.length; i++) {
                var segment = orphanedSegments[i].trim();
                if (segment && segment.length) orphanedDocumentContent += segment + '\r\n';
            }
            if (orphanedDocumentContent && orphanedDocumentContent.trim().length) {
                var orphanedDocument = document.createElement('style');
                orphanedDocument.innerHTML = '\r\n' + orphanedDocumentContent.trim() + '\r\n';
                documentElements.push( orphanedDocument );
            }

            // Wrap syntax into LiveCss Document objects
            var lcssDocuments = [];
            for (var i in documentElements) {
                lcssDocuments.push( new LCSSDocument(documentElements[i], params) );
            }
            return lcssDocuments;

        };
    }

})();