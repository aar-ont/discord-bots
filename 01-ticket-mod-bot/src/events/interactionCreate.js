const { Events, MessageFlags } = require('discord.js');
const { handlers: ticketHandlers } = require('../lib/tickets');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.inGuild()) return;
		try {
			if (interaction.isChatInputCommand()) {
				const command = interaction.client.commands.get(interaction.commandName);
				if (command) await command.execute(interaction);
			} else if (interaction.isButton() || interaction.isModalSubmit()) {
				const handler = ticketHandlers[interaction.customId];
				if (handler) await handler(interaction);
			}
		} catch (err) {
			console.error(`[interaction ${interaction.commandName ?? interaction.customId}]`, err);
			const msg = { content: 'Something went wrong running that. Check that I have the right permissions.', flags: MessageFlags.Ephemeral };
			if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
			else await interaction.reply(msg).catch(() => {});
		}
	},
};
