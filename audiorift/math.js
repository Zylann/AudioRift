"use strict";

function dome(x) {
	if(x > -1 && x < 1)
		return Math.sqrt(1 - x * x)
	return 0;
}

function sqdome(x) {
	if(x > -1 && x < 1)
		return 1 - x * x;
	return 0;
}

function lerp(a, b, t) {
	return a + (b-a) * t;
}

function randomByte() {
	return Math.floor(Math.random()*255);
}

function sign(x) {
	return x < 0 ? -1 : 1;
}

function convertRange(x, oldMin, oldMax, newMin, newMax) {
	x = (x - oldMin) / (oldMax - oldMin);
	return x * (newMax - newMin) + newMin;
}

function convertArrayRange(a, oldMin, oldMax, newMin, newMax) {
	var oldLength = oldMax - oldMin;
	var newLength = newMax - newMin;
	for(var i = 0; i < a.length; ++i) {
		var x = a[i];
		x = (x - oldMin) / oldLength;
		x = x * newLength + newMin;
		a[i] = x;
	}
}

