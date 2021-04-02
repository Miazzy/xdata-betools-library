'use strict'

var Utils = require('./utils');
var setupDefaults = require('./setup');
var methodExports = require('../object');

/**
 * @function mixing functions 
 * @param {Object} methods
 */
Utils.mixin = function(methods) {
    methodExports.each(methods, function(fn, name) {
        Utils[name] = methodExports.isFunction(fn) && fn._c !== false ? function() {
            var result = fn.apply(Utils.$context, arguments)
            Utils.$context = null
            return result
        } : fn
    })
    return Utils;
}

Utils.setup = function(options) {
    methodExports.assign(setupDefaults, options);
}

Utils.mixin(methodExports);

module.exports = Utils;
module.exports.default = Utils;