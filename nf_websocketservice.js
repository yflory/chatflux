define(['/bower_components/reconnectingWebsocket/reconnecting-websocket.js',
        'nf_facade.js',
        'nf_webchannel.js',
        'nf_peer.js'], function (ReconnectingWebSocket, Facade, WebChannel, Peer) {

    var module = {exports: {}};
    var sock;

    // Connect to the WebSocket server
    var connect = module.exports.connect = function (url) {
        return new Promise(function(resolve, reject) {
            sock = {
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

    var findPeerById = function(peerId, peers) {
        var index;
        for(var i=0; i<peers.length; i++) {
            if(peers[i].name === peerId) {
                index = i;
                break;
            }
        }
        var peer = peers[i] || Peer.create("Unknown", wc, module.exports); 
        return [peer, index];
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
                    if (msg[2] === 'JOIN') {
                        var peer = Peer.create(msg[1], wc, module.exports);
                        wc.peers.push(peer);
                        if (msg[1] === sock.uid) {
                            chanName = window.location.hash = msg[3];
                            wc.id = chanName;
                            resolve(wc);
                            console.log('joined');
                        }
                        else {
                            if(wc && typeof wc.onJoining !== "undefined") { wc.onJoining(peer, wc); }
                        }
                    }
                    if (msg[2] === 'MSG') {
                        var peer = findPeerById(msg[1], wc.peers);
                        console.log("MSG " + JSON.stringify(msg));
                        if(wc && typeof wc.onMessage !== "undefined") { wc.onMessage(peer[0], wc, msg); }
                    }
                    if (msg[2] === 'LEAVE') {
                        var peer = findPeerById(msg[1], wc.peers);
                        if(peer[1]) {
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