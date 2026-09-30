const { PermissionFlagsBits } = require('discord.js');

const messageLink = (guildId, channelId, messageId) => `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

// Discord timestamp markup: "in 2 hours" + the full date.
const timestamp = (ms) => `<t:${Math.floor(ms / 1000)}:R> (<t:${Math.floor(ms / 1000)}:f>)`;

// Fisher-Yates shuffle, take the first n: unique, unbiased picks.
function pickRandom(list, n) {
	const a = [...list];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a.slice(0, n);
}

// Can the bot post embeds in this channel? Returns an error string or null.
function checkCanPost(channel, me) {
	const perms = channel.permissionsFor(me);
	const needed = [
		[PermissionFlagsBits.ViewChannel, 'View Channel'],
		[PermissionFlagsBits.SendMessages, 'Send Messages'],
		[PermissionFlagsBits.EmbedLinks, 'Embed Links'],
	];
	const missing = needed.filter(([flag]) => !perms?.has(flag)).map(([, name]) => name);
	return missing.length ? `I'm missing these permissions in ${channel}: ${missing.join(', ')}.` : null;
}

async function fetchTextChannel(client, channelId) {
	const channel = await client.channels.fetch(channelId).catch(() => null);
	return channel?.isTextBased() ? channel : null;
}

async function fetchMessage(client, channelId, messageId) {
	const channel = await fetchTextChannel(client, channelId);
	return channel ? channel.messages.fetch(messageId).catch(() => null) : null;
}

module.exports = { messageLink, timestamp, pickRandom, checkCanPost, fetchTextChannel, fetchMessage };
