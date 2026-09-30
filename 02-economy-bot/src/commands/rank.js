const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const levels = require('../lib/levels');
const { COLORS, fail } = require('../lib/economy');
const { ranked } = require('../lib/leaderboard');

const BAR_LENGTH = 15;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription("Show a member's level and XP")
		.addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)')),

	async execute(interaction) {
		const target = interaction.options.getUser('user') ?? interaction.user;
		if (target.bot) return fail(interaction, "Bots don't earn XP.");

		const data = store.guild(interaction.guildId);
		const u = data.users[target.id] ?? { xp: 0 };
		const { level, current, needed } = levels.progress(u.xp);
		const filled = Math.round((current / needed) * BAR_LENGTH);
		const bar = '█'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled);
		const pos = ranked(interaction.guildId, 'xp').findIndex(([id]) => id === target.id) + 1;

		const embed = new EmbedBuilder()
			.setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
			.setColor(COLORS.info)
			.addFields(
				{ name: 'Level', value: String(level), inline: true },
				{ name: 'Rank', value: pos ? `#${pos}` : 'Unranked', inline: true },
				{ name: 'Total XP', value: u.xp.toLocaleString('en-US'), inline: true },
				{ name: 'Progress', value: `${bar}\n${current.toLocaleString('en-US')} / ${needed.toLocaleString('en-US')} XP to level ${level + 1}` },
			);
		await interaction.reply({ embeds: [embed] });
	},
};
