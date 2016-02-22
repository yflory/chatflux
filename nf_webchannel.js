define(function () {


    var module = {exports: {}};

    var connector;
    var channelId;

    var send = module.exports.send = function(message) {
        return new Promise(function(resolve, reject) {
            connector.send(channelId, message).then(function() {
                resolve();
            }, function(error) {
                reject(error);
            });
        });
        
    }

    // Leave the session
    var leave = module.exports.leave = function() {
        return new Promise(function(resolve, reject) {
            try {
                connector.disconnect();
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    var create = module.exports.create = function(name, connect) {
        channelId = name;
        connector = connect;
    }
    return module.exports;

});