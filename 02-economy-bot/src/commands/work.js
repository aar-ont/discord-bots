const { SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { fmt, unix, fail, cooldownLeft } = require('../lib/economy');

const COOLDOWN_MS = 60 * 60 * 1000;
const MIN = 20;
const MAX = 120;
const JOBS = [
	'debugged a stubborn production bug',
	'delivered pizzas across town',
	'walked a very energetic dog',
	'streamed to an audience of three (and a bot)',
	'fixed a neighbour\'s Wi-Fi',
	'painted a fence',
	'baked a batch of cookies for the bake sale',
	'moderated a chaotic group chat',
	'translated a stack of memes',
	'repaired a vintage arcade cabinet',
];

module.exports = {
	data: new SlashCommandBuilder().setName('work').setDescription('Work a shift for some coins (1 hour cooldown)'),

	async execute(interaction) {
		const u = store.user(store.guild(interaction.guildId), interaction.user.id);
		const left = cooldownLeft(u.lastWork, COOLDOWN_MS);
		if (left) return fail(interaction, `You're tired. You can work again <t:${unix(Date.now() + left)}:R>.`);

		const pay = MIN + Math.floor(Math.random() * (MAX - MIN + 1));
		const job = JOBS[Math.floor(Math.random() * JOBS.length)];
		u.coins += pay;
		u.lastWork = Date.now();
		store.save();
		await interaction.reply(`💼 You ${job} and earned **${fmt(pay)}**.\nBalance: ${fmt(u.coins)}`);
	},
};
