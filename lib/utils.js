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

function generateGuid() {
	return randomUUID();
}

module.exports = {
	indexBy, generateGuid
};
