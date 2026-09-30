const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reminders')
		.setDescription('Manage your reminders')
		.addSubcommand((s) => s.setName('list').setDescription('Show your active reminders'))
		.addSubcommand((s) => s.setName('cancel').setDescription('Cancel a reminder')
			.addIntegerOption((o) => o.setName('id').setDescription('Reminder id (see /reminders list)').setRequired(true).setMinValue(1))),

	async execute(interaction) {
		const reply = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });
		const data = store.guild(interaction.guildId);
		const mine = Object.values(data.reminders).filter((r) => r.userId === interaction.user.id).sort((a, b) => a.endsAt - b.endsAt);

		if (interaction.options.getSubcommand() === 'list') {
			if (!mine.length) return reply('You have no active reminders. Set one with `/remind`.');
			const lines = mine.map((r) => {
				const text = r.message.length > 80 ? `${r.message.slice(0, 77)}...` : r.message;
				return `**#${r.id}** <t:${Math.floor(r.endsAt / 1000)}:R>${r.dm ? ' (DM)' : ''} - ${text}`;
			});
			const embed = new EmbedBuilder().setTitle('Your reminders').setColor(0x5865f2).setDescription(lines.join('\n'));
			return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
		}

		const id = interaction.options.getInteger('id');
		// Only your own reminders can be cancelled.
		const r = mine.find((x) => x.id === id);
		if (!r) return reply('You have no reminder with that id.');
		delete data.reminders[r.id];
		store.save();
		await reply(`Cancelled reminder #${id}.`);
	},
};
