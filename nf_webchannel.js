define(function () {
    
    return function WebChannel(id, options) {
        var module = {exports: {}};
        var connector = options.connector;
        var channelId = id;
        
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
        
        return module.exports;
    };
    
});