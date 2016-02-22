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
        var channelId = name;
        var connector = connect;
        return {
            send: function(message) { return send(connector, channelId, message); },
            leave: function() { return leave(connector); }
        }
    }
    return {
        create: create
    };

});