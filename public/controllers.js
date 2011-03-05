/*globals window _ */
(function(){
	
	function addEventListener(event, fn) {
		if (window.addEventListener) {
			window.addEventListener(event, fn, false);
		} else if (window.attachEvent) {
			window.attachEvent('on' + event, fn);
		} else {
			window['on' + event] = fn;
		}
	}
	
	function Controller(callback) {
		this.callback = callback;
		setTimeout(_.bind(this._tracker, this), 0);
	}
	Controller.prototype = {
		eventName: null,
		left: 0,
		top: 0,
		_prevLeft: 0,
		_prevTop: 0,
		_tracker: function() {
			if (this.left !== this._prevLeft || this.top !== this._prevTop) {
				this._prevLeft = this.left;
				this._prevTop = this.top;
				this.callback(this.left, this.top);
			}
			setTimeout(_.bind(this._tracker, this), 0);
		}
	};
	
	function MotionController(callback) {
		addEventListener('devicemotion', _.bind(this._onDeviceMotion, this));
		this.multiplier = 3;
		Controller.call(this, callback);
	}
	MotionController.prototype = new Controller();
	MotionController.prototype._onDeviceMotion = function(e) {
		this.left += e.accelerationIncludingGravity.y * this.multiplier;
		this.top += e.accelerationIncludingGravity.x * this.multiplier;
	};
	
	
	function MouseController(callback) {
		addEventListener('mousemove', _.bind(this._onMouseMove, this), false);
		Controller.call(this, callback);
	}
	MouseController.prototype = new Controller();
	MouseController.prototype._onMouseMove = function(e) {
		this.top = e.clientY;
		this.left = e.clientX;
	};
	
	
	function KeyController(callback) {
		addEventListener('keypress', _.bind(this._onKeyPress, this));
		this.multiplier = 3;
		Controller.call(this, callback);
	}
	KeyController.prototype = new Controller();
	KeyController.prototype._onKeyPress = function(e) {
		var keyCode = e.keyCode;
		// UP
		if (keyCode === 38) {
			this.top = this.top - this.multiplier;
		// DOWN
		} else if (keyCode === 40) {
			this.top = this.top + this.multiplier;
		// LEFT
		} else if (keyCode === 37) {
			this.left = this.left - this.multiplier;
		// RIGHT
		} else if (keyCode === 39) {
			this.left = this.left + this.multiplier;
		}
	};
	
	// Expose controllers
	window.MotionController = MotionController;
	window.MouseController = MouseController;
	window.KeyController = KeyController;
}());