var os = require('os');
var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose = require('mongoose');
mongoose.connect('mongodb://heroku_pnc1crsd:i3rtrdok3604bn79t7uimr9hn6@ds049744.mongolab.com:49744/heroku_pnc1crsd');

var Code = mongoose.model('Code', { content: String });

app.set('port', (process.env.PORT || 8000));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

http.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

io.on('connection', function(socket) {
	console.log('a user connected');
	// console.log(r.table("Notes").limit(1).get())
	// r.table("Notes")('content').limit(1).run(connection).then(function(cursor) {
	// 	cursor.next(function(err, row) {
	// 		// console.log(row)
	// 		socket.emit('update', row)
	// 	});
	// })

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
			code.save()
		});

		// r.table("Notes").update({content: data}).run(connection);

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
			socket.join(room);
			log('Client ID ' + socket.id + ' created room ' + room);
			socket.emit('created', room, socket.id);

		} else if (numClients === 2) {
			log('Client ID ' + socket.id + ' joined room ' + room);
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room, socket.id);
			io.sockets.in(room).emit('ready');
		} else { // max two clients
			socket.emit('full', room);
		}
	});

	socket.on('ipaddr', function() {
		var ifaces = os.networkInterfaces();
		for (var dev in ifaces) {
			ifaces[dev].forEach(function(details) {
				if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
					socket.emit('ipaddr', details.address);
				}
			});
		}
	});

	socket.on('bye', function(){
		console.log('received bye');
	});

});
