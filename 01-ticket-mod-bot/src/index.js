const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { loadDir } = require('./lib/loader');

if (!process.env.DISCORD_TOKEN) {
	console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.');
	process.exit(1);
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers, // privileged: welcome + autorole
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent, // privileged: message edit/delete logs
	],
	partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();
for (const command of loadDir('commands')) client.commands.set(command.data.name, command);

for (const event of loadDir('events')) {
	client[event.once ? 'once' : 'on'](event.name, (...args) => event.execute(...args));
}

process.on('unhandledRejection', (err) => console.error('[unhandled]', err));

client.login(process.env.DISCORD_TOKEN).catch((err) => {
	if (err.message.includes('disallowed intents')) {
		console.error('Discord rejected the intents. In the Developer Portal -> Bot, turn on "Server Members Intent" and "Message Content Intent", click Save Changes, then run npm start again.');
	} else {
		console.error('Login failed:', err.message);
	}
	process.exit(1);
});
