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

    var create = function(name, webchannel, connect) {
        var id = name;
        var webchannel = webchannel;
        var connector = connect;
        return {
            send: function(message) { return send(connector, id, message); },
            name: name
        }
    }
    return {
        create: create
    };

});