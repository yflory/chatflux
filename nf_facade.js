define(function () {
    
    var module = {exports: {}};

    var connector;

    var join = module.exports.join = function (channel) {
        return new Promise(function(resolve, reject) {
            connector.join(channel).then(function(wc) {
                resolve(wc);
            }, function(error) {
                reject(error);
            });
            
        });
    }

    var create = module.exports.create = function (connect) {
        connector = connect;
    }

    return module.exports;
    
});