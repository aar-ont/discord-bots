const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const store = require('./store');
const scheduler = require('./scheduler');
const { timestamp, pickRandom, fetchMessage, fetchTextChannel } = require('./util');

const KEEP_ENDED_MS = 30 * 86_400_000; // keep finished giveaways around this long so /giveaway reroll works

function buildEmbed(g) {
	const embed = new EmbedBuilder()
		.setTitle(`🎉 ${g.prize}`)
		.setFooter({ text: `Giveaway #${g.id}` });
	if (!g.ended) {
		return embed
			.setColor(0xf1c40f)
			.setDescription(`Click **Enter** to join. Click again to leave.\n\n**Ends:** ${timestamp(g.endsAt)}\n**Hosted by:** <@${g.hostId}>\n**Winners:** ${g.winnerCount}`)
			.addFields({ name: 'Entries', value: String(g.entrants.length), inline: true });
	}
	const winners = g.winners.length ? g.winners.map((id) => `<@${id}>`).join(', ') : 'No valid entries';
	return embed
		.setColor(0x95a5a6)
		.setDescription(`**Ended** ${timestamp(g.endedAt)}\n**Hosted by:** <@${g.hostId}>\n**Winners:** ${winners}`)
		.addFields({ name: 'Entries', value: String(g.entrants.length), inline: true });
}

function buildRow(g) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`giveaway:enter:${g.id}`)
			.setLabel(g.ended ? 'Ended' : 'Enter')
			.setEmoji('🎉')
			.setStyle(g.ended ? ButtonStyle.Secondary : ButtonStyle.Success)
			.setDisabled(g.ended),
	);
}

const messagePayload = (g) => ({ embeds: [buildEmbed(g)], components: [buildRow(g)] });

async function refreshMessage(client, g) {
	const msg = await fetchMessage(client, g.channelId, g.messageId);
	if (msg) await msg.edit(messagePayload(g)).catch((err) => console.error(`[giveaway #${g.id}] edit failed:`, err.message));
	return msg;
}

async function announce(client, g, msg, text) {
	const channel = await fetchTextChannel(client, g.channelId);
	if (!channel) return;
	await channel.send({
		content: text,
		// Only the winners can be pinged, never @everyone/@here/roles, even if the prize text contains them.
		allowedMentions: { parse: [], users: g.winners },
		reply: msg ? { messageReference: msg.id, failIfNotExists: false } : undefined,
	}).catch((err) => console.error(`[giveaway #${g.id}] announce failed:`, err.message));
}

// Marks the giveaway ended and persists BEFORE any network call, so a crash can't end it twice.
async function endGiveaway(client, g) {
	if (g.ended) return;
	g.ended = true;
	g.endedAt = Date.now();
	g.winners = pickRandom(g.entrants, g.winnerCount);
	store.save();
	const msg = await refreshMessage(client, g);
	const text = g.winners.length
		? `🎉 Congratulations ${g.winners.map((id) => `<@${id}>`).join(', ')}! You won **${g.prize}**!`
		: `😢 No one entered the giveaway for **${g.prize}**, so there is no winner.`;
	await announce(client, g, msg, text);
}

// Draws new winners from people who have not won yet. Returns false if nobody is left.
async function rerollGiveaway(client, g, count) {
	const pool = g.entrants.filter((id) => !g.winners.includes(id));
	if (!pool.length) return false;
	g.winners = pickRandom(pool, count);
	store.save();
	const msg = await refreshMessage(client, g);
	await announce(client, g, msg, `🎉 New winner${g.winners.length > 1 ? 's' : ''}: ${g.winners.map((id) => `<@${id}>`).join(', ')}! You won **${g.prize}**!`);
	return true;
}

// Button click: toggle the user in/out and update the count on the message itself.
async function handleButton(interaction) {
	const [, action, rawId] = interaction.customId.split(':');
	const g = store.guild(interaction.guildId).giveaways[rawId];
	if (action !== 'enter') return;
	if (!g || g.ended) {
		return interaction.reply({ content: 'This giveaway has ended.', flags: MessageFlags.Ephemeral });
	}
	const i = g.entrants.indexOf(interaction.user.id);
	if (i === -1) g.entrants.push(interaction.user.id);
	else g.entrants.splice(i, 1);
	store.save();
	await interaction.update(messagePayload(g));
	await interaction.followUp({
		content: i === -1 ? `🎉 You're in! Good luck. (${g.entrants.length} entries)` : 'You left the giveaway.',
		flags: MessageFlags.Ephemeral,
	});
}

scheduler.register('giveaways', {
	isDue: (g, now) => !g.ended && g.endsAt <= now,
	run: (client, guildId, g) => endGiveaway(client, g),
	prune: (g, now) => g.ended && now - g.endedAt > KEEP_ENDED_MS,
});

module.exports = { buildEmbed, messagePayload, endGiveaway, rerollGiveaway, handleButton };
