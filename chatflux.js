/* globals window, WebSocket */
require(['nf_websocketservice.js',
        './bower_components/jquery/dist/jquery.js'], function (Netflux) {
    var $ = window.jQuery;

    var $backscroll
    var webchannel;

    // TODO: Change this to use the NetFlux API
    // This is a temporary hack which talks directly to the server.
    var connect = function (url) {
        var channel = window.location.hash.substring(1) || null;
        
        // Connect to the WebSocket server
        Netflux.connect(url).then(function(facade) {
            // Join a WebChannel
            facade.join(channel).then(function(wc) {

                webchannel = wc;
                wc.onMessage = onMessage; // On receiving message
                wc.onJoining = onJoining;
                wc.onLeaving = onLeaving;

            }, function(error) {
                console.error(error);
            });
            
        }, function(error) {
            console.error(error);
        });
    };

    var logMsg = function (s) { $backscroll.val(function (i, v) { return v + '\n' + s; }); };

    var onLeaving = function(peer, channel) {
        logMsg('* ' + peer.name + ' has left ' + channel.id);
    }

    var onJoining = function(peer, channel) {
        logMsg('* ' + peer.name + ' has joined');
    }

    var onMessage = function (peer, channel, msg) {
        logMsg('<' + peer.name + '> ' + msg[4]);
    };

    var main = function () {
        $backscroll = $('#chatflux-backscroll');
        var $entry = $('#chatflux-entry');
        var server = connect((''+window.location.href).replace('http','ws').replace(/#.*$/, ''));
        var logMsg = function (s) {
            $backscroll.val(function (i, v) { return v + '\n' + s; });
            $backscroll.scrollTop($backscroll[0].scrollHeight);
        };

        $entry.on('keydown', function (evt) {
            if (evt.keyCode !== 13) { return; }
            send($entry.val(), function (err) {
                if (err) {
                    logMsg('ERROR: ' + err);
                    return;
                }
                $entry.val('');
            });
        });
        
        var send = function (msg, cb) {
            if(typeof webchannel !== "undefined") {
                webchannel.send(msg);
                cb();
            }
            else {
                cb("Not connected to server");
            }
        };
    };
    main();
});
