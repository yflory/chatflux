/* globals window, WebSocket */
require(['nf_websocketservice.js',
        './bower_components/jquery/dist/jquery.js'], function (Netflux) {
    var $ = window.jQuery;

    var $backscroll

    var connect = function (url) {
        var channel = window.location.hash.substring(1) || null;

        return new Promise(function(resolve, reject) {
            // Connect to the WebSocket server
            Netflux.connect(url).then(function(facade) {

                facade.onPeerMessage = onPeerMessage;

                // Join a WebChannel
                facade.join(channel).then(function(wc) {

                    wc.onMessage = onMessage;
                    wc.onJoining = onJoining;
                    wc.onLeaving = onLeaving;

                    // Request the history of this channel from the peer with the best link quality
                    var hc;
                    wc.peers.forEach(function (p) { if (!hc || p.linkQuality > hc.linkQuality) { hc = p; } });
                    hc.send(JSON.stringify(['GET_HISTORY', wc.id]));

                    resolve(wc);

                }, function(error) {
                    reject(error);
                });

            }, function(error) {
                reject(error);
            });
        });
    };

    var logMsg = function (s) {
        $backscroll.val(function (i, v) { return v + '\n' + s; });
        $backscroll.scrollTop($backscroll[0].scrollHeight);
    };

    var onLeaving = function(peer, channel) {
        logMsg('* ' + peer.name + ' has left');
    }

    var onJoining = function(peer, channel) {
        logMsg('* ' + peer.name + ' has joined');
    }

    var onMessage = function (peer, channel, msg) {
        logMsg('<' + peer.name + '> ' + msg[4]);
    };

    var onPeerMessage = function (peer, msg) {
        if(peer.name === '_HISTORY_KEEPER_') {
            var msgHistory = JSON.parse(msg[4]);
            logMsg('*' + msgHistory[1] + '* ' + msgHistory[4]);
        }
        else {
            logMsg('' + peer.name + '>> ' + msg[4]);
        }
    };

    // Find a peer in a channel
    var findPeerById = function(peerId, wc) {
        var index = -1;
        var peers = wc.peers;
        for(var i=0; i<peers.length; i++) {
            if(peers[i].name === peerId) {
                index = i;
                break;
            }
        }
        return peers[i] || null; 
    }

    var send = function (webchannel, msg, cb) {
        if(typeof webchannel !== "undefined") {
            var split = msg.indexOf(" ");
            var peer;
            if (split >= 0) {
                command = msg.substr(0, split);
                if(command === '/msg') {
                    msg = msg.substr(split+1);
                    var splitUser = msg.indexOf(" ");
                    var user = (splitUser >= 0) ? msg.substr(0, splitUser) : null;
                    var peer = findPeerById(user, webchannel);
                    if(peer) {
                        msg = msg.substr(splitUser+1);
                        peer.send(msg);
                        logMsg('' + peer.name + '<< ' + msg);
                    }
                }
            }
            if(!peer) {
                webchannel.send(msg);
            }
            cb();
        }
        else {
            cb("Not connected to server");
        }
    };

    var main = function () {
        $backscroll = $('#chatflux-backscroll');
        var $entry = $('#chatflux-entry');
        connect((''+window.location.href).replace('http','ws').replace(/#.*$/, '')).then(function(wc){
            $entry.on('keydown', function (evt) {
            if (evt.keyCode !== 13) { return; }
                send(wc, $entry.val(), function (err) {
                    if (err) {
                        logMsg('ERROR: ' + err);
                        return;
                    }
                    $entry.val('');
                });
            });
        }, function(err) {
            logMsg('ERROR: ' + err);
            console.error(err);
        });  
    };
    main();
});
