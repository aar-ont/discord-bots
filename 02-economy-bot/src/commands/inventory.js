const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { COLORS, fail } = require('../lib/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription("Show a member's items")
		.addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)')),

	async execute(interaction) {
		const target = interaction.options.getUser('user') ?? interaction.user;
		if (target.bot) return fail(interaction, "Bots don't have inventories.");
		const items = Object.values(store.guild(interaction.guildId).users[target.id]?.inventory ?? {});
		const embed = new EmbedBuilder()
			.setAuthor({ name: `${target.username}'s inventory`, iconURL: target.displayAvatarURL() })
			.setColor(COLORS.info)
			.setDescription(items.length ? items.map((i) => `**${i.name}** x${i.qty}`).join('\n').slice(0, 4000) : 'Empty. Browse the `/shop`!');
		await interaction.reply({ embeds: [embed] });
	},
};
