const { library, type } = require("./neos-types");
const { wrapType } = require("./wrappers");

const components = [];

const Component = type("Component");
for(let t of library.types) {
	if(t.kind !== "class" || !Component.isAssignableFrom(t))
		continue;
	components.push(wrapType(t));
}

const logixNodes = [];
const logixNodesByOverload = new Map;

for(let c of components) {
	if(!c.isLogixNode)
		continue;
	logixNodes.push(c);

	if(c.nodeOverload) {
		let arr = logixNodesByOverload.get(c.nodeOverload) || [];
		arr.push(c);
		logixNodesByOverload.set(c.nodeOverload, arr);
	}
}

function findLogixNodesByOverload(name) {
	if(name.isLogixNode)
		name = name.nodeOverload;
	return logixNodesByOverload.get(name) || [];
}

module.exports = { components, logixNodes, findLogixNodesByOverload };
