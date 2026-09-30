// Tiny JSON-file store. Good enough for a single-server bot; swap for SQLite/Postgres for big clients.
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

let db = { guilds: {} };
if (fs.existsSync(FILE)) db = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function guild(id) {
	const g = (db.guilds[id] ??= {});
	g.giveaways ??= {}; // id -> giveaway
	g.polls ??= {}; // id -> poll
	g.reminders ??= {}; // id -> reminder
	g.panels ??= {}; // message id -> reaction-role panel
	g.counters ??= { giveaway: 0, poll: 0, reminder: 0 };
	return g;
}

// Every guild that has stored data (the scheduler walks these).
function all() {
	return Object.keys(db.guilds).map((id) => [id, guild(id)]);
}

// Short, per-server numeric ids so commands like /giveaway end id:3 are easy to type.
function nextId(guildData, kind) {
	guildData.counters[kind] += 1;
	return guildData.counters[kind];
}

// Write to a temp file then rename, so a crash mid-write can't corrupt the database.
function save() {
	fs.mkdirSync(DATA_DIR, { recursive: true });
	fs.writeFileSync(FILE + '.tmp', JSON.stringify(db, null, 2));
	fs.renameSync(FILE + '.tmp', FILE);
}

module.exports = { guild, all, nextId, save };
