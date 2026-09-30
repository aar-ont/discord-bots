const { SlashCommandBuilder } = require('discord.js');
const { buildPage } = require('../lib/leaderboard');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Top members by XP or coins')
		.addStringOption((o) => o.setName('type').setDescription('Which leaderboard').setRequired(true)
			.addChoices({ name: 'XP', value: 'xp' }, { name: 'Coins', value: 'coins' })),

	async execute(interaction) {
		const type = interaction.options.getString('type', true);
		await interaction.reply(buildPage(interaction.guildId, type, 0, interaction.user.id));
	},
};
