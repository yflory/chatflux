/*
    globals require console
*/
var Express = require('express');
var Http = require('http');
//var Https = require('https');
var Fs = require('fs');
var WebSocketServer = require('ws').Server;
//var ChainPadSrv = require('./ChainPadSrv');

var app = Express();
app.use(Express.static(__dirname + '/'));

app.get("/", function(req, res) { res.sendFile(__dirname + '/index.html'); });

var httpServer = Http.createServer(app);
httpServer.listen(9000, '::', function(){
    console.log('listening on %s', 9000);
});

require('./NetFluxWebsocketServer').run(new WebSocketServer({ server: httpServer }));
