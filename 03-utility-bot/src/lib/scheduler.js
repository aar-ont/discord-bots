// One scheduler for everything time-based (giveaways, polls, reminders).
// Instead of a long setTimeout per item (which caps at ~24.8 days and is lost on restart),
// we persist an `endsAt` timestamp and check for due items every few seconds.
const store = require('./store');

const INTERVAL_MS = 15_000;
const sources = new Map(); // collection name -> { isDue, run, prune }
let timer = null;
let running = false;

// name is the key inside a guild's data (e.g. 'giveaways').
//   isDue(item, now) -> true when run() should fire
//   run(client, guildId, item) -> does the work and must mark the item done before awaiting I/O
//   prune(item, now) -> optional; true to delete old finished items
function register(name, source) {
	sources.set(name, source);
}

async function tick(client) {
	if (running) return; // don't overlap if a tick is slow
	running = true;
	try {
		const now = Date.now();
		for (const [guildId, data] of store.all()) {
			for (const [name, { isDue, run, prune }] of sources) {
				for (const [key, item] of Object.entries(data[name])) {
					try {
						if (isDue(item, now)) await run(client, guildId, item);
						else if (prune?.(item, now)) {
							delete data[name][key];
							store.save();
						}
					} catch (err) {
						console.error(`[scheduler ${name}#${item.id}]`, err);
					}
				}
			}
		}
	} finally {
		running = false;
	}
}

// Runs one pass immediately (ends anything that expired while the bot was offline), then repeats.
function start(client) {
	if (timer) return;
	tick(client);
	timer = setInterval(() => tick(client), INTERVAL_MS);
}

module.exports = { register, start, tick, INTERVAL_MS };
