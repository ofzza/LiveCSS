/* =====================================================================================================================
 Live CSS Debug extensions
 ofzza, 2014.
 ==================================================================================================================== */
"use strict";

// Self-executing entry point
(function () {

// Live CSS Debugger module
// =====================================================================================================================
    (function() {

        // Initialize Live CSS Debugger module
        // =================================================================================================================
        var module = angular.module('LiveCssDebug', [ 'LiveCssCore', 'LiveCssDebugDirectives' ]);

        // Initialize Live CSS Debugger provider
        // =================================================================================================================
        {

            module.provider('LiveCssDebug', [ function( ) {

                // Initialize and return Live CSS Debugger provider's definition
                // ---------------------------------------------------------------------------------------------------------
                return {

                    // Returns Live Debugger CSS provider instance
                    // -----------------------------------------------------------------------------------------------------
                    $get : [ 'LiveCssCore', '$rootScope', '$timeout', function( LiveCssCore, $rootScope, $timeout ) {

                        // Initialize stats tracking functionality
                        // -------------------------------------------------------------------------------------------------

                        // Stats repository
                        var stats = { };
                        /**
                         * References stats domain(s) by key
                         * @param keys Array of domain keys
                         * @constructor
                         */
                        var StatsDomain = function(keys) {

                            // Check if not dummy domain (has keys)
                            if (keys) {

                                // Store domains
                                this.keys = keys

                                // Get/Initialize domains
                                var domains = [ ], target = stats;
                                for (var i=0; i<keys.length; i++) {
                                    if (!target.domains) target.domains = { };
                                    if (target.domains[keys[i]]) {
                                        // Get existing domain
                                        domains.push( target.domains[keys[i]] );
                                    } else {
                                        // Add domain
                                        var domain = {
                                            key : keys[i],
                                            domains : { }
                                        }
                                        domains.push( target.domains[keys[i]] = domain );
                                    }
                                    target = target.domains[keys[i]];
                                }

                                // Check for cleared domains
                                for (var i=0; i<domains.length; i++) if (domains[i].cleared) {
                                    for (var key in domains[i]) {
                                        if ((key != 'key') && (key != 'domains') && (key != 'cleared')) delete(domains[i][key]);
                                    }
                                    domains[i].cleared = false;
                                }

                                /**
                                 * Creates a new domain action tracking object
                                 * @returns {StatsDomainAction}
                                 */
                                this.time = function() { return new StatsDomainTimer(domains); };

                            } else {

                                /**
                                 * Creates a dummy domain action tracking object
                                 * @returns {StatsDomainAction}
                                 */
                                this.time = function() { return new StatsDomainTimer(null); };

                            }


                        };
                        /**
                         * Provides execution timing for domain(s)
                         * @param domains Array of domain references for logging
                         * @constructor
                         */
                        var StatsDomainTimer = function(domains) {

                            // Check if not dummy domain (has keys)
                            if (domains) {

                                // Initialize timestamps
                                this.timestamp = {
                                    start : (new Date()).getTime(),
                                    stop : null
                                };

                                /**
                                 * Stops timer and saves elapsed time info
                                 */
                                this.stop = function() {
                                    // Set timestamp
                                    this.timestamp.stop = (new Date()).getTime();
                                    // Process domain(s)
                                    for (var i=0; i<domains.length; i++) {
                                        if (!domains[i].timer) domains[i].timer = {
                                            time : 0,
                                            count : 0
                                        };
                                        domains[i].timer.time += this.timestamp.stop -this.timestamp.start;
                                        domains[i].timer.count++;
                                    }
                                }

                            } else {

                                /**
                                 * Dummy function
                                 */
                                this.stop = function() { };

                            }

                        }

                        // Define Live Debugger CSS provider instance
                        // -------------------------------------------------------------------------------------------------
                        var provider = {

                            // Stats tracking namespace
                            // -----------------------------------------------------------------------------------------------------
                            stats : {

                                domains : {

                                    /**
                                     * Gets a reference object for domains sleected by keys
                                     * @param keys Array of domain keys
                                     * @param keys Array of additional domain keys (Gets appended to keys)
                                     * @returns {StatsDomain}
                                     */
                                    get : function(keys, additionalKeys) {
                                        if (provider.stats.interval > 0) {
                                            // Return stat domain object
                                            if (additionalKeys && additionalKeys.length > 0) for (var i=0; i<additionalKeys.length; i++) keys.push( additionalKeys[i] );
                                            return new StatsDomain(keys);
                                        } else {
                                            // Return dummy stat domain object
                                            return new StatsDomain(null);
                                        }
                                    },

                                    /**
                                     * Clears all domains
                                     */
                                    clear : function(domain) {
                                        if (stats.domains) {
                                            if (!domain) domain = stats;
                                            domain.cleared = true;
                                            for (var key in domain.domains) {
                                                provider.stats.domains.clear(domain.domains[key]);
                                            }
                                        }
                                    }

                                },

                                /**
                                 * Clears all stats
                                 */
                                clear : function() {
                                    provider.stats.cleared = true;
                                    provider.stats.domains.clear();
                                },

                                // Output interval
                                interval : 0,

                                // Holds logged outputs
                                log : { }

                            }

                        };

                        // Start timeout loop outputing debug info
                        // -----------------------------------------------------------------------------------------------------
                        var logTimestamp = 0;
                        var logDomainTimerFn = function(domain, level, log, key) {
                            // Initialize
                            if (!log) log = [ ];
                            var record = {
                                key : (key ? key + '.' : '') + domain.key,
                                parent : key,
                                domain : domain.key,
                                children : false,
                                level : (level ? level : 0),
                                cleared : domain.cleared,
                                count : 0,
                                time : 0
                            };
                            // Store domain record
                            var interval = (new Date()).getTime() - logTimestamp;
                            if (domain.timer) {
                                record.count = ( domain.timer.count / (interval / 1000));
                                record.time = (domain.timer.time / interval)
                            }
                            log.push( record );
                            // Store child domain's records
                            if (domain.domains) for (var key in domain.domains) {
                                record.children = true;
                                logDomainTimerFn(domain.domains[key], (level ? level : 0) + 1, log, record.key);
                            }
                            // Return log
                            return log;
                        };
                        (function logLoopFn() {

                            // Check if anything to log
                            if ((stats.domains) && (provider.stats.interval > 0)) {

                                // Log domains
                                provider.stats.log.timers = [ ];
                                for (var key in stats.domains) {
                                    var records = logDomainTimerFn(stats.domains[key]);
                                    for (var i=0; i<records.length; i++) provider.stats.log.timers.push( records[i] );
                                }

                                // Clear stats
                                provider.stats.clear();

                                // Set new timestamp
                                logTimestamp = (new Date()).getTime();

                            } else {

                                provider.stats.log = { };

                            }

                            // Schedule next execution
                            $timeout(logLoopFn, (provider.stats.interval > 0 ? provider.stats.interval : 1000));

                        }())

                        // Stash provider to services repository
                        // -----------------------------------------------------------------------------------------------------
                        LiveCssCore.$$services().LiveCssDebugger = provider;

                        // Return provider
                        // -----------------------------------------------------------------------------------------------------
                        return provider;

                    } ]

                };

            } ]);

        }

    }());



// Live CSS Debugger Directives module
// =====================================================================================================================
    (function() {

        // Initialize Live CSS directives module
        // =================================================================================================================
        var module = angular.module('LiveCssDebugDirectives', [ 'LiveCssCore', 'LiveCssToolkit' ]);

        // Define Live CSS directives
        // =================================================================================================================
        {

            // Define LiveCSS Debugger directive
            // -------------------------------------------------------------------------------------------------------------
            {

                // Define LiveCSS debugger ('lcss-debug') directive
                // ---------------------------------------------------------------------------------------------------------
                module.directive('lcssDebug', [ 'LiveCssCore', 'LiveCssDebug', function( LiveCssCore, LiveCssDebug ) {
                    return {
                        scope: false,
                        template :
                            '<div>' +
                            '   <div ng-if=" debugger.active.get() ">' +
                            '      <div style="position: fixed; right: 20px; bottom: 4px; padding: 2px 4px; border: 1px solid #aaa; border-radius: 8px 0px 0px 0px; box-shadow: 1px 1px 1px 1px #999; background-color: rgba(255, 255, 255, 0.94); cursor: pointer;">' +
                            '          <span ng-transclude></span>' +
                            '          <a style="margin-left: 20px;" ng-click=" debugger.visible.set( !debugger.visible.get() ) "> Debugger window </a>' +
                            '      </div>' +
                            '      <div ng-show=" debugger.visible.get() " style="position: fixed; right: 20px; bottom: 40px; height: 50%; width: 33%; min-height: 400px; min-width: 380px; overflow-y: scroll; padding: 2px 4px; border: 1px solid #aaa; border-radius: 8px; box-shadow: 1px 1px 1px 1px #999; background-color: rgba(255, 255, 255, 0.8); ">' +
                            '          <div style=" position: absolute; "></div>' +
                            '          <table style="width: 100%; margin: 0px 0px 80px 0px;">' +
                            '              <tr style=" border-bottom: 1px dotted #999; background-color: #aaa; color: #444; font-size: 11px; font-weight: bold;">' +
                            '                  <td style=" padding-left: 10px; "> <input type="checkbox" ng-model=" debugger.collapse.all " title=" Show all" /> </td>' +
                            '                  <td style=" text-align: left; "> Process </td>' +
                            '                  <td style=" width: 20%; text-align: center; "> Calls/Sec </td>' +
                            '                  <td style=" width: 20%; text-align: center; "> Load </td>' +
                            '              </tr>' +
                            '              <tr ng-repeat=" timer in debugger.content.timers " ng-show=" timer.level == 0 || debugger.collapse.is(timer.key) " ng-style=" { \'border-bottom\': \'1px dotted #999\', \'background-color\': (timer.level == 0 ? \'#eee\' : \'none\' ), \'color\': (timer.level != 0 && !timer.cleared ? \'#4a4\' : \'#999\'), \'font-size\': (timer.level == 0 || !timer.children ? \'11px\' : \'9px\'), \'font-weight\': (!timer.children ? \'bold\' : \'normal\') }">' +
                            '                  <td style=" padding-left: 10px; "> <input type="checkbox" ng-hide=" debugger.collapse.all " ng-model=" debugger.collapse.expanded[timer.key] " title=" Collapse / Expand " style=" width: 10px; height: 10px; " /> </td>' +
                            '                  <td ng-style=" { \'padding-left\': (10 * timer.level) + \'px\' } " title=" {{ timer.key }} "> {{ timer.domain }} </td>' +
                            '                  <td style=" text-align: center; "> {{ timer.count | number:2 }} </td>' +
                            '                  <td style=" text-align: center; "> {{ timer.time * 100 | number:2 }}% </td>' +
                            '              </tr>' +
                            '          </table>' +
                            '      </div>' +
                            '      <table ng-show=" debugger.visible.get() " style="position: fixed; right: 44px; bottom: 44px; width: 320px; padding: 2px 4px; border: 1px solid #aaa; border-radius: 8px; background-color: rgba(255, 255, 255, 0.8); font-size: 9px; ">' +
                            '          <td> Refresh every </td>' +
                            '          <td> <input type="range" min="0" max="30000" step="500" ng-model=" debugger.interval.value " ng-change=" debugger.interval.set( debugger.interval.value ); " style="width: 130px;" /> </td>' +
                            '          <td>  {{ ( debugger.interval.value > 0 ? (debugger.interval.value / 1000) + \' secs\' : \'never\' ) }} </td>' +
                            '      </table>' +
                            '   </div>' +
                            '</div>',
                        link : function($scope, element, attrs) {

                            // Initialize scope
                            var visible = false,
                                active = (attrs['lcssDebug'] && $scope.$eval(attrs['lcssDebug'])),
                                interval = 0;
                            $scope.debugger = {
                                active : {
                                    get : function() { return active; }
                                },
                                visible : {
                                    get : function() { return visible; },
                                    set : function(value) {
                                        if (value) {
                                            LiveCssDebug.stats.interval = interval;
                                            $scope.debugger.interval.set(interval);
                                        } else {
                                            interval = LiveCssDebug.stats.interval;
                                            LiveCssDebug.stats.interval = 0;
                                            $scope.debugger.interval.set(interval);
                                        }
                                        visible = value;
                                    }
                                },
                                interval : {
                                    set : function(value) { $scope.debugger.interval.value = LiveCssDebug.stats.interval = value; },
                                    value : 0
                                },
                                collapse : {
                                    expanded : {  },
                                    all : true,
                                    is : function(key) {
                                        if ($scope.debugger.collapse.all) return true;
                                        var parsed = key.split('.'), current = '';
                                        for (var i=0; i<(parsed.length - 1); i++) {
                                            current += (current.length > 0 ? '.' : '') + parsed[i];
                                            if (!$scope.debugger.collapse.expanded[current]) return false;
                                        }
                                        return true;
                                    }
                                },
                                content : ''
                            }

                            // If not active, expose console command and set interval
                            if (!active) {
                                if (!window.lcss) window.lcss = { };
                                window.lcss.debug = function(value) {
                                    // Set interval
                                    interval = 1000;
                                    LiveCssDebug.stats.interval = interval;
                                    $scope.debugger.interval.set(interval);
                                    // Activate
                                    active = (typeof value == 'undefined' ? true : (value ? true : false));
                                    if (!$scope.$$phase) $scope.$digest();
                                };
                            } else {
                                // Set interval
                                interval = 1000;
                                LiveCssDebug.stats.interval = interval;
                                $scope.debugger.interval.set(interval);
                            }

                            // Update debugger output
                            $scope.$watch(
                                function() { return LiveCssDebug.stats.log; } ,
                                function(newVal, oldVal) {
                                    $scope.debugger.content = newVal;
                                },
                                true
                            );

                        },
                        transclude: true,
                        replace: true
                    };
                } ]);
            }

        }

    }());

}())