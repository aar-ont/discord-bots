const { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { sendLog } = require('../lib/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warnings')
		.setDescription('View or clear warnings')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addSubcommand((s) => s.setName('list').setDescription("List a member's warnings")
			.addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true)))
		.addSubcommand((s) => s.setName('clear').setDescription("Clear all of a member's warnings")
			.addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))),

	async execute(interaction) {
		const user = interaction.options.getUser('user');
		const data = store.guild(interaction.guildId);
		const list = data.warnings[user.id] ?? [];

		if (interaction.options.getSubcommand() === 'clear') {
			delete data.warnings[user.id];
			store.save();
			await interaction.reply({ content: `Cleared ${list.length} warning(s) for ${user}.`, flags: MessageFlags.Ephemeral });
			return sendLog(interaction.guild, { title: 'Warnings cleared', color: 'info', description: `${interaction.user} cleared ${list.length} warning(s) for ${user}.` });
		}

		const embed = new EmbedBuilder()
			.setTitle(`Warnings for ${user.username}`)
			.setColor(0xfee75c)
			.setDescription(list.length
				? list.slice(-15).map((w, i) => `**${i + 1}.** ${w.reason} - by <@${w.modId}> <t:${Math.floor(w.at / 1000)}:R>`).join('\n')
				: 'No warnings. 🎉');
		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},
};
