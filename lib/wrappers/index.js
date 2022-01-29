const { wrapType } = require("./type");
// const { wrapField } = require("./field");

require("./neos-primitive");
require("./worker");
require("./sync-members");
require("./slot");

module.exports = { wrapType };
