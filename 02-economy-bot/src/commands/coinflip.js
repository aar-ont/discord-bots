const { SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { fmt, fail } = require('../lib/economy');

const MAX_BET = 1000;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription(`Bet virtual coins on a coin flip (max ${MAX_BET})`)
		.addIntegerOption((o) => o.setName('amount').setDescription('Coins to bet').setMinValue(1).setMaxValue(MAX_BET).setRequired(true))
		.addStringOption((o) => o.setName('choice').setDescription('Your call').setRequired(true)
			.addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })),

	async execute(interaction) {
		const amount = interaction.options.getInteger('amount', true);
		const choice = interaction.options.getString('choice', true);
		if (amount <= 0 || amount > MAX_BET) return fail(interaction, `Bets must be between 1 and ${MAX_BET}.`);

		const u = store.user(store.guild(interaction.guildId), interaction.user.id);
		if (u.coins < amount) return fail(interaction, `You only have ${fmt(u.coins)}.`);

		const result = Math.random() < 0.5 ? 'heads' : 'tails';
		const won = result === choice;
		u.coins += won ? amount : -amount;
		store.save();
		await interaction.reply(`🪙 The coin landed on **${result}**. ${won ? `You won **${fmt(amount)}**!` : `You lost **${fmt(amount)}**.`}\nBalance: ${fmt(u.coins)}`);
	},
};
