define(['/bower_components/reconnectingWebsocket/reconnecting-websocket.js',
        'nf_facade.js',
        'nf_webchannel.js',
        'nf_peer.js'], function (ReconnectingWebSocket, Facade, WebChannel, Peer) {

    var module = {exports: {}};
    var sock;

    // Connect to the WebSocket server
    var connect = module.exports.connect = function (url) {
        return new Promise(function(resolve, reject) {
            module.exports._sock = sock = {
                ws: new ReconnectingWebSocket(url),
                seq: 1
            };
            sock.ws.onopen = function () {
                var facade = Facade.create(module.exports);
                resolve(facade);
            };
            sock.ws.onerror = reject;
        });
    }

    var disconnect = module.exports.disconnect = function () {
        sock.ws.close();
        delete this;
    }

    var findPeerById = function(peerId, peers, wc) {
        var index = -1;
        for(var i=0; i<peers.length; i++) {
            if(peers[i].name === peerId) {
                index = i;
                break;
            }
        }
        var peer = peers[i] || Peer.create('*'+peerId+'*', wc, module.exports); 
        return [peer, index];
    }

    var addPeerToChannel = function(peer, channel) {
        if(channel && channel.peers.indexOf(peer) === -1) {
            channel.peers.push(peer);
        }
    }

    // Create a WebChannel
    var join = module.exports.join = function (channel, options) {
        return new Promise(function(resolve, reject) {
            try {
                if (channel) {
                    sock.ws.send(JSON.stringify([sock.seq++, 'JOIN', channel]));
                } else {
                    sock.ws.send(JSON.stringify([sock.seq++, 'JOIN']));
                }
                var wc = WebChannel.create(channel, module.exports);
                sock.ws.onmessage = function(evt) {
                    var msg = JSON.parse(evt.data);

                    if (msg[0] !== 0) {
                        console.log(JSON.stringify(msg));
                        return;
                    }
                    if (msg[1] === 'IDENT') {
                        sock.uid = msg[2];
                        return;
                    }
                    if (msg[1] === 'PING') {
                        msg[1] = 'PONG';
                        sock.ws.send(JSON.stringify(msg));
                        return;
                    }
                    // Someone has joined the channel
                    if (msg[2] === 'JOIN') {
                        // Register him in the list of peers in the channel
                        var peer = Peer.create(msg[1], wc, module.exports);
                        addPeerToChannel(peer, wc);
                        // If the user catches himself registering, it means he knows all other peers
                        // and he is synchronized with the server
                        if (msg[1] === sock.uid) {
                            chanName = window.location.hash = msg[3];
                            wc.id = chanName;
                            resolve(wc);
                            console.log('joined');
                        }
                        // Trigger onJoining() when another user is joining the channel
                        else {
                            if(wc && typeof wc.onJoining !== "undefined") { wc.onJoining(peer, wc); }
                        }
                    }
                    // We have received a new message from another user
                    if (msg[2] === 'MSG') {
                        // If it comes from the history keeper (we've just entered the channel),
                        // then get the original message
                        if(msg[1] === '_HISTORY_KEEPER_') {
                            msg = JSON.parse(msg[4]);
                        }
                        // Find the peer who sent the message or create a fake one if he doesn't exist anymore
                        var peer = findPeerById(msg[1], wc.peers, wc);
                        console.log("MSG " + JSON.stringify(msg));
                        // Trigger onMessage() in the channel
                        if(wc && typeof wc.onMessage !== "undefined") { wc.onMessage(peer[0], wc, msg); }
                    }
                    // If someone else has left the channel, remove him from the list of peers
                    if (msg[2] === 'LEAVE') {
                        var peer = findPeerById(msg[1], wc.peers, wc);
                        if(peer[1] >= 0) {
                            wc.peers.splice(peer[1], 1);
                        }
                        console.log("LEAVE " + JSON.stringify(msg));
                        if(wc && typeof wc.onLeaving !== "undefined") { wc.onLeaving(peer[0], wc); }
                    }
                }
            } catch(e) {
                reject(e);
            }
        });
    }

    // Send a message using the socket
    var send = module.exports.send = function(channel, message) {
        return new Promise(function(resolve, reject) {
            try {
                sock.ws.send(JSON.stringify([sock.seq++, 'MSG', channel, message]));
                resolve();
            } catch(e) {
                reject(e);
            }
        });
    }

    return module.exports;

});
