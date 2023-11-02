/*
* Sets a value for a given key
*/
function setValue(key, value) {
	window.localStorage.setItem(key, value);
}

/*
* Returns the value for a given key
*/
function getValue(key) {
	return window.localStorage.getItem(key);
}

/*
 * Clean local storage
 */
function cleanStorage(c_name) {
	window.localStorage.clear();
}