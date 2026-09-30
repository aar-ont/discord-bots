const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../lib/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Bulk-delete recent messages in this channel')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption((o) => o.setName('amount').setDescription('How many (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
		.addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user')),

	async execute(interaction) {
		const amount = interaction.options.getInteger('amount');
		const user = interaction.options.getUser('user');
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		let messages = await interaction.channel.messages.fetch({ limit: 100 });
		if (user) messages = messages.filter((m) => m.author.id === user.id);
		const toDelete = [...messages.values()].slice(0, amount);
		// `true` skips messages older than 14 days, which Discord won't bulk-delete.
		const deleted = await interaction.channel.bulkDelete(toDelete, true);

		await interaction.editReply(`🧹 Deleted ${deleted.size} message(s).${deleted.size < toDelete.length ? ' (Messages older than 14 days are skipped.)' : ''}`);
		await sendLog(interaction.guild, {
			title: 'Messages purged',
			color: 'warn',
			description: `${interaction.user} deleted ${deleted.size} message(s) in ${interaction.channel}${user ? ` from ${user}` : ''}.`,
		});
	},
};
