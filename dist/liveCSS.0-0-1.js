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
                        // Expose LiveCss toolkit's element namespace
                        element : LiveCssToolkit.element,
                        // Expose LiveCss toolkit's containment namespace
                        container : LiveCssToolkit.container
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
                for (var i=0; i<sections.length; i++) {
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

                    // Initializes document's options and sets watchers for compilation and interpolation stages
                    // -------------------------------------------------------------------------------------------------
                    initialize : function() {


                        // Import document options, imports and key - generic value key if not present
                        // ---------------------------------------------------------------------------------------------
                        var doc = angular.element(docEl);
                        if (doc.attr('key')) pub.key = doc.attr('key').trim();
                        if (doc.attr('import')) prv.import = pub.$scope.$eval(doc.attr('import').trim());
                        for (var attr in prv.attrs) if (doc.attr(attr)) prv.attrs[attr] = doc.attr(attr);
                        doc.attr('key', pub.key);

                        // Register imports
                        // ---------------------------------------------------------------------------------------------
                        if (angular.isArray(prv.import)) for (var i=0; i<prv.import.length; i++) {
                            if (angular.isNumber(services.LiveCssCore.prv.imports[prv.import[i]])) {
                                services.LiveCssCore.prv.imports[prv.import[i]] += 1;
                            } else {
                                services.LiveCssCore.prv.imports[prv.import[i]] = 1;
                            }
                        }

                        // Set loaded syntax and fire relevant events
                        // ---------------------------------------------------------------------------------------------
                        var eventSyntax = { key : pub.key, syntax : docEl.innerHTML };
                        services.$rootScope.$broadcast('LiveCssDocument-SyntaxLoaded', eventSyntax);
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
                        pub.$scope.$watch(
                            function() {
                                var value = {
                                    compilation :   (!prv.attrs.compile     ? stripScope(services.$rootScope, pub.$scope)    : pub.$scope.$eval(prv.attrs.compile)),
                                    interpolation : (!prv.attrs.interpolate ? stripScope(services.$rootScope, pub.$scope)    : pub.$scope.$eval(prv.attrs.interpolate))
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
                                            services.$rootScope.$broadcast('LiveCssDocument-SyntaxCompiled', eventSyntax);
                                            prv.syntax.compiled = eventSyntax.syntax;

                                            // Run interpolation process
                                            prv.interpolate(callbackFn);

                                        }

                                    });

                                }
                            } );

                        }
                    },

                    // Interpolates document's syntax
                    // -------------------------------------------------------------------------------------------------
                    interpolate : function(callbackFn) {
                        if (prv.syntax.compiled) {

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
                                services.$rootScope.$broadcast('LiveCssDocument-SyntaxInterpolated', eventSyntax);
                                prv.syntax.interpolated = eventSyntax.syntax;

                                // Inject cleared, interpolated syntax
                                prv.host.interpolation.innerHTML = prv.syntax.interpolated;

                                // Call the callback function
                                if (callbackFn) callbackFn();

                            }

                        }
                    },

                    // Clears HTML short-hands from document's syntax
                    // -------------------------------------------------------------------------------------------------
                    unhtmlize : function(syntax) {
                        /*
                        // Define characters
                        var htmlChars = {
                            '&lt;' : '<',
                            '&lgt;' : '>'
                        }
                        // Replace characters
                        for (var htmlChar in htmlChars) syntax = syntax.replace(new RegExp(htmlChar, 'g'), htmlChars[htmlChar]);
                        */
                        // Return replaced
                        return syntax;
                    }

                };

                // Live CSS document's public (exposed) namespace
                // -----------------------------------------------------------------------------------------------------

                var pub = {

                    // Live CSS Document's key (Default generic value)
                    // -------------------------------------------------------------------------------------------------
                    key : ((new Date()).getTime() + 1000000 * Math.random()).toString(16),

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
                    interpolate : prv.interpolate

                }

                // Initialize Live CSS document's definition
                // -----------------------------------------------------------------------------------------------------
                prv.initialize();
                return pub;

            }
        }

        // Define Live CSS Watcher class
        // -------------------------------------------------------------------------------------------------------------
        {
            /**
             * Defines and registers a watcher instance
             * @param key Watcher key (for future reference)
             * @param watchFn Function detecting changes to watched value
             * @param applyFn Function handling update of watcher value
             * @param $scope (Internal) Scope to which the watcher will be applied (By default, $rootScope)
             * @returns {*} Watcher object
             * @constructor
             */
            var LiveCssWatcher = function(key, watchFn, applyFn, $scope) {

                // Live CSS watcher's key
                // -----------------------------------------------------------------------------------------------------

                /**
                 * Holds watcher key value (for future reference)
                 * @type {*}
                 */
                this.key = key;

                // Watcher manipulation
                // -----------------------------------------------------------------------------------------------------

                var started = true;
                /**
                 * Starts watcher
                 */
                this.start = function() { started = true; };
                /**
                 * Stops watcher
                 */
                this.stop = function() { started = false; };

                /**
                 * Executes watcher's apply function with last watched data
                 * @type {Function}
                 */
                var apply = this.apply = function() {
                    if ((started) && (services.LiveCssCore.prv.imports[key])) {
                        applyFn($scope, watchFn())
                        if (!$scope.$$phase) $scope.$apply();
                    }
                }

                /**
                 * Destroys watcher
                 */
                this.destroy = function() {
                    // Stop watcher
                    stopWatch();
                    // Remove from registry
                    delete(services.LiveCssCore.prv.watchers[key]);
                }

                // Dependency tracking
                // -----------------------------------------------------------------------------------------------------

                // Initialize registration count (Import preregistered from loaded documents)
                if (services.LiveCssCore.prv.imports[key]) this.apply();
                // Dependency registration namespace
                this.$dependancies = {
                    /**
                     * Registers a dependency document
                     */
                    register :     function() {
                        services.LiveCssCore.prv.imports[key] += 1;
                        if ((started) && (regs > 0)) apply();
                    },
                    /**
                     * Unregisters a dependency document
                     */
                    unregister :   function() { services.LiveCssCore.prv.imports[key] -= 1; }
                }

                // Start watching
                // -----------------------------------------------------------------------------------------------------
                var stopWatch = $scope.$watch(
                    function() {
                        return ((started) && (services.LiveCssCore.prv.imports[key]) ? watchFn() : false)
                    },
                    function(newVal, oldVal) {
                        if ((started) && (services.LiveCssCore.prv.imports[key])) {
                            applyFn($scope, newVal);
                        }
                    },
                    true
                );

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
                    services.$compile =                         $compile;
                    services.$interpolate =                     $interpolate;
                    services.$rootScope =                       $rootScope;
                    services.$q =                               $q;
                    services.$http =                            $http;
                    services.$timeout =                         $timeout;

                    // Append LiveCSS documents and $rootScope to angular $routeScope
                    services.$rootScope.$lcss =                 $rootScope;
                    services.$rootScope.$lcss.document =        function(key) {
                        return prv.documents[key];
                    };

                            // Initialize Live CSS core provider's internals
                    // -------------------------------------------------------------------------------------------------
                    {

                        // Live CSS private namespace
                        // ---------------------------------------------------------------------------------------------
                        var prv = {

                            // Holds references to imported Live DCSS documents
                            documents : { },

                            // Holds references to all defined watchers
                            watchers : { },
                            // Holds imported dependancies' counts
                            imports : { },

                            // Internaly exposed reference to Lice CSS watcher class
                            watcherClass : LiveCssWatcher

                        };

                        // Live CSS public (exposed) namespace
                        // ---------------------------------------------------------------------------------------------
                        var pub = {

                            // Live CSS root scope
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Holds Live CSS root scope
                             */
                            $rootScope : services.$rootScope.$new(),

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
                                } else {
                                    // Fetch root scope
                                    return { $scope : services.$rootScope };
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
                                var docs = LiveCssParser(syntax, (attrs ? attrs : { source : 'local' }));
                                for (var i=0; i<docs.length; i++) prv.documents[docs[i].key] = docs[i];
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

                            // Live CSS watchers namespace
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Defines and registers a watcher
                             * @param key Watcher key (for future reference)
                             * @param watchFn Function detecting changes to watched value
                             * @param applyFn Function handling update of watcher value
                             * @returns {*} Watcher object
                             */
                            watcher : function(key, watchFn, applyFn) {
                                // Define and store watcher
                                prv.watchers[key] = new LiveCssWatcher(key, watchFn, applyFn, pub.$rootScope);
                                return prv.watchers[key];
                            }

                        };

                    }

                    // Return public (exposed) namespace
                    services.LiveCssCore = { pub : pub, prv : prv };
                    return pub;

                } ]

            };

        } ]);
    }

}());


