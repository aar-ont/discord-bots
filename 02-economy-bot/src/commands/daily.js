const { SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { fmt, unix, fail, cooldownLeft } = require('../lib/economy');

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STREAK_GRACE_MS = 48 * 60 * 60 * 1000; // miss a full day and the streak resets
const BASE = 100;
const PER_STREAK_DAY = 20;
const MAX_STREAK_BONUS_DAYS = 10;

module.exports = {
	data: new SlashCommandBuilder().setName('daily').setDescription('Claim your daily coins (streaks give a bonus)'),

	async execute(interaction) {
		const data = store.guild(interaction.guildId);
		const u = store.user(data, interaction.user.id);

		const left = cooldownLeft(u.lastDaily, COOLDOWN_MS);
		if (left) return fail(interaction, `You already claimed today. Come back <t:${unix(Date.now() + left)}:R>.`);

		u.streak = Date.now() - u.lastDaily <= STREAK_GRACE_MS ? u.streak + 1 : 1;
		const bonus = Math.min(u.streak - 1, MAX_STREAK_BONUS_DAYS) * PER_STREAK_DAY;
		const reward = BASE + bonus;
		u.coins += reward;
		u.lastDaily = Date.now();
		store.save();

		await interaction.reply(`💰 You claimed **${fmt(reward)}**! Streak: **${u.streak}** day${u.streak === 1 ? '' : 's'}`
			+ (bonus ? ` (+${fmt(bonus)} streak bonus)` : '') + `.\nBalance: ${fmt(u.coins)}`);
	},
};
