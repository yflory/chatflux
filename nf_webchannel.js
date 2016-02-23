define(function () {

    var send = function(connector, channelId, message) {
        return new Promise(function(resolve, reject) {
            connector.send(channelId, message).then(function() {
                resolve();
            }, function(error) {
                reject(error);
            });
        });

    }

    // Leave the session
    var leave = function(connector) {
        return new Promise(function(resolve, reject) {
            try {
                connector.disconnect();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    var create = function(name, connect, facade) {
        return {
            onMessage: function(peer, channel, msg) { return facade.onMessage(peer, channel, msg); },
            onLeaving: function(peer, channel) { return facade.onLeaving(peer, channel); },
            onJoining: function(peer, channel) { return facade.onJoining(peer, channel); },
            id: name,
            send: function(message) { return send(connect, name, message); },
            leave: function() { return leave(connect); },
            peers: []
        }
    }
    return {
        create: create
    };

});
