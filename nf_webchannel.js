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

    var create = function(name, connect) {
        var id = name;
        var connector = connect;
        var peers = [];
        return {
            send: function(message) { return send(connector, id, message); },
            leave: function() { return leave(connector); },
            peers: peers,
            id: id
        }
    }
    return {
        create: create
    };

});