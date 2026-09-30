const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../lib/log');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Unban a user by ID')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption((o) => o.setName('user-id').setDescription('Their user ID').setRequired(true)),

	async execute(interaction) {
		const id = interaction.options.getString('user-id').trim();
		try {
			const user = await interaction.guild.members.unban(id, `Unbanned by ${interaction.user.username}`);
			await interaction.reply(`✅ **${user.username}** was unbanned.`);
			await sendLog(interaction.guild, { title: 'User unbanned', color: 'good', description: `${user.username} (${id}) unbanned by ${interaction.user}` });
		} catch {
			await interaction.reply({ content: "Couldn't unban that ID - check it's correct and actually banned.", flags: MessageFlags.Ephemeral });
		}
	},
};
