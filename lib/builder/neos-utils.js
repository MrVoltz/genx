const { library, type } = require("../neos-types");

const allComponents = [];
const componentsByCategory = new Map;





const logixNodeTypesByName = new Map;
const logixNodeTypesByOverload = new Map;

const logixNode = type("LogixNode");
for(let t of library.types) {
	if(!logixNode.isAssignableFrom(t))
		continue;

}
