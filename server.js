/*globals require console __dirname */
var express = require('express'),  
	io = require('socket.io'),
	app = express.createServer(),
	socket = io.listen(app),
	players = {};

app.get('/', function(req, res){ 
	res.render('index.jade');
});

app.set('view engine', 'jade');

app.use(express.staticProvider(__dirname + '/public'));

/**
 * Adds a new player
 * @param {String|Number} id The id of the client exiting
 * @param {Object} data Player details
 */
function onJoin(id, data) {
	console.log('join: ' + id);
	
	data = data || {};
	
	var client = socket.clients[id],
		player = {
			id: id,
			name: data.name || 'default',
			color: data.color || 'lime',
			top: data.top || 0,
			left: data.left || 0
		};
	
	if (client) {
		// Send the setup event to the client and tell them about the other players
		client.send({
			type: 'setup',
			data: players
		});

		// Add player
		players[id] = player;

		// Broadcast to other roomies
		client.broadcast({
			type: 'join',
			data: player
		});
	}
}

/**
 * Removes to client from clients and broadcasts a EXIT message
 * @param {String|Number} id The id of the client exiting
 */
function onExit(id) {
	
	var player = players[id];
	
	if (player) {
		socket.broadcast({
			type: 'exit',
			data: player
		});
	}
	
	delete players[id];
}


/**
 * Checks if the moved player has collided with another player and if so broadcast a kill event for that player
 * @param {Object} movedPlayer The player who has moved
 */
function collision(movedPlayer) {
	
	var id = movedPlayer.id,
		left = movedPlayer.left,
		top = movedPlayer.top;
	
	Object.keys(players).forEach(function(i){
		if (i !== id) {
			player = players[i];
			leftMin = player.left;
			leftMax = leftMin + 10;
			topMin = player.top;
			topMax = topMin + 10;
			if (leftMin <= left && leftMax >= left && topMin <= top && topMax >= top) {
				socket.broadcast({
					type: 'kill',
					data: player
				});
			}
		}
	});
}


/**
 * Adds a new player
 * @param {String|Number} id The id of the client exiting
 * @param {Object} data Player details
 */
function onMove(id, data) {
	var client = socket.clients[id],
		player = players[id];
	
	if (client && player && data.top && data.top) {
		player.top = data.top;
		player.left = data.left;
		
		// Broadcast to other roomies
		client.broadcast({
			type: 'move',
			data: player
		});
		
		collision(player);
	}
}

/**
 * Listen for messages
 */
socket.on('clientMessage', function(message, client){
	
	message = message || {};
	
	var id = client.sessionId,
		type = 'unknown';
	
	if (message.type) {
		type = message.type.toLowerCase();
	}
	
	socket.emit('message:' + type, id, message.data);
});

socket.on('clientDisconnect', function(client){
	var id = client.sessionId;
	socket.emit('message:exit', id);
});

socket.on('message:join', onJoin);
socket.on('message:exit', onExit);
socket.on('message:move', onMove);

app.listen(3000);