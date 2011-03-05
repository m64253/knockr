(function(){
	var player = {
			id: '-',
			top: 0,
			left: 0
		},
		multiplier = 3,
		balls = {},
		topMax = 500,
		leftMax = 500,
		prevTop = local.top,
		prevLeft = local.left,
		i = 0,
		color = {
			i: '#3399ff',
			c: '#999999',
			ff: 'red'
		},
		KEY_UP = 38,
		KEY_DOWN = 40,
		KEY_LEFT = 37,
		KEY_RIGHT = 39,
		socket = new io.Socket(window.location.hostname);

	function uniqueColor(colors) {
		colors = colors || _.map(players, function(id, player){ return player.color; });
		
		var color = '#' + _.times(3, function(){
				return Math.floor(Math.random() * 256).toString(16);
			}),
			i = _.indexOf(colors, color);
		
		if (i !== -1) {
			return uniqueColor(colors);
		}
		
		return color;
	}
	
	function updatePosition(left, top) {
		if (left > leftMax) {
			left = leftMax;
		} else if (left < 0) {
			left = 0;
		}
		if (top > topMax) {
			top = topMax;
		} else if (top < 0) {
			top = 0;
		}
		
		player.left = left;
		player.top = top;
	}
	
	function initalize() {
		
		player.name = prompt('What\'s your name?').toLowerCase();
		player.color = uniqueColor();
		
		createBall(player);
		
		socket.connect();
		
		socket.on('connect', function(){
			socket.send({
				type: 'join',
				data: player
			});
			
			if (window.hasOwnProperty('ondevicemotion')) {
				new MotionController(updatePosition);
			} else {
				new MouseController(updatePosition);
			}
		});
	}
		
	function limitPos() {
		
	}
	function onDeviceMotion(e) {
		local.top += e.accelerationIncludingGravity.x * multiplier;
		local.left += e.accelerationIncludingGravity.y * multiplier;
		limitPos();
	}
	function motionController() {
		window.addEventListener('devicemotion', onDeviceMotion, false);
		setTimeout(motionTracker, 0);
	}
	
	function onKeyDown(e) {
		var keyCode = e.keyCode;
		
		if (keyCode === KEY_UP) {
			local.top = local.top - multiplier;
		} else if (keyCode === KEY_DOWN) {
			local.top = local.top + multiplier;
		} else if (keyCode === KEY_LEFT) {
			local.left = local.left - multiplier;
		} else if (keyCode === KEY_RIGHT) {
			local.left = local.left + multiplier;
		}
		limitPos();
	}
	function onMouseMove(e) {
		local.top = e.clientY;
		local.left = e.clientX;
		limitPos();
	}
	function classicController() {
		window.addEventListener('keydown', onKeyDown, false);
		window.addEventListener('mousemove', onMouseMove, false);
		setTimeout(motionTracker, 0);
	}

	function onInit(data) {
		data = data || [];	
		var	len = data.length, i;
		for (i=0; i < len; i++) {
			createBall(data[i]);
		}
	}

	function createBall(data) {
		var ball = document.createElement('span')
		ball.style.backgroundColor = data.color;
		ball.style.top = data.top + 'px';
		ball.style.left = data.left + 'px';
		document.body.appendChild(ball);
		balls[data.id] = ball;
	}

	function moveBall(data) {
		var ball = balls[data.id];
		if (ball) {
			ball.style.top = data.top + 'px';
			ball.style.left = data.left + 'px';
		}
	}

	function killBall(data) {
		var ball = balls[data.id];
	}

	function removeBall(data) {
		var ball = balls[data.id];

		ball.parentNode.removeChild(ball);

		delete balls[data.id];
	}

	socket.on('message', function(msg){
		if (msg && msg.type) {
			socket.emit('type:' + msg.type.toLowerCase(), [ msg.data ]); 
		}
	});
	socket.on('disconnect', function(data){
		console.log('disconnect', data);
	});

	socket.on('type:init', onInit);
	socket.on('type:join', createBall);
	socket.on('type:move', moveBall);
	socket.on('type:kill', killBall);
	socket.on('type:exit', removeBall);
	
	initalize();
}());

console.log(window.ondevicemotion);
console.log(window.hasOwnProperty('ondevicemotion'));