const _ = require("underscore");
const { randomUUID } = require("crypto");

function indexBy(list, iteratee, context) {
	iteratee = _.iteratee(iteratee, context);
	let res = new Map;
	_.each(list, v => {
		res.set(iteratee(v), v);
	});
	return res;
}

function iterableFirst(list) {
	for(let item of list)
		return item;
}

function cloneJsonObject(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function isPlainObject(obj) {
	let proto = Object.getPrototypeOf(obj);
	return proto === null || proto === Object.prototype;
}

function generateGuid() {
	return randomUUID();
}

module.exports = {
	indexBy, cloneJsonObject, isPlainObject, generateGuid, iterableFirst
};
