const { SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { MAX_AMOUNT, fmt, fail } = require('../lib/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pay')
		.setDescription('Send coins to another member')
		.addUserOption((o) => o.setName('user').setDescription('Who to pay').setRequired(true))
		.addIntegerOption((o) => o.setName('amount').setDescription('Coins to send').setMinValue(1).setMaxValue(MAX_AMOUNT).setRequired(true)),

	async execute(interaction) {
		const target = interaction.options.getUser('user', true);
		const amount = interaction.options.getInteger('amount', true);
		if (amount <= 0) return fail(interaction, 'Amount must be at least 1.');
		if (target.bot) return fail(interaction, "You can't pay a bot.");
		if (target.id === interaction.user.id) return fail(interaction, "You can't pay yourself.");

		const data = store.guild(interaction.guildId);
		const from = store.user(data, interaction.user.id);
		if (from.coins < amount) return fail(interaction, `You only have ${fmt(from.coins)}.`);

		from.coins -= amount;
		store.user(data, target.id).coins += amount;
		store.save();
		await interaction.reply({ content: `💸 ${interaction.user} paid ${target} **${fmt(amount)}**.`, allowedMentions: { users: [target.id] } });
	},
};
