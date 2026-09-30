// Registers slash commands to your server. Run again whenever you add/change a command.
const { REST, Routes } = require('discord.js');
const { loadDir } = require('./lib/loader');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
	console.error('Set DISCORD_TOKEN, CLIENT_ID and GUILD_ID in .env first.');
	process.exit(1);
}

const commands = loadDir('commands').map((c) => c.data.toJSON());

(async () => {
	const rest = new REST().setToken(DISCORD_TOKEN);
	const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
	console.log(`Registered ${data.length} slash commands: ${data.map((c) => '/' + c.name).join(', ')}`);
})().catch((err) => {
	console.error('Failed to register commands:', err.message);
	process.exit(1);
});
