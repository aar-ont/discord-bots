// Offline sanity check: loads every command/event and validates command definitions. No token needed.
const { loadDir } = require('./lib/loader');

const commands = loadDir('commands');
for (const c of commands) c.data.toJSON();
const events = loadDir('events');
for (const e of events) if (!e.name || typeof e.execute !== 'function') throw new Error(`Bad event module: ${JSON.stringify(e)}`);
console.log(`OK: ${commands.length} commands (${commands.map((c) => '/' + c.data.name).join(' ')}), ${events.length} events`);
