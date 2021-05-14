'use strict'

var baseExports = require('./base');
var arrayExports = require('./array');
var browseExports = require('./browse');
var cookieExports = require('./cookie');
var dateExports = require('./date');
var locatExports = require('./locat');
var numberExports = require('./number');
var stringExports = require('./string');
var constantExports = require('./constant');
var fileExports = require('./file');
var toolsExports = require('./tools');
var storageExports = require('./storage');
var announceExports = require('./announce');
var contactExports = require('./contact');
var queryExports = require('./query');
var lockExports = require('./lock');
var taskExports = require('./task');
var crontabExports = require('./crontab');
var workconfigExports = require('./workconfig');
var manageExports = require('./manage');
var consoleExports = require('./console');
var sealapplyExports = require('./sealapply');
var workflowExports = require('./workflow');
var rateLimiterExports = require('./rateLimiter');
var wflowprocessExports = require('./wflow.process');
var methodExports = {};

Object.assign(
    methodExports,
    arrayExports,
    baseExports,
    browseExports,
    cookieExports,
    dateExports,
    locatExports,
    numberExports,
    stringExports,
    constantExports,
    fileExports,
    toolsExports,
    queryExports,
    storageExports,
    announceExports,
    manageExports,
    taskExports,
    workconfigExports,
    sealapplyExports,
    workflowExports,
    wflowprocessExports,
    contactExports,
    lockExports,
    crontabExports,
    consoleExports,
    rateLimiterExports,
);

module.exports = methodExports