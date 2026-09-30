const { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { panelMessage } = require('../lib/tickets');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ticketpanel')
		.setDescription('Post the "Open ticket" button')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption((o) => o.setName('channel').setDescription('Where to post it (default: here)').addChannelTypes(ChannelType.GuildText)),

	async execute(interaction) {
		const channel = interaction.options.getChannel('channel') ?? interaction.channel;
		await channel.send(panelMessage());
		await interaction.reply({ content: `Ticket panel posted in ${channel}.`, flags: MessageFlags.Ephemeral });
	},
};
