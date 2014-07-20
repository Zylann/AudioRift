"use strict";

function getQueryString() {
	return window.location.search.substring(1);
}

function createArray(size, fill) {
	var a = new Array(size);
	for(var i = 0; i < size; ++i) {
		a[i] = fill;
	}
	return a;
}

function insertAfter(ref, newNode) {
	ref.parentNode.insertBefore(newNode, ref.nextSibling);
}

