const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../lib/log');
const { checkHierarchy } = require('../lib/modcheck');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(500)),

	async execute(interaction) {
		const member = interaction.options.getMember('user');
		const reason = interaction.options.getString('reason') ?? 'No reason given';
		if (!member) return interaction.reply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
		const problem = checkHierarchy(interaction, member, 'kick');
		if (problem) return interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });

		await member.send(`👢 You were kicked from **${interaction.guild.name}**: ${reason}`).catch(() => {});
		await member.kick(`${interaction.user.username}: ${reason}`);
		await interaction.reply(`👢 **${member.user.username}** was kicked.`);
		await sendLog(interaction.guild, {
			title: 'Member kicked',
			color: 'bad',
			fields: [
				{ name: 'User', value: `${member.user.username} (${member.id})`, inline: true },
				{ name: 'Moderator', value: `${interaction.user}`, inline: true },
				{ name: 'Reason', value: reason },
			],
		});
	},
};
