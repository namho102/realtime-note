require('dotenv').load();
var os = require('os');
var path = require('path');
var AccessToken = require('twilio').AccessToken;
var ConversationsGrant = AccessToken.ConversationsGrant;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose = require('mongoose');
mongoose.connect('mongodb://heroku_pnc1crsd:i3rtrdok3604bn79t7uimr9hn6@ds049744.mongolab.com:49744/heroku_pnc1crsd');

var Code = mongoose.model('Code', { content: String });

app.set('port', (process.env.PORT || 8000));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

var ID_LENGTH = 8;

var generateId = function() {
  var rtn = '';
  for (var i = 0; i < ID_LENGTH; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

app.get('/', function(req, res) {
  res.redirect('/' + generateId())
});

app.get('/:id', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/token/:identity', function(request, response) {
  // console.log(request.params)
    var identity = request.params.identity;

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    var token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET
    );

    // Assign the generated identity to the token
    token.identity = identity;

    //grant the access token Twilio Video capabilities
    var grant = new ConversationsGrant();
    grant.configurationProfileSid = process.env.TWILIO_CONFIGURATION_SID;
    token.addGrant(grant);

    // Serialize the token to a JWT string and include it in a JSON response
    response.send({
        identity: identity,
        token: token.toJwt()
    });
});

http.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

io.on('connection', function(socket) {
	console.log('a user connected');

	Code.findOne(function(err, code) {
		socket.emit('update', code)
	});

	// socket.emit('update', 'new')
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});

	socket.on('content', function(data) {
		// console.log(data);
		socket.broadcast.emit('update', data)
		Code.findOne(function(err, code) {
			code.content = data.content;
			code.save();
		});

	})

	// convenience function to log server messages on the client
	function log() {
		var array = ['Message from server:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(message) {
		log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function(room) {

		log('Received request to create or join room ' + room);

		// var numClients = io.sockets.sockets.length;
		var numClients = Object.keys(io.sockets.sockets).length;

		log('Room ' + room + ' now has ' + numClients + ' client(s)');

		// console.log(io.sockets)

		if (numClients === 1) {
			// socket.join(room);
			// log('Client ID ' + socket.id + ' created room ' + room);
			// socket.emit('created', room, socket.id);
      socket.emit('created', room);

		} else if (numClients === 2) {
			// log('Client ID ' + socket.id + ' joined room ' + room);
			// io.sockets.in(room).emit('join', room);
			// socket.join(room);

      socket.emit('join', room);

		} else { // max two clients
			socket.emit('full', room);
		}
	});



});
