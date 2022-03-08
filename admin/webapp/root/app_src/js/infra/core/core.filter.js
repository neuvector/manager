(function() {
    'use strict';

    angular
        .module('app.core')
        .filter('capitalize', capitalize)
        .filter('capitalizeEach', capitalizeEach)
        .filter('shortenName', shortenName)
        .filter('bytes', bytes)
        .filter('bytesBy1000', bytesBy1000)
        .filter('secondsToDateTime', secondsToDateTime)
        .filter('makePositive', makePositive)
        .filter('ifEmpty', ifEmpty)
        .filter('shorten', shorten)
        .filter('shorten2', shorten2);

    function capitalize() {
      return function(word) {
        return (!!word) ? `${word.charAt(0).toUpperCase()}${word.substring(1).toLowerCase()}` : "";
      }
    }

    function capitalizeEach() {
      return function(sentence) {
        return sentence.split(" ").map(w => capitalize()(w)).join(" ");
      }
    }

    function shortenName() {
      return function(str, limit) {
        if (str) {
          if (str.length > limit) {
            return `${str.substring(0, limit - 3)}...${str.substring(
              str.length - 3,
              str.length
            )}`;
          }
          return str;
        }
      };
    }

    function bytes() {
      return function(bytes, precision) {
        if (bytes === 0) { return '' }
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;

        var units = ['', 'KB', 'MB', 'GB', 'TB', 'PB'],
          number = Math.floor(Math.log(bytes) / Math.log(1024)),
          val = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

        return  (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) +  ' ' + units[number];
      }
    }

    function bytesBy1000() {
      return function(bytes, precision) {
        if (bytes === 0) { return '' }
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;

        var units = ['', 'KB', 'MB', 'GB', 'TB', 'PB'],
          number = Math.floor(Math.log(bytes) / Math.log(1000)),
          val = (bytes / Math.pow(1000, Math.floor(number))).toFixed(precision);

        return  (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) +  ' ' + units[number];
      }
    }

    function secondsToDateTime() {
      return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
      };
    }

    function makePositive() {
      return function(num) {
        return Math.abs(num);
      }
    }

    function ifEmpty() {
      return function(input, defaultValue) {
        if (angular.isUndefined(input) || input === null || input === '' || input <= 0) {
          return defaultValue;
        }
        return input;
      }
    }

    function shorten() {
      return function(str, len) {
        return str.length > len ? str.substring(0, len) : str;
      }
    }

    function shorten2() {
      return function(str, len) {
        if (str.length > len) {
          return `${str.substring(0, len - 8)}...${str.substring(
            str.length - 8,
            str.length
          )}`;
        }
        return str;
      }
    }
})();
