const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { COLORS, fmt, fail } = require('../lib/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription("Check a member's coin balance")
		.addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)')),

	async execute(interaction) {
		const target = interaction.options.getUser('user') ?? interaction.user;
		if (target.bot) return fail(interaction, "Bots don't have wallets.");
		const u = store.guild(interaction.guildId).users[target.id];
		const embed = new EmbedBuilder()
			.setColor(COLORS.warn)
			.setAuthor({ name: `${target.username}'s wallet`, iconURL: target.displayAvatarURL() })
			.setDescription(`**${fmt(u?.coins ?? 0)}**`);
		await interaction.reply({ embeds: [embed] });
	},
};
