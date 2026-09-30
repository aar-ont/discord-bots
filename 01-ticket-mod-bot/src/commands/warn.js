const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { sendLog } = require('../lib/log');
const { checkHierarchy } = require('../lib/modcheck');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a member')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) => o.setName('user').setDescription('Who to warn').setRequired(true))
		.addStringOption((o) => o.setName('reason').setDescription('Why').setRequired(true).setMaxLength(500)),

	async execute(interaction) {
		const member = interaction.options.getMember('user');
		const reason = interaction.options.getString('reason');
		if (!member) return interaction.reply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
		const problem = checkHierarchy(interaction, member, 'warn');
		if (problem) return interaction.reply({ content: problem, flags: MessageFlags.Ephemeral });

		const data = store.guild(interaction.guildId);
		data.warnings[member.id] ??= [];
		data.warnings[member.id].push({ reason, modId: interaction.user.id, at: Date.now() });
		store.save();
		const count = data.warnings[member.id].length;

		const dmed = await member.send(`⚠️ You were warned in **${interaction.guild.name}**: ${reason}`).then(() => true, () => false);
		await interaction.reply(`⚠️ ${member} has been warned (warning #${count}).${dmed ? '' : ' *(could not DM them)*'}`);
		await sendLog(interaction.guild, {
			title: 'Member warned',
			color: 'warn',
			fields: [
				{ name: 'User', value: `${member} (${member.id})`, inline: true },
				{ name: 'Moderator', value: `${interaction.user}`, inline: true },
				{ name: 'Total warnings', value: String(count), inline: true },
				{ name: 'Reason', value: reason },
			],
		});
	},
};
