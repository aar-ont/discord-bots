const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { resolveDuration, formatDuration } = require('../lib/duration');
const { MAX_PER_USER, MIN_MS, MAX_MS } = require('../lib/reminders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Set a reminder')
		.addStringOption((o) => o.setName('in').setDescription('When: e.g. 30m, 2h, 1d, 1h30m').setRequired(true))
		.addStringOption((o) => o.setName('message').setDescription('What to remind you about').setRequired(true).setMaxLength(500))
		.addBooleanOption((o) => o.setName('dm').setDescription('Send it as a DM instead of pinging you here')),

	async execute(interaction) {
		const reply = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });
		const { ms, error } = resolveDuration(interaction.options.getString('in'), { min: MIN_MS, max: MAX_MS });
		if (error) return reply(error);

		const data = store.guild(interaction.guildId);
		const mine = Object.values(data.reminders).filter((r) => r.userId === interaction.user.id);
		if (mine.length >= MAX_PER_USER) return reply(`You already have ${MAX_PER_USER} active reminders. Cancel one with \`/reminders cancel\`.`);

		const r = {
			id: store.nextId(data, 'reminder'),
			userId: interaction.user.id,
			channelId: interaction.channelId,
			message: interaction.options.getString('message'),
			dm: interaction.options.getBoolean('dm') ?? false,
			createdAt: Date.now(),
			endsAt: Date.now() + ms,
		};
		data.reminders[r.id] = r;
		store.save();
		await reply(`⏰ Reminder #${r.id} set. I'll ${r.dm ? 'DM you' : 'ping you here'} <t:${Math.floor(r.endsAt / 1000)}:R> (in ${formatDuration(ms)}).`);
	},
};
