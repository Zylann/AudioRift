"use strict";


function AudioRift(canvasID, audioID) {
	this.color = {
		r: 32,
		g: 255,
		b: 32
	};

	// Get canvas and audio elements
	this.canvas = document.getElementById(canvasID);
	this.audio = document.getElementById(audioID);

	var self = this;
	this.audio.addEventListener("loadeddata", function() {
		console.log("Loaded data");
		self.audio.play();
	}, false);

	this.mediaURL = null;
}
AudioRift.prototype = {

	setMediaURL: function(mediaURL) {
		console.log("Set media to " + mediaURL);
		this.audio.innerHTML =
			"<source src=\"" + mediaURL + ".ogg\" type=\"audio/ogg\"/>" + 
			"<source src=\"" + mediaURL + ".mp3\" type=\"audio/mp3\"/>";
		this.mediaURL = mediaURL;
		this.writeDownloadLinks();

		var parts = mediaURL.split("/");
		document.title = parts[parts.length-1].toUpperCase();
	},

	writeDownloadLink: function(format, label) {
		var link = document.createElement("a");
		link.href = this.mediaURL + "." + format;
		format = format.toUpperCase();
		link.title = label + " [" + format + "]";
		link.innerHTML = label + " [" + format + "]";
		link.target = "blank";
		this.audio.parentNode.appendChild(link);
	},

	writeDownloadLinks: function() {
		var label = "";
		this.writeDownloadLink("ogg", label);
		this.writeDownloadLink("mp3", label);
	},

	reset: function() {
		// TODO implement this some day so we can call start() twice
	},

	start: function() {
		console.log("Start {");
		this.reset();

		// Create audio context
		this.audioContext = new AudioContext();
		// Create graphic context
		this.canvasContext = this.canvas.getContext("2d");

		// Create audio stream node
		this.audioSourceNode = this.audioContext.createMediaElementSource(this.audio);
		// Add gain node
		this.gainNode = this.audioContext.createGain();
		this.audioSourceNode.connect(this.gainNode);
		// Connect to the final audio output
		this.gainNode.connect(this.audioContext.destination);

		// Listen to volume change (especially for Firefox)
		var self = this;
		this.audio.addEventListener("volumechange", function(e) {
			self.gainNode.gain.value = this.volume;
		}, false);

		// Click on canvas to toggle pause
		this.canvas.addEventListener("click", function(e) {
			if(self.audio.paused)
				self.audio.play();
			else
				self.audio.pause();
		}, false);

		// Create analyser
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftsize = 256;
		this.audioSourceNode.connect(this.analyser);

		// Initialize audio analysis buffers
		this.amplitudeData = new Uint8Array(this.analyser.frequencyBinCount);
		this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

		// Initialize visualizer buffers
		this.smoothData = createArray(this.amplitudeData.length, 0);
		this.wavesFX = createArray(Math.floor(this.amplitudeData.length/2), 0);

		console.log("} Start");
		this.mainLoop();
	},

	mainLoop: function() {
		var self = this;
		requestAnimationFrame(function() {
			self.mainLoop();
		});

		this.analyser.getByteTimeDomainData(this.amplitudeData);
		this.analyser.getByteFrequencyData(this.frequencyData);

		this.updateWavesFX();

		this.renderFrame();
	},

	updateWavesFX: function() {
		var f0 = Math.floor(0.5 * this.frequencyData.length);
		var f = this.frequencyData[f0];
		if(f > 120) {
			this.wavesFX[0] = (2.0*Math.random()-1.0) * (f / 255.0);
		}
		else {
			this.wavesFX[0] = 0;
		}
		for(var j = 0; j < 16; ++j) {
			for(var i = this.wavesFX.length-1; i > 0; --i) {
				this.wavesFX[i] = this.wavesFX[i-1];
			}
		}
	},

	renderFrame: function() {
		var g = this.canvasContext;
		var canvas = this.canvas;

		var bgColor = {
			r: 0,
			g: 0,
			b: 0
		};
		var bgColorStr = "rgb("
			+ Math.floor(Math.random() * bgColor.r) + ", "
			+ Math.floor(Math.random() * bgColor.g) + ", "
			+ Math.floor(Math.random() * bgColor.b) + ")";
		g.fillStyle = bgColorStr;
		g.fillRect(0, 0, canvas.width, canvas.height);

		g.lineWidth = 2;
		//canvasContext.strokeStyle = 'rgb(32, 255, 0)';

		g.beginPath();

		var sliceWidth = canvas.width / this.amplitudeData.length;
		var x = 0;

		for(var i = 0; i < this.amplitudeData.length; i++) {

			var a = this.amplitudeData[i] / 128.0 - 1.0;

			var j = Math.abs(i-Math.floor(this.frequencyData.length/2));
			var f = this.frequencyData[j] / 255.0;

			var wfx = this.wavesFX[j];

			this.smoothData[i] = lerp(this.smoothData[i], a, 0.25);
			a = 4.0*this.smoothData[i];

			var y = 1.5*a*f;
			//y = y*y * sign(y);

			y += wfx;

			var sx = 2.0 * i / this.amplitudeData.length - 1.0;
			var ky = sqdome(sx);
			y = lerp(0, y, ky);

			y = 0.5 * (-y) + 1;
			y = y * canvas.height/2;
			if(i === 0) {
				g.moveTo(x, y);
			} else {
				g.lineTo(x, y);
			}

			x += sliceWidth;
		}

		g.lineTo(canvas.width, canvas.height/2);

		var color = this.color;

		var ck = 0.1;
		g.strokeStyle = "rgb("
			+ (Math.floor(ck * color.r * (0.5 + 0.5*Math.random()))) + ", "
			+ (Math.floor(ck * color.g * (0.5 + 0.5*Math.random()))) + ","
			+ (Math.floor(ck * color.b * (0.5 + 0.5*Math.random())))+")";
		g.lineWidth = 32;
		g.stroke();

		ck = 0.3;
		g.strokeStyle = "rgb("
			+ (Math.floor(ck * color.r * (0.5 + 0.5*Math.random()))) + ", "
			+ (Math.floor(ck * color.g * (0.5 + 0.5*Math.random()))) + ","
			+ (Math.floor(ck * color.b * (0.5 + 0.5*Math.random())))+")";
		g.lineWidth = 8;
		g.stroke();

		g.lineWidth = 2;
		ck = 1.0;
		g.strokeStyle = "rgb("
			+ (Math.floor(ck * color.r * (0.5 + 0.5*Math.random()))) + ", "
			+ (Math.floor(ck * color.g * (0.5 + 0.5*Math.random()))) + ","
			+ (Math.floor(ck * color.b * (0.5 + 0.5*Math.random())))+")";
		g.stroke();

		g.strokeStyle = "rgb(255,255,255)";
		g.lineWidth = 1;
		g.stroke();
	}
}

