const { Events, MessageFlags } = require('discord.js');
const leaderboard = require('../lib/leaderboard');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.inGuild()) return;
		try {
			if (interaction.isChatInputCommand()) {
				const command = interaction.client.commands.get(interaction.commandName);
				if (command) await command.execute(interaction);
			} else if (interaction.isAutocomplete()) {
				const command = interaction.client.commands.get(interaction.commandName);
				if (command?.autocomplete) await command.autocomplete(interaction);
			} else if (interaction.isButton()) {
				if (interaction.customId.startsWith('lb:')) await leaderboard.onButton(interaction);
			}
		} catch (err) {
			console.error(`[interaction ${interaction.commandName ?? interaction.customId}]`, err);
			if (interaction.isAutocomplete()) return;
			const msg = { content: 'Something went wrong running that. Check that I have the right permissions.', flags: MessageFlags.Ephemeral };
			if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
			else await interaction.reply(msg).catch(() => {});
		}
	},
};
