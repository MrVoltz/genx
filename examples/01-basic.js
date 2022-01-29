const { moduleBuilder } = require("../lib/builder");

let obj = createObject();
let b = moduleBuilder(obj.rootSlot);

let numA = b.exportValue("int", ["Inputs", "numA"]),
	numB = b.exportValue("int", ["Inputs", "numB"]),
	aPlusB = b.exportValue("int", ["Outputs", "aPlusB"]);

aPlusB.assign(numA.add(numB));

console.log(obj.toJSON());
