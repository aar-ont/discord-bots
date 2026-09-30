// Tiny JSON-file store. Good enough for a single-server bot; swap for SQLite/Postgres for big clients.
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

let db = { guilds: {} };
if (fs.existsSync(FILE)) db = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function guild(id) {
	db.guilds[id] ??= {};
	const g = db.guilds[id];
	g.config ??= { levelUpChannelId: null, levelRoles: {} }; // levelRoles: { "5": roleId }
	g.config.levelRoles ??= {};
	g.users ??= {};
	g.shop ??= []; // [{ id, name, price, roleId, description }]
	g.nextItemId ??= 1;
	return g;
}

// A member's economy record. All money and XP values are integers.
function user(guildData, userId) {
	guildData.users[userId] ??= { xp: 0, level: 0, coins: 0, lastXp: 0, lastDaily: 0, streak: 0, lastWork: 0, inventory: {} };
	return guildData.users[userId];
}

// Write to a temp file then rename, so a crash mid-write can't corrupt the database.
function save() {
	fs.mkdirSync(DATA_DIR, { recursive: true });
	fs.writeFileSync(FILE + '.tmp', JSON.stringify(db, null, 2));
	fs.renameSync(FILE + '.tmp', FILE);
}

module.exports = { guild, user, save };
