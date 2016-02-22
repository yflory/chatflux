define(['nf_facade.js',
        'nf_webchannel.js'], function (Facade, WebChannel) {

    var module = {exports: {}};
    var sock;


    // Connect to the WebSocket server
    var connect = module.exports.connect = function (url) {
        return new Promise(function(resolve, reject) {
            sock = {
                ws: new WebSocket(url),
                seq: 1
            };
            sock.ws.onopen = function () {
                Facade.create(module.exports);
                resolve(Facade);
            };
            sock.ws.onerror = reject;
        });
    }

    var disconnect = module.exports.disconnect = function () {
        sock.ws.close();
        delete this;
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
                var wc = WebChannel;
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
                    if (msg[2] === 'JOIN') {
                        if (msg[1] === sock.uid) {
                            chanName = window.location.hash = msg[3];
                            wc.create(chanName, module.exports);
                            resolve(wc);
                        }
                        if(wc && typeof wc.onJoining !== "undefined") { wc.onJoining(msg); }
                        console.log('joined');
                    }
                    if (msg[2] === 'MSG') {
                        console.log("MSG " + JSON.stringify(msg));
                        if(wc && typeof wc.onMessage !== "undefined") { wc.onMessage(msg); }
                    }
                    if (msg[2] === 'LEAVE') {
                        console.log("LEAVE " + JSON.stringify(msg));
                        if(wc && typeof wc.onLeaving !== "undefined") { wc.onLeaving(msg); }
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