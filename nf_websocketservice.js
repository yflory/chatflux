define(['/bower_components/reconnectingWebsocket/reconnecting-websocket.js',
        'nf_facade.js',
        'nf_webchannel.js',
        'nf_peer.js'], function (ReconnectingWebSocket, Facade, WebChannel, Peer) {

    var module = {exports: {}};
    var channels = [];
    var sock;

    // Connect to the WebSocket server
    var connect = module.exports.connect = function (url) {
        return new Promise(function(resolve, reject) {
            var facade;
            
            module.exports._sock = sock = {
                onMessage: [],
                ws: new ReconnectingWebSocket(url),
                seq: 1
            };
            sock.ws.onopen = function () {
                facade = Facade.create(module.exports);
                resolve(facade);
            };
            sock.ws.onerror = reject;

            // Add the ability to trigger several methods when a message is received
            var mkHandler = function (name) {
                return function (evt) {
                    for (var i = 0; i < sock[name].length; i++) {
                        if (sock[name][i](evt) === false) {
                            console.log(name +"Handler");
                            return;
                        }
                    }
                };
            };
            sock.ws.onmessage = mkHandler('onMessage');

            sock.onMessage.push (function(evt) {
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
                if (msg[2] === 'MSG') {
                    console.log("MSG " + JSON.stringify(msg));
                }
                // We have received a new direct message from another user
                if (msg[2] === 'MSG' && msg[3] === sock.uid) {
                    // Find the peer exists in one of our channels or create a new one
                    var peer = findPeerInChannels(msg[1]);
                    facade.onPeerMessage(peer, msg);
                }
            });
        });
    }

    var disconnect = module.exports.disconnect = function () {
        sock.ws.close();
        delete this;
    }
    
    // Find a peer in all channels from its id
    var findPeerInChannels = function(peerId) {
        var peer;
        for(var i=0; i<channels.length; i++) {
            var wc = channels[i];
            var tempRes = findPeerById(peerId, wc);
            if(tempRes[1] >= 0) {
                peer = tempRes[0];
                break;
            }
        }
        return peer || Peer.create(peerId, null, module.exports);
    }

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
        var peer = peers[i] || Peer.create(peerId, wc, module.exports); 
        return [peer, index];
    }

    var addPeerToChannel = function(peer, channel) {
        if(channel && channel.peers.indexOf(peer) === -1) {
            channel.peers.push(peer);
        }
    }

    // Create a WebChannel
    var join = module.exports.join = function (channel, facade) {
        return new Promise(function(resolve, reject) {
            try {
                if (channel) {
                    sock.ws.send(JSON.stringify([sock.seq++, 'JOIN', channel]));
                } else {
                    sock.ws.send(JSON.stringify([sock.seq++, 'JOIN']));
                }
                // Create the channel and add the history keeper
                
                var wc = WebChannel.create(channel, module.exports, facade);
                var historyKeeperPeer = Peer.create("_HISTORY_KEEPER_", wc, module.exports, 1000);
                addPeerToChannel(historyKeeperPeer, wc);
                

                sock.onMessage.push(function(evt) {
                    var msg = JSON.parse(evt.data);
                    // Someone has joined the channel
                    if (msg[2] === 'JOIN' && (wc.id == null || wc.id === msg[3])) {
                        if(!wc.id) { // New unnamed channel : get its name from the first "JOIN" message
                            chanName = window.location.hash = msg[3];
                            wc.id = chanName;
                            channels.push(wc);
                        }

                        // Register him in the list of peers in the channel
                        var peer = Peer.create(msg[1], wc, module.exports);
                        addPeerToChannel(peer, wc);

                        if (msg[1] === sock.uid) { // If the user catches himself registering, he is synchronized with the server
                            resolve(wc);
                            console.log('joined');
                        }
                        else { // Trigger onJoining() when another user is joining the channel
                            wc.onJoining(peer, wc);
                        }
                    }
                    // We have received a new message in that channel
                    if (msg[2] === 'MSG' && msg[3] === wc.id) {
                        // Find the peer who sent the message and display it
                        var peer = findPeerById(msg[1], wc);
                        wc.onMessage(peer[0], wc, msg);
                    }
                    // Someone else has left the channel, remove him from the list of peers
                    if (msg[2] === 'LEAVE' && msg[3] === wc.id) {
                        var peer = findPeerById(msg[1], wc);
                        if(peer[1] >= 0) {
                            wc.peers.splice(peer[1], 1);
                        }
                        wc.onLeaving(peer[0], wc);
                        console.log("LEAVE " + JSON.stringify(msg));
                    }
                });
                
            } catch(e) {
                reject(e);
            }
        });
    }

    // Send a message using the socket
    var send = module.exports.send = function(target, message) {
        return new Promise(function(resolve, reject) {
            try {
                sock.ws.send(JSON.stringify([sock.seq++, 'MSG', target, message]));
                resolve();
            } catch(e) {
                reject(e);
            }
        });
    }

    return module.exports;

});
