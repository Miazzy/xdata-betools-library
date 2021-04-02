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
var queryExports = require('./query');
var manageExports = require('./manage');
var lockExports = require('./lock');
var taskExports = require('./task');
var crontabExports = require('./crontab');
var contactExports = require('./contact');
var workconfigExports = require('./workconfig');
var workflowExports = require('./workflow');
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
    storageExports,
    announceExports,
    queryExports,
    manageExports,
    taskExports,
    workconfigExports,
    workflowExports,
    wflowprocessExports,
    contactExports,
    lockExports,
    crontabExports,
);

module.exports = methodExports