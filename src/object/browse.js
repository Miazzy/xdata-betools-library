'use strict'

var baseExports = require('./base')

/* eslint-disable valid-typeof */
function isBrowseStorage (storage) {
  try {
    var testKey = '__xe_t'
    storage.setItem(testKey, 1)
    storage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

function isBrowseType (type) {
  return navigator.userAgent.indexOf(type) > -1
}

/**
  * 获取浏览器内核
  * @return Object
  */
function browse () {
  var $body, $dom, isChrome, isEdge
  var isMobile = false
  var strUndefined = 'undefined'
  var result = {
    isNode: false,
    isMobile: isMobile,
    isPC: false,
    isDoc: typeof document !== strUndefined
  }
  if (typeof window === strUndefined && typeof process !== strUndefined) {
    result.isNode = true
  } else {
    isEdge = isBrowseType('Edge')
    isChrome = isBrowseType('Chrome')
    isMobile = /(Android|webOS|iPhone|iPad|iPod|SymbianOS|BlackBerry|Windows Phone)/.test(navigator.userAgent)
    if (result.isDoc) {
      $dom = document
      $body = $dom.body || $dom.documentElement
      baseExports.each(['webkit', 'khtml', 'moz', 'ms', 'o'], function (core) {
        result['-' + core] = !!$body[core + 'MatchesSelector']
      })
    }
    baseExports.assign(result, {
      edge: isEdge,
      msie: !isEdge && result['-ms'],
      safari: !isChrome && !isEdge && isBrowseType('Safari'),
      isMobile: isMobile,
      isPC: !isMobile,
      isLocalStorage: isBrowseStorage(window.localStorage),
      isSessionStorage: isBrowseStorage(window.sessionStorage)
    })
  }
  return result
}

/**
  * 复制内容到系统粘贴板
  *
  */
var doc = window.document
function getContainer () {
  var $copy = doc.getElementById('$BESCopy')
  if (!$copy) {
    $copy = doc.createElement('input')
    $copy.id = '$BESCopy'
    $copy.style['width'] = '48px'
    $copy.style['height'] = '12px'
    $copy.style['position'] = 'fixed'
    $copy.style['z-index'] = '0'
    $copy.style['left'] = '-500px'
    $copy.style['top'] = '-500px'
    doc.body.appendChild($copy)
  }
  return $copy
}
function copyContent (content) {
  var $copy = getContainer()
  var value = content === null || content === undefined ? '' : '' + content
  try {
    $copy.value = value
    $copy.focus()
    $copy.setSelectionRange(0, value.length)
    return doc.execCommand('copy', true)
  } catch (e) {}
  return false
}

var browseExports = {
  browse: browse,
  copyContent: copyContent
}

module.exports = browseExports