// Live CSS Toolkit module
// =====================================================================================================================
(function() {

    // Initialize Live CSS toolkit module
    // =================================================================================================================
    var module = angular.module('LiveCssToolkit', [ 'LiveCssCore' ]);

    // Initialize Live CSS toolkit functionality
    // =================================================================================================================
    {

        // Define Live CSS toolkit Element watcher function class
        // -------------------------------------------------------------------------------------------------------------
        {
            /**
             * Defines and registers a watcher instance
             * @param key Watcher function key value (for future reference)
             * @param watchFn Function detecting changes to watched element
             * @returns {*} Watcher function object
             * @constructor
             */
            var LiveCssElementWatcherFn = function(key, watchFn) {

                /**
                 * Holds watcher function key
                 */
                this.key = key;
                /**
                 * Holds watcher function's watch function reference
                 * @type {*}
                 */
                this.watchFn = watchFn;

                /**
                 * Destroys watcher function object
                 */
                this.destroy = function() {
                    delete(services.LiveCssToolkit.prv.element.watchFns[key]);
                }
            }
        }

        // Define Live CSS toolkit Element watcher class
        // -------------------------------------------------------------------------------------------------------------
        {
            /**
             * Defines and registers a watcher instance
             * @param key Watched element's key (for future reference)
             * @param element Watched element
             * @param events DOM events that fire off watcher evaluation
             * @param $scope (Internal) Scope to which the watcher will be applied (By default, $rootScope)
             * @returns {*} Watcher object
             * @constructor
             */
            var LiveCssElementWatcher = function(key, element, events, $scope) {

                // Store properties
                // -----------------------------------------------------------------------------------------------------

                /**
                 * Holds element watcher's key
                 * @type {*}
                 */
                this.key = key;
                /**
                 * Holds element watcher's unique key
                 * @type {*}
                 */
                var uniqueKey = this.uniqueKey = (element.id ? element.id : ((new Date()).getTime() + 1000000 * Math.random()).toString(16));
                /**
                 * Holds watched element's reference
                 * @type {*}
                 */
                this.element = element;

                // Register CSS watcher for watched element
                // -----------------------------------------------------------------------------------------------------
                var watchFn = function() {
                    var result = { };
                    for (var watchFnKey in services.LiveCssToolkit.prv.element.watchFns) {
                        result[watchFnKey] = services.LiveCssToolkit.prv.element.watchFns[watchFnKey].watchFn(element);
                    }
                    return result;
                };
                var applyFn = function($scope, value) {
                    // Store element value
                    if (!$scope.element) $scope.element = { };
                    if (!$scope.element[key]) $scope.element[key] = { };
                    $scope.element[key][uniqueKey] = value;
                };
                var watcher = new services.LiveCssCore.prv.watcherClass( 'element', watchFn, applyFn, $scope );
                services.LiveCssToolkit.prv.element.watchers[key][uniqueKey] = watcher;

                // Register event handlers
                // -----------------------------------------------------------------------------------------------------
                if (element && events) for (var i=0; i<events.length; i++) {
                    element.addEventListener(events[i], function() {
                        watcher.apply();
                    }, true);
                }

                // Element watcher manipulation functions
                // -----------------------------------------------------------------------------------------------------

                /**
                 * Starts watcher
                 */
                this.start = function() { watcher.start(); }
                /**
                 * Stops watcher
                 */
                this.stop = function() { watcher.stop(); }

                /**
                 * Destroys element watcher
                 */
                this.destroy = function() {
                    // Destroy watcher
                    watcher.destroy();
                    // Unregister event listeners
                    if (element && events) for (var i=0; i<events.length; i++) element.removeEventListener(events[i]);
                    for (var i=0; i<events.length; i++) element.addEventListener(events[i], function() { watcher.apply(); });
                    // Remove from registry
                    delete(services.LiveCssToolkit.prv.element.watchers[key][uniqueKey]);
                }

                /**
                 * Applys changes to element watcher value
                 */
                this.apply = function() { watcher.apply(); }

            }
        }

    }

    // Initialize Live CSS toolkip provider
    // =================================================================================================================
    {
        module.provider('LiveCssToolkit', [ function( ) {

            // Initialize and return Live CSS toolkit provider's definition
            // ---------------------------------------------------------------------------------------------------------
            return {

                // Returns Live CSS provider instance
                // -----------------------------------------------------------------------------------------------------
                $get : [ 'LiveCssCore', function( LiveCssCore ) {

                    // Initialize Live CSS toolkit provider's internals
                    // -------------------------------------------------------------------------------------------------
                    {

                        // Live CSS toolkit private namespace
                        // ---------------------------------------------------------------------------------------------
                        var prv = {

                            // Live CSS toolkit's element watcher namespace
                            element : {

                                // Holds references to all defined element watcher functions
                                watchFns : { },

                                // Holds references to watchers sharing same element key
                                watchers : { }

                            },

                            // Live CSS toolkit's containment namespace
                            containment : {

                                // Holds references to container elements
                                containers : { }

                            }

                        };

                        // Live CSS toolkit public namespace
                        // ---------------------------------------------------------------------------------------------
                        var pub = {

                            // Live CSS toolkit's element watcher namespace
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Element watcher namespace
                             */
                            element : {

                                /**
                                 * Registers an element watcher function
                                 * @param key Watcher function key (for future reference)
                                 * @param watchFn Watcher function extracts element's watched value
                                 * @returns {*} Watcher function object
                                 */
                                watcher : function(key, watchFn) {
                                    prv.element.watchFns[key] = new LiveCssElementWatcherFn(key, watchFn);
                                    return prv.element.watchFns[key];
                                },

                                /**
                                 * Registers a watcher on an HTML element
                                 * @param key Watched element's key (for future reference))
                                 * @param selector Watched element or jQuery element selector expression
                                 * @param events DOM events that fire off watcher evaluation
                                 * @returns {*} Watcher object
                                 */
                                watch : function(key, selector, events) {
                                    if (!prv.element.watchers[key]) prv.element.watchers[key] = { };
                                    var watchers = [ ],
                                        elements = angular.element(selector);
                                    for (var i=0; i<elements.length; i++) watchers.push(new LiveCssElementWatcher(key, elements[i], (events ? events : [ ]), services.LiveCssCore.pub.$rootScope));
                                    return watchers;
                                }

                            },

                            // Live CSS toolkit's containment namespace
                            // -----------------------------------------------------------------------------------------

                            /**
                             * Containment namespace
                             */
                            container : {

                                /**
                                 * Adds a container for a Live CSS document
                                 * @param documentKey Contained Live CSS document's key
                                 * @param selector Container element or jQuery element selector expression
                                 */
                                add : function(documentKey, selector) {

                                    // Get Live CSS document by document key
                                    var document = services.LiveCssCore.pub.fetch(documentKey);
                                    if (document) {

                                        // Initialize container function on document's scope
                                        if (!document.$scope.container) document.$scope.container = function(selector) {

                                            // Parse container selectors
                                            var containerSelector = '';
                                            if (prv.containment.containers[documentKey]) for (var i=0; i<prv.containment.containers[documentKey].length; i++) {
                                                containerSelector += (containerSelector.length > 0 ? ',\r\n' : '') + '.' + prv.containment.containers[documentKey][i].cssClass + ' ' + selector + ' ';
                                            }
                                            return containerSelector;

                                        }

                                    }

                                    // Register container elements
                                    var elements = angular.element(selector);
                                    for (var i=0; i<elements.length; i++) {
                                        var cssClass = 'livecss-container-' + ((new Date()).getTime() + 1000000 * Math.random()).toString(16).replace(/\./g, '-');
                                        angular.element(elements[i]).addClass(cssClass);
                                        if (!prv.containment.containers[documentKey]) prv.containment.containers[documentKey] = [ ];
                                        prv.containment.containers[documentKey].push( { element : elements[i], cssClass : cssClass } );
                                    }

                                    // Recompile document
                                    document.compile();

                                },

                                /**
                                 * Removes a container for a Live CSS document
                                 * @param documentKey Contained Live CSS document's key
                                 * @param selector Container element or jQuery element selector expression
                                 */
                                remove : function(documentKey, selector) {

                                    // Get elements
                                    var elements = angular.element(selector);

                                    // Remove elements
                                    for (var i=0; i<elements.length; i++) {

                                        // Check if containers registered
                                        if (prv.containment.containers[documentKey]) {

                                            // Find container element
                                            for (var j=0; i<prv.containment.containers[documentKey].length; j++) {
                                                if (prv.containment.containers[documentKey][j] == elements[i]) {

                                                    // Unregister container
                                                    prv.containment.containers[documentKey].splice(j, 1);

                                                    // Sto search
                                                    break;

                                                }
                                            }

                                        }

                                    }

                                    // Recompile document
                                    document.compile();

                                }

                            }

                        };

                    }

                    // Define and register basic Element watcher functions
                    // -------------------------------------------------------------------------------------------------
                    {
                        pub.element.watcher('size', function(element) {
                            return {
                                width :         element.clientWidth,
                                height :        element.clientHeight,

                                clientWidth :   element.clientWidth,
                                clientHeight :  element.clientHeight,
                                offsetWidth :   element.offsetWidth,
                                offsetHeight :  element.offsetHeight
                            }
                        });
                        pub.element.watcher('scroll', function(element) {
                            return {
                                x :             element.scrollLeft,
                                y :             element.scrollTop
                            }
                        });
                        pub.element.watcher('value', function(element) {
                            return (element.value ? element.value : null);
                        }, ['change']);
                    }

                    // Define and register Math object
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
                        LiveCssCore.fetch().Math = math;
                        LiveCssCore.fetch().$scope.Math = math;
                    }

                    // Define and register Array object
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
                        LiveCssCore.fetch().Array = array;
                        LiveCssCore.fetch().$scope.Array = array;
                    }

                    // Define and register Window state watcher
                    // -------------------------------------------------------------------------------------------------
                    {
                        var windowWatcher = LiveCssCore.watcher(
                            'window',
                            function() {
                                return {
                                    size : {
                                        width :     window.innerWidth,
                                        height :    window.innerHeight
                                    },
                                    scroll : {
                                        x :         window.scrollX,
                                        y :         window.scrollY
                                    }
                                };
                            }, function($scope, value) {
                                $scope.window = value;
                            }
                        );
                        window.addEventListener('resize', function() { windowWatcher.apply(); }, true);
                        window.addEventListener('scroll', function() { windowWatcher.apply(); }, true);
                    }

                    // Define and register Mouse movement watcher
                    // -------------------------------------------------------------------------------------------------
                    {
                        var mousePosition = { x : null, y : null },
                            mouseWatcher = LiveCssCore.watcher(
                            'mouse',
                            function() {
                                return {
                                    position : {
                                        x :         (mousePosition.x / window.innerWidth),
                                        y :         (mousePosition.y / window.innerHeight),
                                        clientX :   mousePosition.x,
                                        clientY :   mousePosition.y
                                    }
                                };
                            }, function($scope, value) {
                                $scope.mouse = value;
                            }
                        );
                        document.body.addEventListener('mousemove', function(e) {
                            mousePosition = { x : e.clientX, y : e.clientY };
                            windowWatcher.apply();
                        }, true);
                        document.body.addEventListener('click', function(e) {
                            mousePosition = { x : e.clientX, y : e.clientY };
                            windowWatcher.apply();
                        }, true);
                        document.body.addEventListener('touchstart', function(e) {
                            mousePosition = { x : e.clientX, y : e.clientY };
                            windowWatcher.apply();
                        }, true);
                    }

                    // Return public (exposed) namespace
                    // -------------------------------------------------------------------------------------------------
                    services.LiveCssToolkit = { pub : pub, prv : prv };
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

        // Define LiveCSS include ('lcss-src') directive
        // -------------------------------------------------------------------------------------------------------------
        {
            module.directive('lcssSrc', [ 'LiveCssCore', 'LiveCssToolkit', function( LiveCssCore, LiveCssToolkit ) {
                return {
                    scope: true,
                    link : function($scope, element, attrs) {

                        // Get source url
                        var url = $scope.$eval(attrs['lcssSrc']);

                        // Load live CSS
                        LiveCssCore.importUrl(url).then(function(docs) {
                            // TODO: Handle loaded callback ...
                        });

                    }
                };
            } ]);
        }

    }

}());

}())