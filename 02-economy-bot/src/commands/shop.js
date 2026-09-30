const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { COLORS, fmt } = require('../lib/economy');

module.exports = {
	data: new SlashCommandBuilder().setName('shop').setDescription('See what you can buy with coins'),

	async execute(interaction) {
		const { shop } = store.guild(interaction.guildId);
		const embed = new EmbedBuilder()
			.setTitle('Shop')
			.setColor(COLORS.good)
			.setDescription(shop.length
				? shop.map((i) => `**${i.name}** - ${fmt(i.price)}${i.roleId ? ` - grants <@&${i.roleId}>` : ''}${i.description ? `\n${i.description}` : ''}`).join('\n\n')
				: 'The shop is empty. Admins can add items with `/economy add-item`.')
			.setFooter({ text: 'Buy with /buy' });
		await interaction.reply({ embeds: [embed] });
	},
};
