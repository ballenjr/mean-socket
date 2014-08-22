'use strict';

// The Package is past automatically as first parameter
module.exports = function(MeanSocket, app, auth, database, io) {

    var Q = require('q');
    var moment = require('moment');

    var channelWatchList = [];

    function getMessages(channel) {
        var deferred = Q.defer();

        MeanSocket.settings(function(err, settings) {
            require(settings.settings.funcPage)[settings.settings.getAllMessagesFunc](channel, function(cb) {
                deferred.resolve(cb);
            });
        });

        return deferred.promise;
    }

    io.on('connection', function(socket) {
        console.log('Chat - user connected');

        socket.on('disconnect', function() {
            console.log('Chat - user disconnected');
        });

        socket.on('user:joined', function(user) {
            console.log(user.name + ' joined the room');
            var message = user.name + ' joined the room';
            io.emit('user:joined', {
                message: message,
                time: moment(),
                expires: moment().add(10)
            });
        });

        socket.on('message:send', function(message) {
            console.log('message: ' + message);
            console.log(JSON.stringify(message));
            // var messageKey = 'message:' + message.name;
            // console.log('Storing key: ' + messageKey);

            console.log('storing to set: messages:' + message.channel);


            MeanSocket.settings(function(err, settings) {
                require(settings.settings.funcPage)[settings.settings.getMessageFunc](message, function(cb) {
                    io.emit('message:channel:' + message.channel, cb);
                    console.log('emited: ' + cb);
                });
            });
        });

        socket.on('channel:join', function(channelInfo) {
            console.log('Channel joined - ', channelInfo.channel);
            console.log(channelInfo);
            console.log('Added to channels: ', channelInfo.channel);
            console.log('messages:' + channelInfo.channel);

            // socket.emit('messages:channel:' + channelInfo.channel, )

            //Add to watch to remove list.
            // for(var i = 0, j = channelWatchList.length; i < j; i++) {
            //   if()
            // }
            if (channelWatchList.indexOf(channelInfo.channel) === -1) {
                channelWatchList.push(channelInfo.channel);
            }

            io.emit('user:channel:joined:' + channelInfo.channel, {
                message: channelInfo,
            });

            MeanSocket.settings(function(err, settings) {
                require(settings.settings.funcPage)[settings.settings.getAllChannelsFunc](function(cb) {
                    for (var i = 0; i < cb.length; i++) {
                        if (channelWatchList.indexOf(cb[i]) === -1) {
                            channelWatchList.push(cb[i]);
                        }
                    }
                    socket.emit('channels', channelWatchList);
                });
            });

            //Emit back any messages that havent expired yet.
            getMessages(channelInfo.channel).then(function(data) {
                console.log('got messages');
                // console.log(data);
                socket.emit('messages:channel:' + channelInfo.channel, data);
            });
        });

    });
};