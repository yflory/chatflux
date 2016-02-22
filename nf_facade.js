define(function () {

    var join = function (connector, channel) {
        return new Promise(function(resolve, reject) {
            connector.join(channel).then(function(wc) {
                resolve(wc);
            }, function(error) {
                reject(error);
            });
        });
    }

    var create = function (connect) {
        var connector = connect;
        return {
            join: function (chan) { return join(connector, chan); }
        };
    }

    return {
        create: create
    };

});