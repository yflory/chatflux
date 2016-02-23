define(function () {

    var send = function(connector, peerId, message) {
        return new Promise(function(resolve, reject) {
            connector.send(peerId, message).then(function() {
                resolve();
            }, function(error) {
                reject(error);
            });
        });
    }

    var create = function(name, webchannel, connect, linkQuality) {
        return {
            send: function(message) { return send(connect, name, message); },
            name: name,
            webchannel: webchannel,
            linkQuality: (linkQuality || 0)
        }
    }
    return {
        create: create
    };

});