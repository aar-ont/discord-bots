const { EmbedBuilder } = require('discord.js');
const store = require('./store');

const COLORS = { info: 0x5865f2, good: 0x57f287, warn: 0xfee75c, bad: 0xed4245 };

// Sends an embed to the server's configured log channel (if any). Never throws.
async function sendLog(guild, { title, description, color = 'info', fields = [], files = [] }) {
	const channelId = store.guild(guild.id).config.logChannelId;
	if (!channelId) return;
	try {
		const channel = await guild.channels.fetch(channelId);
		const embed = new EmbedBuilder()
			.setTitle(title)
			.setColor(COLORS[color] ?? color)
			.setTimestamp();
		if (description) embed.setDescription(description.slice(0, 4000));
		if (fields.length) embed.addFields(fields);
		await channel.send({ embeds: [embed], files });
	} catch (err) {
		console.warn(`[log] could not write to log channel in ${guild.name}:`, err.message);
	}
}

module.exports = { sendLog, COLORS };
