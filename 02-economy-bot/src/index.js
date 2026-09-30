const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadDir } = require('./lib/loader');

if (!process.env.DISCORD_TOKEN) {
	console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.');
	process.exit(1);
}

// Only non-privileged intents. Message events arrive without text content (no Message Content
// intent needed), and role changes use member.roles.add (no Server Members intent needed).
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages, // messageCreate events for XP (content is not read)
	],
});

client.commands = new Collection();
for (const command of loadDir('commands')) client.commands.set(command.data.name, command);

for (const event of loadDir('events')) {
	client[event.once ? 'once' : 'on'](event.name, (...args) => event.execute(...args));
}

process.on('unhandledRejection', (err) => console.error('[unhandled]', err));

client.login(process.env.DISCORD_TOKEN);
