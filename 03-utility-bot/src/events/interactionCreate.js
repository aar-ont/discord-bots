const { Events, MessageFlags } = require('discord.js');
const giveaways = require('../lib/giveaways');
const polls = require('../lib/polls');
const reactionroles = require('../lib/reactionroles');

// Buttons are routed by the part of the customId before the first ":".
const componentHandlers = {
	giveaway: giveaways.handleButton,
	poll: polls.handleButton,
	rr: reactionroles.handleButton,
};

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.inGuild()) return;
		try {
			if (interaction.isChatInputCommand()) {
				const command = interaction.client.commands.get(interaction.commandName);
				if (command) await command.execute(interaction);
			} else if (interaction.isButton() || interaction.isAnySelectMenu()) {
				const handler = componentHandlers[interaction.customId.split(':')[0]];
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
