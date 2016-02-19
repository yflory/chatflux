/* globals window, WebSocket */
require(['./bower_components/jquery/dist/jquery.js'], function () {
    var $ = window.jQuery;
/*
var webChannel, onJoining, onMessage
function create () {
  webChannel = nf.create(onJoining, onMessage)
  webChannel.openForJoining()
  .then(function (data) {
    webChannel.onJoining = onJoining
    webChannel.onmessage = onMessage
    document.getElementById("key-create").appendChild(document.createTextNode(data.key))
    document.getElementById("my-id").innerHTML = webChannel.myID
  })
}

function join () {
  var key = document.getElementById("key-join").value
  nf.join(key)
    .then(function (wc) {
      webChannel = wc
      webChannel.onJoining = onJoining
      webChannel.onmessage = onMessage
      webChannel.channels.forEach(function(value) {
        onJoining(value.peerID)
      })
      document.getElementById("my-id").innerHTML = webChannel.myID
    })
}

function sendEnter (event) {
  if (event.keyCode == 13) {
    send()
  }
}

function send () {
  var msg = document.getElementById("msg").value
  webChannel.send(msg)
  onMessage(webChannel.myID, msg)
  document.getElementById("msg").value = ""
}

onJoining = function (id) {
  var ol = document.getElementById("members")
  var li = document.createElement("li")
  li.appendChild(document.createTextNode(id))
  ol.appendChild(li)
}

    var onMessage = function (id, msg) {
        var chat = document.getElementById("chat")
        var msgTag = document.createElement("tr")
        var idTD = document.createElement("td")
        idTD.appendChild(document.createTextNode(id))
        var msgTD = document.createElement("td")
        msgTD.appendChild(document.createTextNode(msg))
        msgTag.appendChild(idTD)
        msgTag.appendChild(msgTD)
        chat.appendChild(msgTag)
        chat.scrollTop = chat.scrollHeight
    }
*/
    var connect = function (websocketURL) {
        var sock = {
            ws: new WebSocket(websocketURL),
            seq: 1
        };
        sock.ws.onopen = function () {
            if (window.location.hash) {
                sock.ws.send(JSON.stringify([sock.seq++, 'JOIN', window.location.hash]));
            } else {
                sock.ws.send(JSON.stringify([sock.seq++, 'JOIN']));
            }
        };
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
                    window.location.hash = msg[3];
                }
                console.log('joined');
            }
            if (msg[2] === 'MSG') {
                console.log("MSG " + JSON.stringify(msg));
            }
            if (msg[2] === 'LEAVE') {
                console.log("LEAVE " + JSON.stringify(msg));
            }
        };
    };

    var message = function (server, msg, cb) {
        cb("Not connected to server");
    };

    var main = function () {
        var $backscroll = $('#chatflux-backscroll');
        var $entry = $('#chatflux-entry');
        var server = connect('ws://localhost:9000');

        $entry.on('keydown', function (evt) {
            if (evt.keyCode !== 13) { return; }
            message(server, $entry.val(), function (err) {
                if (err) {
                    $backscroll.val(function (i, val) { return val + '\n' + 'ERROR: ' + err; });
                    return;
                }
                $entry.val('');
            });
        });
    };
    main();
    //console.log(jQuery);
});
