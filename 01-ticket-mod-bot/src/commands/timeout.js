const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../lib/log');
const { checkHierarchy } = require('../lib/modcheck');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Timeout (mute) a member')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
		.addIntegerOption((o) => o.setName('minutes').setDescription('How long (0 removes the timeout)').setMinValue(0).setMaxValue(40320).setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Why').setMaxLength(500)),

	async execute(interaction) {
		const member = interaction.options.getMember('user');
		const minutes = interaction.options.getInteger('minutes');
		const reason = interaction.options.getString('reason') ?? 'No reason given';
		if (!member) return interaction.reply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
		const problem = checkHierarchy(interaction, member, 'timeout');
		if (problem) return interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });

		await member.timeout(minutes ? minutes * 60_000 : null, `${interaction.user.username}: ${reason}`);
		const what = minutes ? `timed out for ${minutes} minute(s)` : 'no longer timed out';
		await interaction.reply(`🔇 ${member} is ${what}.`);
		await sendLog(interaction.guild, {
			title: minutes ? 'Member timed out' : 'Timeout removed',
			color: 'warn',
			fields: [
				{ name: 'User', value: `${member} (${member.id})`, inline: true },
				{ name: 'Moderator', value: `${interaction.user}`, inline: true },
				{ name: 'Duration', value: minutes ? `${minutes} min` : '-', inline: true },
				{ name: 'Reason', value: reason },
			],
		});
	},
};
