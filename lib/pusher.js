"use strict";
var runtime_1 = require("runtime");
var Collections = require('./utils/collections');
var dispatcher_1 = require('./events/dispatcher');
var timeline_1 = require('./timeline/timeline');
var level_1 = require('./timeline/level');
var StrategyBuilder = require('./strategies/strategy_builder');
var timers_1 = require('./utils/timers');
var defaults_1 = require('./defaults');
var DefaultConfig = require('./config');
var logger_1 = require('./logger');
var state_1 = require('./connection/state');
var factory_1 = require('./utils/factory');
var Pusher = (function () {
    function Pusher(app_key, options) {
        checkAppKey(app_key);
        options = options || {};
        var self = this;
        this.key = app_key;
        this.config = Collections.extend(DefaultConfig.getGlobalConfig(), options.cluster ? DefaultConfig.getClusterConfig(options.cluster) : {}, options);
        this.channels = factory_1.default.createChannels();
        this.global_emitter = new dispatcher_1.default();
        this.sessionID = Math.floor(Math.random() * 1000000000);
        this.timeline = new timeline_1.default(this.key, this.sessionID, {
            cluster: this.config.cluster,
            features: runtime_1.default.getClientFeatures(),
            params: this.config.timelineParams || {},
            limit: 50,
            level: level_1.default.INFO,
            version: defaults_1.default.VERSION
        });
        if (!this.config.disableStats) {
            this.timelineSender = factory_1.default.createTimelineSender(this.timeline, {
                host: this.config.statsHost,
                path: "/timeline/v2"
            });
        }
        var getStrategy = function (options) {
            var config = Collections.extend({}, self.config, options);
            return StrategyBuilder.build(defaults_1.default.getDefaultStrategy(config), config);
        };
        this.connection = factory_1.default.createConnectionManager(this.key, Collections.extend({ getStrategy: getStrategy,
            timeline: this.timeline,
            activityTimeout: this.config.activity_timeout,
            pongTimeout: this.config.pong_timeout,
            unavailableTimeout: this.config.unavailable_timeout
        }, this.config, { encrypted: this.isEncrypted() }));
        this.connection.bind('connected', function () {
            self.subscribeAll();
            if (self.timelineSender) {
                self.timelineSender.send(self.connection.isEncrypted());
            }
        });
        this.connection.bind('message', function (params) {
            var internal = (params.event.indexOf('pusher_internal:') === 0);
            if (params.channel) {
                var channel = self.channel(params.channel);
                if (channel) {
                    channel.handleEvent(params.event, params.data);
                }
            }
            if (!internal) {
                self.global_emitter.emit(params.event, params.data);
            }
        });
        this.connection.bind('disconnected', function () {
            self.channels.disconnect();
        });
        this.connection.bind('error', function (err) {
            logger_1.default.warn('Error', err);
        });
        Pusher.instances.push(this);
        this.timeline.info({ instances: Pusher.instances.length });
        if (Pusher.isReady) {
            self.connect();
        }
    }
    Pusher.ready = function () {
        Pusher.isReady = true;
        for (var i = 0, l = Pusher.instances.length; i < l; i++) {
            Pusher.instances[i].connect();
        }
    };
    Pusher.logToConsole = function () {
        if (!console.log)
            throw "Your environment doesn't have console.log. Please use Pusher.setLogger for your own custom logger.";
        this.setLogger(function (log) {
            console.log(log);
        });
    };
    Pusher.setLogger = function (logger) {
        logger_1.default.log = logger;
    };
    Pusher.prototype.channel = function (name) {
        return this.channels.find(name);
    };
    Pusher.prototype.allChannels = function () {
        return this.channels.all();
    };
    Pusher.prototype.connect = function () {
        this.connection.connect();
        if (this.timelineSender) {
            if (!this.timelineSenderTimer) {
                var encrypted = this.connection.isEncrypted();
                var timelineSender = this.timelineSender;
                this.timelineSenderTimer = new timers_1.PeriodicTimer(60000, function () {
                    timelineSender.send(encrypted);
                });
            }
        }
    };
    Pusher.prototype.disconnect = function () {
        this.connection.disconnect();
        if (this.timelineSenderTimer) {
            this.timelineSenderTimer.ensureAborted();
            this.timelineSenderTimer = null;
        }
    };
    Pusher.prototype.bind = function (event_name, callback) {
        this.global_emitter.bind(event_name, callback);
        return this;
    };
    Pusher.prototype.bind_all = function (callback) {
        this.global_emitter.bind_all(callback);
        return this;
    };
    Pusher.prototype.subscribeAll = function () {
        var channelName;
        for (channelName in this.channels.channels) {
            if (this.channels.channels.hasOwnProperty(channelName)) {
                this.subscribe(channelName);
            }
        }
    };
    Pusher.prototype.subscribe = function (channel_name) {
        var channel = this.channels.add(channel_name, this);
        if (this.connection.state === state_1.default.CONNECTED) {
            channel.subscribe();
        }
        return channel;
    };
    Pusher.prototype.unsubscribe = function (channel_name) {
        var channel = this.channels.remove(channel_name);
        if (channel && this.connection.state === state_1.default.CONNECTED) {
            channel.unsubscribe();
        }
    };
    Pusher.prototype.send_event = function (event_name, data, channel) {
        return this.connection.send_event(event_name, data, channel);
    };
    Pusher.prototype.isEncrypted = function () {
        if (runtime_1.default.getProtocol() === "https:") {
            return true;
        }
        else {
            return Boolean(this.config.encrypted);
        }
    };
    Pusher.instances = [];
    Pusher.isReady = false;
    Pusher.Runtime = runtime_1.default;
    Pusher.ScriptReceivers = runtime_1.default.ScriptReceivers;
    Pusher.DependenciesReceivers = runtime_1.default.DependenciesReceivers;
    return Pusher;
}());
function checkAppKey(key) {
    if (key === null || key === undefined) {
        throw "You must pass your app key when you instantiate Pusher.";
    }
}
runtime_1.default.whenReady(Pusher.ready);
module.exports = Pusher;
//# sourceMappingURL=pusher.js.map