/* =====================================================================================================================
        Live CSS
        ofzza, 2014.
 ==================================================================================================================== */
"use strict";

// Self-executing entry point
(function () {

// Initialize Live CSS module (and services sharing namespace)
// =====================================================================================================================
var services = { };

// Define helper functionality
// =====================================================================================================================
var helper = {

    // Scheduler namespace
    scheduler : {

        /**
         * Holds registered, scheduled executions and corresponding info
         */
        registry : { },

        /**
         * Schedules function for execution, tracked by key value, with min timeout since last execution
         * @param key
         * @param fn
         * @param timeout
         */
        execute : function(key, fn, timeout) {

            // Update registration
            if (!helper.scheduler.registry[key]) {
                // Register
                helper.scheduler.registry[key] = {
                    fn : fn,
                    timeout : timeout,
                    timestamp : 0,
                    pending : false
                }
            } else {
                // Update registration
                if (fn) {
                    helper.scheduler.registry[key].fn = fn;
                } else {
                    fn = helper.scheduler.registry[key].fn;
                }
                if (timeout) {
                    helper.scheduler.registry[key].timeout = timeout;
                } else {
                    timeout = helper.scheduler.registry[key].timeout;
                }
            }

            // Check last execution time
            var now = (new Date()).getTime(),
                registry = helper.scheduler.registry[key];
            // Check if execution pending
            if (!registry.pending) {
                timeout = (timeout > 0 ? timeout : 100);
                if (now - registry.timestamp >= timeout) {

                    // Execute function
                    if (typeof fn == 'function') fn();

                    // Update execution timestamp
                    registry.timestamp = (new Date()).getTime();

                } else {

                    // Schedule for execution after timeout
                    var delay = (timeout - (now - registry.timestamp));
                    registry.pending = true;
                    services.$timeout(function() { registry.pending = false; helper.scheduler.execute(key); }, delay);

                }
            }
            
        }

    }

};

// Live CSS module
// =====================================================================================================================
(function() {

    // Initialize Live CSS module
    // =================================================================================================================
    var module = angular.module('LiveCss', [ 'LiveCssCore', 'LiveCssToolkit', 'LiveCssDirectives' ]);

    // Initialize Live CSS provider
    // =================================================================================================================
    {
        module.provider('LiveCss', [ function( ) {

            // Initialize and return Live CSS provider's definition
            // ---------------------------------------------------------------------------------------------------------
            return {

                // Returns Live CSS provider instance
                // -----------------------------------------------------------------------------------------------------
                $get : [ 'LiveCssCore', 'LiveCssToolkit', function( LiveCssCore, LiveCssToolkit ) {

                    // Initialize aggregated provider instance
                    var provider = {

                        /**
                         * Element binding namespace
                         */
                        element : LiveCssToolkit.element

                    };

                    // Extend Live CSS core provider
                    angular.extend(provider, LiveCssCore);

                    // Return aggregated provider instance
                    return provider;

                } ]

            };

        } ]);
    }

}());


// Live CSS Core module
// =====================================================================================================================
(function() {

    // Initialize Live CSS Core module
    // =================================================================================================================
    var module = angular.module('LiveCssCore', []);

    // Initialize Live CSS functionality
    // =================================================================================================================
    {

        // Live CSS private namespace
        // -------------------------------------------------------------------------------------------------------------
        var registry = {

            // Holds references to imported Live DCSS documents
            documents : { },

            // Holds references to all defined extensions
            extensions : { }

        };

        // Define Live CSS syntax processor
        // -------------------------------------------------------------------------------------------------------------
        {
            /**
             * Parses Live CSS syntax into sectioned Live CSS documents
             * @param syntax Live CSS syntax
             * @param attrs Additional attributes to be added to the Live CSS document
             * @returns {Array} Array of parsed Live CSS documents
             */
            var LiveCssParser = function(syntax, attrs) {

                // Parse sections
                // -----------------------------------------------------------------------------------------------------
                var hostEl = document.createElement('LiveCssParser');
                hostEl.innerHTML = syntax;
                var sections = hostEl.childNodes;

                // Process sections
                // -----------------------------------------------------------------------------------------------------
                var documents = [ ];
                for (var i=0; i<sections.length; i++) if (sections[i].nodeName != '#comment') {
                    var section = sections[i];

                    // Check if child document or stand-alone syntax
                    var docEl = null;
                    if (section.localName) {
                        // Get child document
                        docEl = section;
                    } else if (section.textContent.trim().length > 0) {
                        // Wrap as child document
                        docEl = document.createElement('document');
                        docEl.innerHTML = section.textContent;
                    }

                    if (docEl) {
                        // Process document's passed attributes
                        for (var key in attrs) {
                            angular.element(docEl).attr(key, attrs[key]);
                        }

                        // Register document
                        documents.push(new LiveCssDocument(docEl));
                    }

                }

                // Return processed documents
                return documents;

            }
        }

        // Define Live CSS Document class
        // -------------------------------------------------------------------------------------------------------------
        {
            /**
             * Wrapps a single Live CSS document with necessary functionality
             * @param docEl Live CSS document's hosh element
             * @returns * Wrapped Live CSS document
             * @constructor
             */
            var LiveCssDocument = function(docEl) {

                // Live CSS document's private namespace
                // -----------------------------------------------------------------------------------------------------
                var prv = {

                    // Live CSS Document's host elements
                    // -------------------------------------------------------------------------------------------------
                    host : {
                        // Document's host element
                        document : null,
                        // Compilation process host element
                        compilation : null,
                        // Interpolation process host element
                        interpolation : null
                    },

                    // Live CSS Document's options (attributes)
                    // -------------------------------------------------------------------------------------------------
                    attrs : {
                        //
                        source : null,
                        // Evaluated expressions that triggers (re)compilation
                        compile : null,
                        // Evaluated expressions that triggers (re)interpolation
                        interpolate : null
                    },

                    // Live CSS Document's imports
                    // -------------------------------------------------------------------------------------------------
                    import : [ ],

                    // Live CSS Document's syntax - in different stages
                    // -------------------------------------------------------------------------------------------------
                    syntax : {
                        // Holds loaded version of document's syntax
                        loaded : null,
                        // Holds compiled version of document's syntax
                        compiled : null,
                        // Holds interpolated version of document's syntax
                        interpolated : null
                    },

                    // Live CSS watcher reference
                    // -------------------------------------------------------------------------------------------------
                    watcher : null,

                    // Initializes document's options and sets watchers for compilation and interpolation stages
                    // -------------------------------------------------------------------------------------------------
                    initialize : function() {

                        // Import document options, imports and key - generic value key if not present
                        // ---------------------------------------------------------------------------------------------
                        var doc = angular.element(docEl);
                        if (doc.attr('key')) {
                            var key = null;
                            try { key = pub.$scope.$eval(doc.attr('key').trim()); } catch (ex) { };
                            pub.key = (key ? key : doc.attr('key').trim());
                        }
                        if (doc.attr('import') && doc.attr('import').trim().length > 0) prv.import = pub.$scope.$eval(doc.attr('import').trim());

                        // Evaluate remaining document options
                        // ---------------------------------------------------------------------------------------------
                        for (var attr in prv.attrs) if (doc.attr(attr) && doc.attr(attr).trim().length > 0)  prv.attrs[attr] = doc.attr(attr).trim();
                        doc.attr('key', pub.key);

                        // Register document
                        // ---------------------------------------------------------------------------------------------
                        registry.documents[pub.key] = pub;

                        // Set loaded syntax and fire relevant events
                        // ---------------------------------------------------------------------------------------------
                        var eventSyntax = { key : pub.key, syntax : docEl.innerHTML };
                        services.$rootScope.$broadcast('$lcssSyntaxLoaded', eventSyntax);
                        prv.syntax.loaded = eventSyntax.syntax.trim();

                        // Initialize and inject host element
                        // ---------------------------------------------------------------------------------------------
                        var hostEl = document.createElement('liveCss'),
                            host = angular.element(hostEl);
                        host.attr('key', pub.key);
                        for (var key in prv.attrs) host.attr(key, prv.attrs[key]);
                        prv.host.document = hostEl;
                        document.head.appendChild(hostEl);

                        // Set compilation and interpolation watchers
                        // ---------------------------------------------------------------------------------------------
                        var stripScope = function($rootScope, $scope) {
                            var stripped = { };
                            for (var key in $scope) {
                                if ($scope.hasOwnProperty(key) && (typeof $scope['__proto__'][key] == 'undefined')) {
                                    stripped[key] = $scope[key];
                                }
                            }
                            for (var key in $rootScope) {
                                if ($rootScope.hasOwnProperty(key) && (key && key[0] != '$') && (key != 'this') && (typeof $rootScope['__proto__'][key] == 'undefined')) {
                                    stripped[key] = $rootScope[key];
                                }
                            }
                            return stripped;
                        }
                        prv.watcher = pub.$scope.$watch(
                            function() {
                                // Compose watched value
                                var value = {
                                    compilation :   (!prv.attrs.compile     ? stripScope(services.$rootScope.$lcss, pub.$scope)    : pub.$scope.$eval(prv.attrs.compile)),
                                    interpolation : (!prv.attrs.interpolate ? stripScope(services.$rootScope.$lcss, pub.$scope)    : pub.$scope.$eval(prv.attrs.interpolate))
                                };
                                return value;
                            },
                            function(newVal, oldVal) {
                                // Execute compilation and interpolation as needed
                                if ((!prv.syntax.compiled) || ((newVal.compilation) && (!angular.equals(newVal.compilation, oldVal.compilation)))) {
                                    prv.compile();
                                } else if ((newVal.interpolation) && (!angular.equals(newVal.interpolation, oldVal.interpolation))) {
                                    prv.interpolate();
                                }
                            }, true
                        )

                    },

                    // Compiles document's syntax
                    // -------------------------------------------------------------------------------------------------
                    compile : function(callbackFn) {
                        if (prv.syntax.loaded) {

                            // Time action
                            if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'compile', pub.key ]).time();

                            // Initialize syntax and host elements for rendering by angular
                            // -----------------------------------------------------------------------------------------

                            // Check (and create) compilation host element
                            if (!prv.host.compilation) { prv.host.compilation = document.createElement('liveCssCompiler'); }
                            // Inject new syntax for compiling
                            prv.host.compilation.innerHTML = prv.syntax.loaded;
                            // Wrap elements for manipulation
                            var compilationHost = angular.element( prv.host.compilation ),
                                documentHost = angular.element( prv.host.document );

                            // inject syntax for angular to compile
                            // -----------------------------------------------------------------------------------------
                            var compilationScope = pub.$scope.$new();
                            services.$compile( compilationHost )( compilationScope, function(compiledEl, $scope) {
                                if (compiledEl) {

                                    // Attach to document host
                                    documentHost.append(compiledEl);

                                    // Extract compiled syntax (once compiled by angular - wait for $digest end)
                                    // ---------------------------------------------------------------------------------
                                    services.$timeout(function() {

                                        // Parse syntax before injection
                                        var compiledSyntax = compiledEl[0].innerHTML;
                                        compiledSyntax = compiledSyntax.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}');

                                        // Remove compiled element from document host
                                        $scope.$destroy();
                                        $scope.$on("$destroy", function () {
                                            compiledEl.off();
                                        });
                                        compiledEl.remove();
                                        compiledEl = null;

                                        // Clear up syntax (remove HTML elements and comments) and store cleared (css) syntax
                                        var clearHostElement = document.createElement('liveCssCompilerCleanup');
                                        clearHostElement.innerHTML = compiledSyntax;
                                        do {
                                            var clearElements = [ ];
                                            for (var i=0; i<clearHostElement.childNodes.length; i++) if (clearHostElement.childNodes[i].localName) clearElements.push(clearHostElement.childNodes[i]);
                                            for (var i=0; i<clearElements.length; i++) clearElements[i].outerHTML = clearElements[i].innerHTML + '\r\n';
                                        } while (clearElements.length > 0);
                                        compiledSyntax = clearHostElement.innerHTML;
                                        do {
                                            var commentStart =  compiledSyntax.indexOf('<!--'),
                                                commentEnd =    compiledSyntax.indexOf('-->', commentStart) + '-->'.length;
                                            if ((commentStart >= 0) && (commentEnd >= 0)) compiledSyntax = compiledSyntax.substr(0, commentStart) + compiledSyntax.substr(commentEnd);
                                        } while ((commentStart >= 0) && (commentEnd >= 0));
                                        compiledSyntax = compiledSyntax.trim();
                                        // Check if interpolation needed
                                        if ((prv.syntax.compiled != compiledSyntax) || (!prv.attrs.compile) || (!prv.attrs.interpolate)) {

                                            // Set compiled syntax and fire relevant events
                                            // ---------------------------------------------------------------------
                                            var eventSyntax = { key : pub.key, syntax : compiledSyntax };
                                            services.$rootScope.$broadcast('$lcssSyntaxCompiled', eventSyntax);
                                            prv.syntax.compiled = prv.unhtmlize(eventSyntax.syntax);

                                            // Run interpolation process
                                            prv.interpolate(callbackFn);

                                        }

                                        // Time action
                                        if (timer) timer.stop();

                                    });

                                }
                            } );

                        }
                    },

                    // Interpolates document's syntax
                    // -------------------------------------------------------------------------------------------------
                    interpolate : function(callbackFn) {
                        if (prv.syntax.compiled) {

                            // Time action
                            if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'interpolate', pub.key ]).time();

                            // Interpolate compiled syntax
                            // -----------------------------------------------------------------------------------------
                            var interpolatedSyntax = services.$interpolate(prv.syntax.compiled)(pub.$scope);

                            // Check if interpolated syntax changed
                            if (prv.syntax.interpolated != interpolatedSyntax) {

                                // Un-HTML-ize syntax
                                interpolatedSyntax = prv.unhtmlize(interpolatedSyntax);

                                // Stored new interpolated syntax
                                prv.syntax.interpolated = interpolatedSyntax;

                                // Check (and create/inject) compilation host element
                                if (!prv.host.interpolation) {
                                    prv.host.interpolation = document.createElement('style');
                                    prv.host.document.appendChild(prv.host.interpolation);
                                }

                                // Set compiled syntax and fire relevant events
                                // ---------------------------------------------------------------------
                                var eventSyntax = { key : pub.key, syntax : prv.syntax.interpolated };
                                services.$rootScope.$broadcast('$lcssSyntaxInterpolated', eventSyntax);
                                prv.syntax.interpolated = eventSyntax.syntax;

                                // Inject cleared, interpolated syntax
                                prv.host.interpolation.innerHTML = prv.syntax.interpolated;

                                // Call the callback function
                                if (callbackFn) callbackFn();

                            }

                            // Time action
                            if (timer) timer.stop();

                        }
                    },

                    // Clears HTML short-hands from document's syntax
                    // -------------------------------------------------------------------------------------------------
                    unhtmlize : function(syntax) {
                        var replacements = {
                            '&lt;' : '<',
                            '&gt;' : '>'
                        }
                        var index = 0;
                        while (( index = syntax.indexOf('&', index) ) >= 0) {
                            var separator = syntax.indexOf(';', index),
                                tag = syntax.substr(index, separator - index + 1),
                                replacement = replacements[tag];
                            syntax = syntax.substr(0, index) + replacement + syntax.substr(separator + 1);
                            index += (replacement ? replacement.length : 0) - (tag ? tag.length : 0);
                        }
                        return syntax;
                    },

                    // Disposes of LiveCSS Document
                    // -------------------------------------------------------------------------------------------------
                    destroy : function() {

                        // Stop watcher
                        prv.watcher();

                        // Clear elements
                        if (prv.host.document) angular.element(prv.host.document).remove();
                        if (prv.host.compilation) angular.element(prv.host.compilation).remove();
                        if (prv.host.interpolation) angular.element(prv.host.interpolation).remove();

                        // Destroy scope
                        pub.$scope.$destroy();
                        pub.$scope.$on("$destroy", function () { });

                    }

                };

                // Live CSS document's public (exposed) namespace
                // -----------------------------------------------------------------------------------------------------

                var pub = {

                    // Live CSS Document's key and other parameters
                    // -------------------------------------------------------------------------------------------------
                    key : ((new Date()).getTime() + 1000000 * Math.random()).toString(16),
                    import : function() { return prv.import; },

                    // Live CSS Document's scope
                    // -------------------------------------------------------------------------------------------------
                    $scope : services.LiveCssCore.pub.$rootScope.$new(),

                    // Expose syntax
                    // -------------------------------------------------------------------------------------------------
                    syntax : prv.syntax,

                    // Expose compile and interpolate functions
                    // -------------------------------------------------------------------------------------------------

                    /**
                     * Compiles Live CSS syntax
                     */
                    compile : prv.compile,

                    /**
                     * Interpolates Live CSS syntax
                     */
                    interpolate : prv.interpolate,

                    /**
                     * Disposes of document
                     */
                    destroy : prv.destroy,

                }

                // Initialize Live CSS document's definition
                // -----------------------------------------------------------------------------------------------------

                // Allow timeout for extensions to load
                prv.initialize();

                // Return publicly available functionality
                // -----------------------------------------------------------------------------------------------------
                return pub;

            }
        }

        // Define Live CSS Extension class
        // -------------------------------------------------------------------------------------------------------------
        {
            /**
             * Defines an extensions to the library (adding bindable values to $rootScope)
             * @param key Unique extension key
             * @param applyFn Function pushing values to scope
             * @param watchFn Watch function picking up data changes (alternatively timeout number value for one time apply with limited frequency)
             * @param timeout Minimal timeout between two extension executions
             * @param global If true extension is bound to $rootScope regardless of configured imports
             * @constructor
             */
            var LiveCssExtension = function(key, applyFn, watchFn, timeout, global) {

                // Live CSS watcher's key
                // -----------------------------------------------------------------------------------------------------

                /**
                 * Holds watcher key value (for future reference)
                 * @type {*}
                 */
                this.key = key;
                /**
                 * Holds watcher's additional key values
                 * @type {Array}
                 */
                var additionalKeys = [ ];
                /**
                 * Sets watcher's additional key values
                 * @param keys Watcher's additional key values
                 */
                this.setAdditionalKeys = function(keys) { additionalKeys = keys; };

                // Register extension
                // -----------------------------------------------------------------------------------------------------
                if (registry.extensions[key]) delete(registry.extensions[key]);
                registry.extensions[key] = this;

                // Run extension
                // -----------------------------------------------------------------------------------------------------

                // Watcher process handle
                var watcher = null,
                    scopePush = function($scope, applyFn, newVal, oldVal) {
                        if (!$scope[key]) $scope[key] = { };
                        var domain = applyFn($scope[key], newVal, oldVal);
                        if (typeof domain != 'undefined') $scope[key] = domain;
                    };


                // If watcher function provided, start watcher process
                // -----------------------------------------------------------------------------------------------------
                if (watchFn && typeof watchFn == 'function') {

                    // Define imports resolution function (Searches for any documents importing the extension)
                    // -------------------------------------------------------------------------------------------------
                    var imported = function() {
                        // Check documents for import
                        for (var key in registry.documents) {
                            if (typeof registry.documents[key] == 'string') {
                                // Check imports (string)
                                if (this.key == registry.documents[key]) return true;
                            } else if ((typeof registry.documents[key] == 'object') && (typeof registry.documents[key].length != 'undefined')) {
                                // Check imports (array)
                                if (registry.documents[key].indexOf(this.key) >= 0) return true;
                            } else {
                                // Malformed imports statement - assume imports all
                                return [ ];
                            }
                        }
                        // No import found
                        return false;
                    }

                    // Execute watcher process
                    // -------------------------------------------------------------------------------------------------
                    watcher = services.$rootScope.$lcss.$watch(
                        function()                  { return (imported() ? watchFn() : null); },
                        function(newVal, oldVal)    {
                            // Execute with timeout
                            helper.scheduler.execute(this.key, function() {

                                // Time action
                                if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'extension', 'lcss', 'watched', key ], additionalKeys ).time();

                                // Check if global extension
                                if (!global) {
                                    // Get all documents importing this extension
                                    for (var i in registry.documents) {
                                        if (registry.documents[i].import().indexOf(key) >= 0) {
                                            // Push value to document scope
                                            var $scope = registry.documents[i].$scope;
                                            scopePush($scope, applyFn, newVal, oldVal);
                                        }
                                    }
                                } else {
                                    // Push value to $rootScope
                                    var $scope = services.$rootScope.$lcss;
                                    scopePush($scope, applyFn, newVal, oldVal);
                                }

                                // Time action
                                if (timer) timer.stop();

                            }, (timeout > 0 ? timeout : 0));
                        },
                        true
                    );

                }

                // Define the one-time execute apply function
                // -------------------------------------------------------------------------------------------------
                this.apply = function() {

                    // Time action
                    if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'extension', 'lcss', 'applyed', key ], additionalKeys ).time();

                    // Execute with timeout
                    helper.scheduler.execute(this.key, function() {

                        // Check if global extension
                        if (!global) {
                            // Get all documents importing this extension
                            for (var i in registry.documents) {
                                if (registry.documents[i].import().indexOf(key) >= 0) {
                                    var $scope = registry.documents[i].$scope;

                                    // Push value to document scope
                                    scopePush($scope, applyFn);

                                    // Apply to scope
                                    if (!$scope.$$phase) $scope.$digest();

                                }
                            }
                        } else {
                            // Push value to $rootScope
                            var $scope = services.$rootScope.$lcss;
                            scopePush($scope, applyFn);
                        }

                    }, (timeout > 0 ? timeout : 0));

                    // Time action
                    if (timer) timer.stop();

                }

                // Apply on new LiveCSS Document loaded
                // -----------------------------------------------------------------------------------------------------
                services.$rootScope.$on('$lcssSyntaxLoaded', function(e, value) {

                    // Time action
                    if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'extension', 'lcss', 'loaded', key ], additionalKeys ).time();

                    // Check if global extension
                    if (!global) {
                        // Get all documents importing this extension
                        for (var i in registry.documents) {
                            if (registry.documents[i].import().indexOf(key) >= 0) {
                                var $scope = registry.documents[i].$scope;

                                // Push value to document scope
                                scopePush($scope, applyFn);

                                // Apply to scope
                                if (!$scope.$$phase) $scope.$digest();

                            }
                        }
                    } else {
                        // Push value to $rootScope
                        var $scope = services.$rootScope.$lcss;
                        scopePush($scope, applyFn);
                    }

                    // Time action
                    if (timer) timer.stop();

                });

                // Do a one-tme apply after initialization
                // -----------------------------------------------------------------------------------------------------
                this.apply();

            }
        }

    }

    // Initialize Live CSS core provider
    // =================================================================================================================
    {
        module.provider('LiveCssCore', [ function( ) {

            // Initialize and return Live CSS core provider's definition
            // ---------------------------------------------------------------------------------------------------------
            return  {

                // Returns Live CSS core provider instance
                // -----------------------------------------------------------------------------------------------------
                $get : [        '$compile', '$interpolate', '$rootScope', '$q', '$http', '$timeout',
                        function($compile,   $interpolate,   $rootScope,   $q,   $http,   $timeout) {

                    // Register services to shared namespace
                    services.$compile =                                                 $compile;
                    services.$interpolate =                                             $interpolate;

                    services.$rootScope =                                               $rootScope;

                    services.$q =                                                       $q;
                    services.$http =                                                    $http;
                    services.$timeout =                                                 $timeout;

                    // Append LiveCSS documents and $rootScope to angular $routeScope
                    services.$rootScope.$lcss =                                         $rootScope.$new();
                    services.$rootScope.$lcss.fetch = services.$rootScope.$lcss.get =   function(key) {
                        return registry.documents[key];
                    };

                    // Initialize Live CSS core provider's internals
                    // -------------------------------------------------------------------------------------------------
                    {

                        // Live CSS public (exposed) namespace
                        // ---------------------------------------------------------------------------------------------
                        var pub = {

                            // Live CSS root scope
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Holds Live CSS root scope
                             */
                            $rootScope : services.$rootScope.$lcss,

                            // Live CSS fetching namespace
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Fetches Live CSS document by its defined key
                             * @param key Live CSS document key
                             * @returns {*} Selected Live CSS document
                             */
                            fetch : function(key) {
                                if (key) {
                                    // Fetch Live CSS document by key
                                    return prv.documents[key];
                                }
                            },
                            /**
                             * Alias for fetch
                             */
                            get : this.fetch,

                            // Live CSS importing namespace
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Imports Live CSS syntax into the page
                             * @param syntax Live CSS syntax
                             * @param attrs Additional attributes to be added to the Live CSS document
                             * @returns {Array} Array of imported Live CSS documents
                             */
                            import : function(syntax, attrs) {
                                var docs = LiveCssParser(syntax, (attrs ? attrs : { source : null }));
                                return docs;
                            },
                            /**
                             * Imports Live CSS file into the page
                             * @param syntax Live CSS file url
                             * @returns {Array} Promise for an array of imported Live CSS documents
                             */
                            importUrl : function(url) {
                                // Initialize promise
                                var deferredResult = $q.defer();
                                // Get file from url
                                $http.get(url).then(
                                    function(response) {
                                        // Process syntax
                                        var docs = pub.import(response.data, { source : url });
                                        deferredResult.resolve(docs);
                                    },
                                    function(err) {
                                        // Process error
                                        var docs = pub.import('/*' + err.status + '*/', { source : url, error : err.status });
                                        deferredResult.resolve(docs);
                                    }
                                );
                                // Return promise
                                return deferredResult.promise;
                            },

                            // Live CSS extensibility namespace
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Defines an extensions to the library (adding bindable values to $rootScope)
                             * @param key Unique extension key
                             * @param applyFn Function pushing values to scope
                             * @param watchFn Watch function picking up data changes (alternatively null for one time apply)
                             * @param timeout Minimal timeout between two extensions executions
                             * @param global If true extension is bound to $rootScope regardless of configured imports
                             * @constructor
                             */
                            extend : function(key, applyFn, watchFn, timeout, global) {
                                if (typeof watchFn == 'number' && typeof timeout != 'number') timeout = watchFn
                                return new LiveCssExtension(key, applyFn, watchFn, timeout, global)
                            },

                            /**
                             * Returns reference to central services repository (Only for internal use)
                             */
                            $$services : function() { return services; }
                        };

                    }

                    // Return public (exposed) namespace
                    services.LiveCssCore = { pub : pub, prv : registry };
                    return pub;

                } ]

            };

        } ]);
    }

}());


