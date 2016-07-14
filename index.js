var path = require('path');

var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var r = require('rethinkdb');

r.connect({
	db: 'Messenger'
}).then(function(connection) {

	io.on('connection', function(socket) {
		console.log('a user connected');
		socket.on('disconnect', function() {
			console.log('user disconnected');
		});

		socket.on('content', function(data) {
			// console.log(data);
			r.table("Notes").update({content: data}).run(connection);
			
		})
	});

})
app.set('port', (process.env.PORT || 8000));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


http.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});