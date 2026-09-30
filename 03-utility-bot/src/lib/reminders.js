const store = require('./store');
const scheduler = require('./scheduler');
const { fetchTextChannel } = require('./util');

const MAX_PER_USER = 25;
const MIN_MS = 10_000;
const MAX_MS = 365 * 86_400_000;

async function deliver(client, guildId, r) {
	// Remove first: a reminder fires at most once, even if sending fails or the bot crashes mid-send.
	delete store.guild(guildId).reminders[r.id];
	store.save();

	const text = `⏰ <@${r.userId}> reminder (set <t:${Math.floor(r.createdAt / 1000)}:R>): ${r.message}`;
	// Only the reminded user can be pinged. Anything in the message body (@everyone, roles, other users) stays inert text.
	const allowedMentions = { parse: [], users: [r.userId] };

	if (!r.dm) {
		const channel = await fetchTextChannel(client, r.channelId);
		const sent = channel && await channel.send({ content: text, allowedMentions }).then(() => true, () => false);
		if (sent) return;
	}
	// DM requested, or the channel is gone / not writable: fall back to a DM.
	const user = await client.users.fetch(r.userId).catch(() => null);
	await user?.send({ content: `⏰ Reminder (set <t:${Math.floor(r.createdAt / 1000)}:R>): ${r.message}`, allowedMentions: { parse: [] } }).catch(() => {});
}

scheduler.register('reminders', {
	isDue: (r, now) => r.endsAt <= now,
	run: deliver,
});

module.exports = { MAX_PER_USER, MIN_MS, MAX_MS };