// Live CSS Toolkit module
// =====================================================================================================================
(function() {

    // Initialize Live CSS directives module
    // =================================================================================================================
    var module = angular.module('LiveCssToolkit', [ 'LiveCssCore' ]);

    // Live CSS toolkit private namespace
    // -----------------------------------------------------------------------------------------------------------------
    var registry = {

        // Live CSS toolkit's element binding namespace
        // -------------------------------------------------------------------------------------------------------------
        element : {

            /**
             * Global count for element unique key generation
             */
            uniqueKeyCount : 0,

            /**
             * Elements monitoring scope (for property binding via poll)
             */
            elementScope : null,
            elementScopeDigesting : false,
            /**
             * Holds instant digest status (if true all watchers disregard time delays)
             */
            instantDigest : false,

            /**
             * Holds references to added extensions
             */
            extensions : { }

        }

    };

    // Define Live CSS toolkit's Element watcher class
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * Defines an element watcher object
         * @param key Unique extension key
         * @param element HTML element being watched
         * @param imports Array of extensions applying to this binding
         * @constructor
         */
        var LiveCssElementWatcher = function(key, element, imports) {

            // Store parameters
            // ---------------------------------------------------------------------------------------------------------

            /**
             * Holds watcher key value
             * @type {*}
             */
            this.key = key;

            /**
             * Holds watcher element
             * @type {*}
             */
            this.element = element;
            /**
             * Holds watcher imports
             * @type {*}
             */
            this.imports = imports;

            // Initialize element
            // ---------------------------------------------------------------------------------------------------------

            /**
             * Holds element's unique key
             * @type {id|*|id|string|id|id}
             */
            var uniqueKey = this.uniqueKey = (element.id ? element.id : ((new Date()).getTime() + 1000000 * Math.random()).toString(16) + '#' + (registry.element.uniqueKeyCount++).toString(16));

            // Get applicable extensions
            // ---------------------------------------------------------------------------------------------------------
            var importedExtensions = [ ];
            if (typeof imports == 'string') {
                // Import single extension
                if (registry.element.extensions[imports]) importedExtensions = [ registry.element.extensions[imports] ];
            } else if ((imports) && (typeof imports == 'object') && (typeof imports.length != 'undefined')) {
                // Import multiple extensions
                for (var i=0; i<imports.length; i++) if (registry.element.extensions[ imports[i] ]) importedExtensions.push( registry.element.extensions[ imports[i] ] );
            } else {
                // Malformed imports - implies all extensions
                importedExtensions = [ ];
            }

            // Monitor element events
            // ---------------------------------------------------------------------------------------------------------

            // Get event sensitive imported extensions
            var eventExtensions = [ ],
                eventExtensionsTimeout = null;
            for (var i=0; i<importedExtensions.length; i++) if (importedExtensions[i].events) {
                eventExtensions.push( importedExtensions[i] );
                eventExtensionsTimeout = (typeof importedExtensions[i].timeout == 'number' ? importedExtensions[i].timeout : 1000);
            }

            // Track events
            for (var i=0; i<eventExtensions.length; i++) {
                var extension = eventExtensions[i],
                    extensionApplyFnFactory = function(extension, event) {
                        return function(params) {

                            // Time action
                            if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'extension', 'lcss-element', 'event', key, uniqueKey ], extension.getAdditionalKeys() ).time();

                            // Execute with timeout
                            helper.scheduler.execute(this.key, function() {

                                // Get all documents importing element extension
                                for (var i in services.LiveCssCore.prv.documents) {
                                    if (services.LiveCssCore.prv.documents[i].import().indexOf('element') >= 0) {
                                        var $scope = services.LiveCssCore.prv.documents[i].$scope;

                                        // Initialize element namespace on scope
                                        if (!$scope.element) $scope.element = { };
                                        if (!$scope.element[key]) $scope.element[key] = { };
                                        if (!$scope.element[key][uniqueKey]) $scope.element[key][uniqueKey] = { };

                                        // Get values
                                        var domain = extension.applyFn(element, $scope.element[key][uniqueKey], event, params);
                                        if (typeof domain != 'undefined') $scope.element[key][uniqueKey] = domain;

                                        // Apply to scope
                                        if (!$scope.$$phase) $scope.$digest();

                                    }
                                }

                                // Time action
                                if (timer) timer.stop();

                            }, ((eventExtensionsTimeout ? eventExtensionsTimeout : 0)));
                        }
                    }

                if (typeof extension.events == 'string') {

                    // Track event
                    var eventHandlerFn = extensionApplyFnFactory(extension, extension.events);
                    angular.element(this.element).on(extension.events, eventHandlerFn);
                    eventHandlerFn();

                } else if ((typeof extension.events == 'object') && (typeof extension.events.length != 'undefined')) {

                    // Track events
                    for (var j=0; j<extension.events.length; j++) {
                        var eventHandlerFn = extensionApplyFnFactory(extension, extension.events[j]);
                        angular.element(this.element).on(extension.events[j], eventHandlerFn);
                        eventHandlerFn();
                    }

                }

            }

            // Monitor element property values
            // ---------------------------------------------------------------------------------------------------------

            // Get event insensitive imported extensions
            var propertyExtensions = [ ],
                propertyExtensionsTimeout = null;
            for (var i=0; i<importedExtensions.length; i++) if (!importedExtensions[i].events) {
                propertyExtensions.push( importedExtensions[i] );
                propertyExtensionsTimeout = (typeof importedExtensions[i].timeout == 'number' ? importedExtensions[i].timeout : 1000);
            }

            // Initialize (isolated) element scope
            var newScope = !registry.element.elementScope;
            if (!registry.element.elementScope) registry.element.elementScope = services.$rootScope.$lcss.$new( true );

            // Check if newly created element scope - if so, trigger property polling
            if (newScope) {

                // Poll changes on element scope
                /* (Shuts down extra polling, only use internal Angular $digests)
                (function pollElementScope() {

                    // Scan for imediate poll
                    registry.element.instantDigest = false;

                    // Digest element scope
                    if (!registry.element.elementScopeDigesting && !services.$rootScope.$$phase && !registry.element.elementScope.$$phase) {

                        // Digest poll
                        registry.element.elementScopeDigesting = true;
                        registry.element.elementScope.$digest();
                        registry.element.elementScopeDigesting = false;

                    }

                    // Schedule next poll
                    services.$timeout(pollElementScope, propertyExtensionsTimeout);

                })();
                */


                // Poll changes on new LiveCSS Document loaded
                services.$rootScope.$on('$lcssSyntaxLoaded', function() {

                    if (!registry.element.elementScopeDigesting && !services.$rootScope.$$phase && !registry.element.elementScope.$$phase) {
                        registry.element.elementScopeDigesting = true;
                        registry.element.elementScope.$digest();
                        registry.element.elementScopeDigesting = false;
                    }

                });

            }

            // Define properties assembly function
            var propertiesAssemblyFn = function() {

                var properties = { };
                for (var i=0; i<propertyExtensions.length; i++) {
                    var extension = propertyExtensions[i];

                    // Time action
                    if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'extension', 'lcss-element', 'polling', 'watch', key, uniqueKey ], extension.getAdditionalKeys() ).time();

                    // Execute extension
                    var domain = extension.applyFn(element, properties);
                    if (domain) properties = domain;

                    // Time action
                    if (timer) timer.stop();

                }
                return properties;

            };
            // Define properties push function
            var propertiesPushFn = function(properties, force) {

                // Get all documents importing element extension
                for (var i in services.LiveCssCore.prv.documents) {
                    if (services.LiveCssCore.prv.documents[i].import().indexOf('element') >= 0) {
                        var $scope = services.LiveCssCore.prv.documents[i].$scope;

                        // Check if new property or forced
                        if ((force) || (!$scope.element || !$scope.element[key] || $scope.element[key][uniqueKey])) {
                            // Initialize element namespace
                            if (!$scope.element) $scope.element = { };
                            if (!$scope.element[key]) $scope.element[key] = { };
                            if (!$scope.element[key][uniqueKey]) $scope.element[key][uniqueKey] = { };

                            // Push properties to scope
                            for (var property in properties) $scope.element[key][uniqueKey][property] = properties[property];
                        }

                    }
                }

            }
            // Track changes on element scope
            var lastValue = null, lastWatcherExecution = 0;
            var watcher = registry.element.elementScope.$watch(
                function() {

                    // Check if element still exists
                    if (!element) { watcher(); return null; }

                    // Check last execution time (Limit extra evaluations fired off from parent scope)
                    var now = new Date().getTime();
                    if (registry.element.instantDigest || ((now - lastWatcherExecution) > propertyExtensionsTimeout)) {

                        // Update last execution time
                        lastWatcherExecution = now;

                        // Search for document importing element extension
                        for (var i in services.LiveCssCore.prv.documents) {
                            if (services.LiveCssCore.prv.documents[i].import().indexOf('element') >= 0) {

                                // Get element values
                                var value = propertiesAssemblyFn();

                                // Push to scopes with no previous value
                                propertiesPushFn(value, false);

                                // Return value for change detection
                                return value;

                            }
                        }

                    } else {

                        // Repeat previous value
                        return lastValue;

                    }

                },
                function(newVal, oldVal) {

                    // Check properties
                    if (newVal) {

                        helper.scheduler.execute(('PolledPropertyChange-' + uniqueKey), function() {

                            // Time action
                            if (services.LiveCssDebugger) var timer = services.LiveCssDebugger.stats.domains.get( [ 'extension', 'lcss-element', 'polling', 'apply', key, uniqueKey ] ).time();

                            // Update last value
                            lastValue = newVal;
                            // Allow a follow up watcher execution
                            registry.element.instantDigest = true;
                            // Push changes
                            propertiesPushFn(newVal, true);

                            // Time action
                            if (timer) timer.stop();

                        }, 10);

                    }

                },
                true
            )

            // Dispose of watcher
            // ---------------------------------------------------------------------------------------------------------
            this.destroy = function() {
                watcher();
            }

        }
    }

    // Define Live CSS toolkit's Element extension class
    // -----------------------------------------------------------------------------------------------------------------
    {
        /**
         * Defines an element extension object
         * @param key Unique extension key
         * @param applyFn Function applying bound changes to the scope
         * @param timeout Minimal timeout between two consequent events fireing (or polling in no events)
         * @param events Monitored element events
         * @constructor
         */
        var LiveCssElementExtension = function(key, applyFn, timeout, events) {

            // Store parameters
            // ---------------------------------------------------------------------------------------------------------

            /**
             * Holds extension key
             * @type {*}
             */
            this.key = key;
            /**
             * Holds watcher's additional key values
             * @type {Array}
             */
            var additionalKeys = [ '?' ];
            /**
             * Gets watcher's additional key values
             * @param keys Watcher's additional key values
             */
            this.getAdditionalKeys = function(keys) { return additionalKeys; };
            /**
             * Sets watcher's additional key values
             * @param keys Watcher's additional key values
             */
            this.setAdditionalKeys = function(keys) { additionalKeys = keys; };

            /**
             * Holds extension apply function
             * @type {*}
             */
            this.applyFn = applyFn;
            /**
             * Holds extension minimal timeout
             * @type {*}
             */
            this.timeout = timeout;
            /**
             * Holds extension monitored events
             * @type {*}
             */
            this.events = events;

            // Register extension
            // ---------------------------------------------------------------------------------------------------------

            registry.element.extensions[key] = this;

        }

    }

    // Initialize Live CSS toolkit provider
    // =================================================================================================================
    {
        module.provider('LiveCssToolkit', [ function( ) {

            // Initialize and return Live CSS toolkit provider's definition
            // ---------------------------------------------------------------------------------------------------------
            return {

                // Returns Live CSS provider instance
                // -----------------------------------------------------------------------------------------------------
                $get : [ 'LiveCssCore', '$timeout', function( LiveCssCore, $timeout ) {

                    // Initialize Live CSS toolkit provider's internals
                    // -------------------------------------------------------------------------------------------------
                    {

                        // Live CSS toolkit public namespace
                        // ---------------------------------------------------------------------------------------------
                        var pub = {


                            // Live CSS toolkit's element binding namespace
                            // ---------------------------------------------------------------------------------------------
                            element : {

                                /**
                                 * Binds to element's properties
                                 * @param key Unique element (group) key
                                 * @param elements HTML element (or array of elements) to bind to
                                 * @param imports Array of extensions applying to this element
                                 */
                                bind : function(key, elements, imports) {

                                    // Check if one or multiple elements
                                    if (typeof elements.length != 'undefined') {
                                        // Add elements
                                        var watchers = [ ];
                                        for (var i=0; i<elements.length; i++) watchers.push( new LiveCssElementWatcher(key, elements[i], imports) );
                                        return watchers;
                                    } else {
                                        // Add element
                                        return new LiveCssElementWatcher(key, elements[i], imports);
                                    }

                                },

                                /**
                                 * Defines an extension to the LiveCSS toolkit's element binding functionality
                                 * @param key Unique extension key
                                 * @param applyFn Function applying bound changes to the scope
                                 * @param timeout Minimal timeout between two consequent events fireing (or polling in no events)
                                 * @param events Monitored element events
                                 */
                                extend : function(key, applyFn, timeout, events) {
                                    // Add extension
                                    return new LiveCssElementExtension(key, applyFn, timeout, events);
                                }

                            }

                        };

                    }

                    // Define and register Math extension
                    // -------------------------------------------------------------------------------------------------
                    {
                        var math = Object.create(Math, { });
                        /**
                         * Rounds passed number to a fixed number of decimals
                         * @param num Number to round
                         * @param decimals Number of decimal places to round to (default 0)
                         * @returns {number} Rounded number
                         */
                        math.round = function(num, decimals) {
                            if (typeof decimals == 'undefined') {
                                return Math.round(num);
                            } else {
                                return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
                            }
                        };
                        /**
                         * Rounds up passed number to a fixed number of decimals
                         * @param num Number to round
                         * @param decimals Number of decimal places to round to (default 0)
                         * @returns {number} Rounded up number
                         */
                        math.ceil = function(num, decimals) {
                            if (typeof decimals == 'undefined') {
                                return Math.ceil(num);
                            } else {
                                return Math.ceil(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
                            }
                        };
                        /**
                         * Rounds down passed number to a fixed number of decimals
                         * @param num Number to round
                         * @param decimals Number of decimal places to round to (default 0)
                         * @returns {number} Rounded down number
                         */
                        math.floor = function(num, decimals) {
                            if (typeof decimals == 'undefined') {
                                return Math.floor(num);
                            } else {
                                return Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
                            }
                        };
                        LiveCssCore.extend('Math', function(domain) { return (domain = math); }, null, 0, true)
                    }

                    // Define and register Array extension
                    // -------------------------------------------------------------------------------------------------
                    {
                        var array = Object.create(Array, { });
                        /**
                         * Generates an array populated with integers ranging from a to b
                         * (if only a is passed, range from 0 to a)
                         * @param a Range lower bound
                         * @param b Range upper bound
                         * @returns {Array} Generated range array
                         */
                        array.range = function(a, b) {
                            var range = [ ];
                            for (var i=(typeof b == 'undefined' ? 0 : a); i<(typeof b == 'undefined' ? a : b); i++) range.push(i);
                            return range;
                        };
                        LiveCssCore.extend('Array', function(domain) { return (domain = array); }, null, 0, true);
                    }

                    // Define and register Window state extension
                    // -------------------------------------------------------------------------------------------------
                    {
                        // Track window size
                        var sizeExtension = LiveCssCore.extend('window', function(domain) {
                            domain.size = {
                                width :     window.innerWidth,
                                height :    window.innerHeight
                            };
                        }, null, 200);
                        sizeExtension.setAdditionalKeys( [ 'size' ] );
                        angular.element(window).on('resize', function() { sizeExtension.apply(); });

                        // Track window scroll
                        var scrollExtension = LiveCssCore.extend('window', function(domain) {
                            domain.scroll = {
                                x :         window.scrollX,
                                y :         window.scrollY
                            }
                        }, null, 200);
                        scrollExtension.setAdditionalKeys( [ 'scroll' ] );
                        angular.element(window).on('scroll', function() { scrollExtension.apply(); });
                    }

                    // Define and register Mouse movement extension
                    // -------------------------------------------------------------------------------------------------
                    {
                        // Track mouse properties
                        var mouseEventParams = {
                            timeout : {
                                promise : null,
                                interval : 1000,
                                nextExec : 0,
                                lastExec : 0
                            },
                            position : {
                                x : window.innerWidth / 2,
                                y : window.innerHeight / 2,
                                history : [ ]
                            }
                        };
                        var mousePositionApplyFnFactory = function(extension) {
                            return function(e) {
                                // Update event position params
                                mouseEventParams.position.history.push({
                                    time : (new Date()).getTime(),
                                    x : e.clientX,
                                    y : e.clientY,
                                    distance : Math.sqrt( Math.pow((mouseEventParams.position.x - e.clientX), 2) + Math.pow((mouseEventParams.position.y - e.clientY), 2) )
                                });
                                if (mouseEventParams.position.history.length > 256) {
                                    mouseEventParams.position.history = mouseEventParams.position.history.splice(1);
                                }
                                // Update event position params
                                mouseEventParams.position.x = e.clientX;
                                mouseEventParams.position.y = e.clientY;
                                // Apply extension
                                extension.apply();
                            };
                        }

                        // Refresh mouse position extension
                        var refreshMousePositionExtension = function(extension, timeout, refresh) {
                            // Check and update timeout parameters
                            if (!refresh) refresh = 1000;
                            var timeoutLastExec = (new Date()).getTime() + timeout;
                            // Update timeout time and interval
                            mouseEventParams.timeout.lastExec = (mouseEventParams.timeout.lastExec > timeoutLastExec ? mouseEventParams.timeout.lastExec : timeoutLastExec);
                            mouseEventParams.timeout.interval = (mouseEventParams.timeout.interval < refresh ? mouseEventParams.timeout.interval : refresh);
                            // Refresh extension (if refresh not queued)
                            (function refreshFn(force) {
                                // Check if refresh already queued
                                var nextRefreshTime = (new Date()).getTime() + mouseEventParams.timeout.interval;
                                if ((force || !mouseEventParams.timeout.promise || !mouseEventParams.timeout.nextExec || (nextRefreshTime < mouseEventParams.timeout.nextExec))) {
                                    // Clear refresh timeout
                                    if (mouseEventParams.timeout.promise) {
                                        $timeout.cancel(mouseEventParams.timeout.promise);
                                        mouseEventParams.timeout.promise = null;
                                    }
                                    // Set refresh timeout
                                    mouseEventParams.timeout.promise = $timeout(function() {
                                        // Timeout cleanup
                                        mouseEventParams.timeout.promise = null;
                                        // Execute function
                                        mousePositionExtension.apply()
                                        // Check if timeout
                                        if ((new Date()).getTime() < mouseEventParams.timeout.lastExec) refreshFn();
                                    }, mouseEventParams.timeout.interval);
                                    mouseEventParams.timeout.nextExec = nextRefreshTime;
                                }
                            })(true);
                        }
                        // Extend mouse position
                        var mousePositionExtension = LiveCssCore.extend('mouse', function mousePositionExtensionFn(domain) {
                            domain.position = {
                                time : (new Date()).getTime(),

                                x :         (mouseEventParams.position.x / window.innerWidth),
                                y :         (mouseEventParams.position.y / window.innerHeight),
                                clientX :   mouseEventParams.position.x,
                                clientY :   mouseEventParams.position.y,

                                history : (domain && domain.position && domain.position.history ? domain.position.history : {
                                    exists : function(interval) {
                                        // Check if last point within interval
                                        var now = (new Date()).getTime();
                                        var exists = (!interval || mouseEventParams.position.history.length == 0 ? false : (now - mouseEventParams.position.history[mouseEventParams.position.history.length - 1].time < interval));
                                        // Set refresh timeout
                                        if (interval && exists) refreshMousePositionExtension(mousePositionExtension, interval, interval);
                                        // Return result
                                        return exists;
                                    },
                                    points : function(interval, refresh) {
                                        var now = (new Date()).getTime();
                                        if (!interval) {
                                            // Return all points
                                            return mouseEventParams.position.history;
                                        } else {
                                            // Get points within interval
                                            var points = [ ];
                                            for (var i=(mouseEventParams.position.history.length - 1); i>=0; i--) {
                                                if (now - mouseEventParams.position.history[i].time > interval) {
                                                    // Interval complete
                                                    for (var j=(i+1); j<mouseEventParams.position.history.length; j++) points.push(mouseEventParams.position.history[j]);
                                                    break;
                                                }
                                            };
                                            // Set refresh timeout
                                            refreshMousePositionExtension(mousePositionExtension, interval, refresh);
                                            // Return points
                                            return points;
                                        }
                                    },
                                    distance : function(interval, refresh) {
                                        var now = (new Date()).getTime();
                                        if (!interval) {
                                            // Return distance of last point
                                            return (mouseEventParams.position.history.length > 0 ? mouseEventParams.position.history[mouseEventParams.position.history.length - 1] : 0);
                                        } else {
                                            // Get distance within interval
                                            var distance = 0;
                                            for (var i=(mouseEventParams.position.history.length - 1); i>=0; i--) {
                                                if (now - mouseEventParams.position.history[i].time <= interval) {
                                                    // Register distance
                                                    distance += mouseEventParams.position.history[i].distance
                                                } else {
                                                    // Interval complete
                                                    break;
                                                }
                                            };
                                            // Set refresh timeout
                                            if (distance) refreshMousePositionExtension(mousePositionExtension, interval, refresh);
                                            // Return distance
                                            return distance;
                                        }
                                    }
                                })
                            };
                        }, null, 40);
                        mousePositionExtension.setAdditionalKeys( [ 'position' ] );
                        angular.element(window).on('mousemove', mousePositionApplyFnFactory(mousePositionExtension));
                        angular.element(window).on('click', mousePositionApplyFnFactory(mousePositionExtension));
                        angular.element(window).on('touchstart', mousePositionApplyFnFactory(mousePositionExtension));
                    }

                    // Define and register Element extensions
                    // -------------------------------------------------------------------------------------------------
                    {
                        // Track element size
                        var elementSizeApplyFn = function(element, domain, event, params) {
                            domain.size = {
                                width :         element.clientWidth,
                                height :        element.clientHeight,

                                clientWidth :   element.clientWidth,
                                clientHeight :  element.clientHeight,
                                offsetWidth :   element.offsetWidth,
                                offsetHeight :  element.offsetHeight
                            };
/*
                            var style = window.getComputedStyle(element);
                            domain.size = {
                                width :         parseInt( style.width ),
                                height :        parseInt( style.height ),

                                clientWidth :   element.clientWidth,
                                clientHeight :  element.clientHeight,
                                offsetWidth :   element.offsetWidth,
                                offsetHeight :  element.offsetHeight
                            };
*/
                        };
                        var extension = pub.element.extend('size', elementSizeApplyFn, 200);
                        extension.setAdditionalKeys( [ 'size' ] );

                        // Track element scroll
                        var elementScrollApplyFn = function(element, domain, event, params) {
                            domain.scroll = {
                                x :             element.scrollLeft,
                                y :             element.scrollTop
                            };
                            var extension = pub.element.extend('scroll', elementScrollApplyFn, 200, [ 'scroll' ]);
                            extension.setAdditionalKeys( [ 'scroll' ] );
                        };

                        // Track element value
                        var elementValueApplyFn = function(element, domain, event, params) {
                            domain.value = (element.value ? element.value : null);
                            var extension = pub.element.extend('value', elementValueApplyFn, 200, [ 'change' ]);
                            extension.setAdditionalKeys( [ 'value' ] );
                        };
                    }

                    // Return public (exposed) namespace
                    // -------------------------------------------------------------------------------------------------
                    services.LiveCssToolkit = { pub : pub, prv : registry };
                    return pub;

                } ]

            };

        } ]);
    }


}());


