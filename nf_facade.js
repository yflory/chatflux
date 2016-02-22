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
        return {
            onPeerMessage: function () { }, // TODO
            _connector: connect,
            join: function (chan) { return join(connect, chan); }
        };
    }

    return {
        create: create
    };

});
