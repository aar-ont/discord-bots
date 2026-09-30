const fs = require('node:fs');
const path = require('node:path');

// Loads every .js file in a folder (commands/ or events/).
function loadDir(dir) {
	const full = path.join(__dirname, '..', dir);
	return fs.readdirSync(full).filter((f) => f.endsWith('.js')).map((f) => require(path.join(full, f)));
}

module.exports = { loadDir };
