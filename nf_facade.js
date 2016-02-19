define(function () {
    
    var module = {exports: {}};
    
    
    var join = module.exports.join = function (channel, options) {
        var connector = options.connector;
        return new Promise(function(resolve, reject) {
            connector.join(channel, options).then(function(wc) {
                resolve(wc);
            }, function(error) {
                reject(error);
            });
            
        });
    }
    
    return module.exports;
    
});