// Live CSS Directives module
// =====================================================================================================================
(function() {

    // Initialize Live CSS directives module
    // =================================================================================================================
    var module = angular.module('LiveCssDirectives', [ 'LiveCssCore', 'LiveCssToolkit' ]);

    // Define Live CSS directives
    // =================================================================================================================
    {

        // Define LiveCSS loading directives
        // -------------------------------------------------------------------------------------------------------------
        {

            // Define loading directive (element) add/removed handlers
            // ---------------------------------------------------------------------------------------------------------
            var registry = { };
            var directiveAddedFn = function(key, docs, element) {
                // Register element/document pair
                if (!registry[key]) registry[key] = { docs : [ ], elements : [ ] };
                for (var i=0; i<docs.length; i++) registry[key].docs.push(docs[i]);
                registry[key].elements.push(element[0]);
            };
            var directiveRemovedFn = function(key, element) {
                if (registry[key]) {
                    // Remove element/document pair
                    for (var i=0; i < registry[key].elements.length; i++) {
                        if (element[0] == registry[key].elements[i]) {
                            registry[key].elements.splice(i, 1);
                            break;
                        }
                    }
                    // Check if other dependant elements
                    if (registry[key].elements.length == 0) {
                        // Destroy LiveCSS document
                        for (var i=0; i<registry[key].docs.length; i++) {
                            registry[key].docs[i].destroy();
                        }
                        // Unregister
                        delete(registry[key]);
                    }
                }
            };

            // Define LiveCSS include ('lcss-src') directive
            // ---------------------------------------------------------------------------------------------------------
            module.directive('lcssSrc', [ 'LiveCssCore', 'LiveCssToolkit', function( LiveCssCore, LiveCssToolkit ) {
                return {
                    scope: true,
                    link : function($scope, element, attrs) {

                        $scope.$watch(
                            function() { return $scope.$eval(attrs['lcssSrc']); },
                            function(newVal, oldVal) {

                                // Remove elements from previous url
                                directiveRemovedFn(oldVal, element );

                                // Get source url
                                var url = newVal

                                // Check if previously loaded
                                if (!registry[url]) {

                                    // Load live CSS
                                    LiveCssCore.importUrl(url).then(function(docs) {

                                        // Register elements
                                        directiveAddedFn(url, docs, element );

                                        // Handle element removal
                                        element.on('$destroy', function() { directiveRemovedFn(url, element ); });

                                        // TODO: Handle loaded callback ...

                                    });

                                } else {

                                    // Register element to previously loaded LiveCSS
                                    directiveAddedFn(url, [ ], element );

                                    // Handle element removal
                                    element.on('$destroy', function() { directiveRemovedFn(url, element ); });

                                    // TODO: Handle loaded callback ...

                                }

                            }
                        );

                    }
                };
            } ]);
        }

        // Define LiveCSS Element binding directives
        // -------------------------------------------------------------------------------------------------------------
        {

            // Define LiveCSS include ('lcss-src') directive
            // ---------------------------------------------------------------------------------------------------------
            module.directive('lcssElement', [ 'LiveCssCore', 'LiveCssToolkit', function( LiveCssCore, LiveCssToolkit ) {
                return {
                    scope: true,
                    link : function($scope, element, attrs) {
                        // Private namespace
                        var prv = { watcher : null }
                        // Watch parameters
                        $scope.$watch(
                            function() {
                                var key = $scope.$eval(attrs['lcssElement']);
                                return {
                                    key : (key ? key : attrs['lcssElement']),
                                    imports : (attrs['lcssElementImport'] ? $scope.$eval(attrs['lcssElementImport']) : null)
                                };
                            },
                            function(newVal, oldVal) {
                                // Clear previous watcher
                                if (prv.watcher) prv.watcher.destroy();
                                // Bind element
                                prv.watcher = LiveCssToolkit.element.bind(newVal.key, element, newVal.imports);
                            },
                            true
                        );

                    }
                };
            } ]);
        }

    }

}());

}())