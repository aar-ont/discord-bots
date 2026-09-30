const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../lib/log');
const { checkHierarchy } = require('../lib/modcheck');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user (works even if they already left)')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(500))
		.addIntegerOption((o) => o.setName('delete-days').setDescription('Delete their messages from the last N days').setMinValue(0).setMaxValue(7)),

	async execute(interaction) {
		const user = interaction.options.getUser('user');
		const member = interaction.options.getMember('user');
		const reason = interaction.options.getString('reason') ?? 'No reason given';
		const days = interaction.options.getInteger('delete-days') ?? 0;
		const problem = checkHierarchy(interaction, member, 'ban');
		if (problem) return interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });

		if (member) await member.send(`🔨 You were banned from **${interaction.guild.name}**: ${reason}`).catch(() => {});
		await interaction.guild.members.ban(user, { reason: `${interaction.user.username}: ${reason}`, deleteMessageSeconds: days * 86400 });
		await interaction.reply(`🔨 **${user.username}** was banned.`);
		await sendLog(interaction.guild, {
			title: 'User banned',
			color: 'bad',
			fields: [
				{ name: 'User', value: `${user.username} (${user.id})`, inline: true },
				{ name: 'Moderator', value: `${interaction.user}`, inline: true },
				{ name: 'Reason', value: reason },
			],
		});
	},
};
