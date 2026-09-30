// Tiny JSON-file store. Good enough for a single-server bot; swap for SQLite/Postgres for big clients.
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

let db = { guilds: {} };
if (fs.existsSync(FILE)) db = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function guild(id) {
	db.guilds[id] ??= { config: {}, warnings: {}, ticketCount: 0, openTickets: {} };
	return db.guilds[id];
}

// Write to a temp file then rename, so a crash mid-write can't corrupt the database.
function save() {
	fs.mkdirSync(DATA_DIR, { recursive: true });
	fs.writeFileSync(FILE + '.tmp', JSON.stringify(db, null, 2));
	fs.renameSync(FILE + '.tmp', FILE);
}

module.exports = { guild, save };
