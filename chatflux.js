/* globals window, WebSocket */
require(['./bower_components/jquery/dist/jquery.js'], function () {
    var $ = window.jQuery;

    // TODO: Change this to use the NetFlux API
    // This is a temporary hack which talks directly to the server.
    var connect = function (websocketURL) {
        var sock = {
            ws: new WebSocket(websocketURL)
        };
        var seq = 1;
        sock.ws.onopen = function () {
            if (window.location.hash) {
                sock.ws.send(JSON.stringify([seq++, 'JOIN', window.location.hash.substr(1)]));
            } else {
                sock.ws.send(JSON.stringify([seq++, 'JOIN']));
            }
        };
        var msgHandlers = [];
        var leaveHandlers = [];
        var joinHandlers = [];
        var chanName;
        sock.ws.onmessage = function (evt) {
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
                }
                joinHandlers.forEach(function (mh) { mh(msg); });
                console.log('joined');
            }
            if (msg[2] === 'MSG') {
                console.log("MSG " + JSON.stringify(msg));
                msgHandlers.forEach(function (mh) { mh(msg); });
            }
            if (msg[2] === 'LEAVE') {
                console.log("LEAVE " + JSON.stringify(msg));
                leaveHandlers.forEach(function (mh) { mh(msg); });
            }
        };
        return {
            sock: sock,
            msg: function (m, cb) {
                if (chanName) {
                    sock.ws.send(JSON.stringify([seq++, 'MSG', chanName, m]));
                    cb();
                } else {
                    cb('not connected to server');
                }
            },
            onMsg: function (handler) { msgHandlers.push(handler); },
            onLeave: function (handler) { leaveHandlers.push(handler); },
            onJoin: function (handler) { joinHandlers.push(handler); }
        };
    };

    var main = function () {
        var $backscroll = $('#chatflux-backscroll');
        var $entry = $('#chatflux-entry');
        var server = connect((''+window.location.href).replace('http','ws').replace(/#.*$/, ''));
        var logMsg = function (s) {
            $backscroll.val(function (i, v) { return v + '\n' + s; });
            $backscroll.scrollTop($backscroll[0].scrollHeight);
        };

        $entry.on('keydown', function (evt) {
            if (evt.keyCode !== 13) { return; }
            server.msg($entry.val(), function (err) {
                if (err) {
                    logMsg('ERROR: ' + err);
                    return;
                }
                $entry.val('');
            });
        });
        server.onMsg(function (msg) { logMsg('<' + msg[1] + '> ' + msg[4]); });
        server.onLeave(function (msg) { logMsg('* ' + msg[1] + ' has left ' + msg[4]); });
        server.onJoin(function (msg) { logMsg('* ' + msg[1] + ' has joined'); });
    };
    main();
});
