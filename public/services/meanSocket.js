'use strict';

var baseUrl = 'http://' + location.hostname + ':89/';

angular.module('mean.mean-socket').factory('MeanSocket', ['$rootScope', function($rootScope) {
    var socket = io.connect(baseUrl);
    var ws = {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                console.log('event:', eventName);
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
    return ws;
}]);
