/*globals window document io _ prompt MotionController MouseController */
(function(){
		
	function randomColor() {
		return [ Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256) ].join(', ');
	}
	
	function Client(host) {
		
		// The board
		this._board = document.createElement('div');
		this._board.className = 'the-board';
		this._board.style.width = this.width + 'px';
		this._board.style.height = this.height + 'px';
		document.body.appendChild(this._board);
		
		// Delegate the Transition End event, only on webkit
		//this._board.addEventListener('webkitTransitionEnd', _.bind(this.transitionEnd, this), false);
		
		
		// List
		this._list = document.createElement('ul');
		this._board.appendChild(this._list);
		
		// Create a new socket instance
		this._socket = new io.Socket(host);
		this._socket.on('connect', _.bind(this.connectHandler, this));
		
		// Connect to server
		this._socket.connect();
	}
	
	
	Client.prototype = {
		_socket: null,
		_board: null,
		player: {
			top: 0,
			left: 0
		},
		width: 600,
		height: 600,
		maxLeft: 590,
		maxTop: 590,
		balls: {},
		
		initPlayer: function() {
			this.player.id = this._socket.transport.sessionid;
			//this.player.name = prompt('What\'s your name?').toLowerCase() || '?';
			this.player.name = window.navigator.userAgent.split(/\s/).pop();
			this.player.color = randomColor();
			
			this.create(this.player);
		},
		
		initController: function() {
			if (window.hasOwnProperty('ondevicemotion')) {
				this.controller = new MotionController(_.bind(this.setPosition, this));
			} else {
				this.controller = new MouseController(_.bind(this.setPosition, this));
			}
		},
		
		setPosition: function(left, top) {
			
			if (left > this.maxLeft) {
				this.controller.left = left = this.maxLeft;
			} else if (left < 0) {
				this.controller.left = left = 0;
			}
			if (top > this.maxTop) {
				this.controller.top = top = this.maxTop;
			} else if (top < 0) {
				this.controller.top = top = 0;
			}
			
			if (this.player.left !== left || this.player.top !== top) {
				this.player.left = left;
				this.player.top = top;
				this.move(this.player);
				this.send('move');
			}
		},
		
		send: function(type) {
			this._socket.send({
				type: type,
				data: this.player
			});
		},
		
		create: function(player) {
			var ball = document.createElement('span'),
				label = document.createElement('li');
			
			ball.style.backgroundColor = 'rgb(' + player.color + ')';
			
			label.appendChild(ball.cloneNode(true));
			label.appendChild(document.createTextNode(player.name));
			
			ball.style.left = player.left + 'px';
			ball.style.top = player.top + 'px';
			
			this.balls[player.id] = ball;
			
			this._board.appendChild(ball);
			this._list.appendChild(label);
		},
		move: function(player) {
			var ball = this.balls[player.id];
			if (ball) {
				ball.style.left = player.left + 'px';
				ball.style.top = player.top + 'px';
			}
		},
		kill: function(player) {
			var ball = this.balls[player.id],
				notifier,
				oldCallback;
			
			if (ball) {
				
				// This player got him self killed, disable movement
				if (player.id === this.player.id) {
					
					// Move off screen
					ball.style.left = '-1000px';
					ball.style.top = '-1000px';
					
					this.player.left = -1000;
					this.player.top = -1000;
					
					this.send('move');
					
					// Taunt
					notifier = document.createElement('p');
					notifier.innerHTML = 'You are DEAD! Repawn in 10 secs.'
					this._board.appendChild(notifier);
					
					// Disable movement
					oldCallback = this.controller.callback;
					this.controller.callback = function(){};
					
					setTimeout(_.bind(function(){
						this._board.removeChild(notifier);
						this.controller.callback = oldCallback;
					}, this), 10000);
				} else {
					ball.className = 'killed';
					ball.style.left = '-1000px';
					ball.style.top = '-1000px';
					setTimeout(_.bind(function(){
						this.transitionEnd({
							target: ball
						});
					}, this), 200);
				}
			}
		},
		remove: function(player) {
			
			var	ball = this.balls[player.id],
				i,
				labels,
				label;
			
			if (ball) {
				i = _.indexOf(_.keys(this.balls), player.id);
				labels = this._list.getElementsByTagName('li');
				label = labels[i];
				this._list.removeChild(label);
				this._board.removeChild(ball);
				delete this.balls[player.id];
			}
		},
		
		transitionEnd: function(e) {
			var ball = e.target;
			ball.className = '';
		},
		
		connectHandler: function() {
			
			this.initPlayer();
			
			// Bind event handlers
			this._socket.on('message', _.bind(this.messageHandler, this));
			this._socket.on('message:setup', _.bind(this.setupHandler, this));
			this._socket.on('message:join', _.bind(this.create, this));
			this._socket.on('message:move', _.bind(this.move, this));
			this._socket.on('message:kill', _.bind(this.kill, this));
			this._socket.on('message:exit', _.bind(this.remove, this));
			
			// Send the join message
			this.send('join');
			 
			this.initController();
		},
		
		messageHandler: function(msg) {
			if (msg && msg.type) {
				// Use the socket instance to emit new events
				this._socket.emit('message:' + msg.type.toLowerCase(), [ msg.data ]); 
			}
		},
		
		setupHandler: function(players) {
			players = players || [];	
			_.each(players, _.bind(function(player){
				this.create(player);
			}, this));
		}
	};
	
	// Expose Client
	window.Client = Client;
}());