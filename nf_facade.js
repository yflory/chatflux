define(function () {

    var join = function (connector, channel, facade) {
        return new Promise(function(resolve, reject) {
            connector.join(channel, facade).then(function(wc) {
                resolve(wc);
            }, function(error) {
                reject(error);
            });
        });
    }

    var create = function (connect) {
        return {
            _connector: connect,
            join: function (chan) { return join(connect, chan, this); }
        };
    }

    return {
        create: create
    };

});
