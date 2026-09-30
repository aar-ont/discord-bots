const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const store = require('./store');
const scheduler = require('./scheduler');
const { timestamp, fetchMessage } = require('./util');

const KEEP_CLOSED_MS = 7 * 86_400_000;
const BAR_WIDTH = 12;

function bar(fraction) {
	const filled = Math.round(fraction * BAR_WIDTH);
	return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

function tally(p) {
	const counts = p.options.map(() => 0);
	for (const idx of Object.values(p.votes)) counts[idx] += 1;
	return counts;
}

function buildEmbed(p) {
	const counts = tally(p);
	const total = counts.reduce((a, b) => a + b, 0);
	const top = Math.max(...counts);
	const lines = p.options.map((opt, i) => {
		const pct = total ? Math.round((counts[i] / total) * 100) : 0;
		const crown = p.closed && total && counts[i] === top ? ' 🏆' : '';
		return `**${i + 1}. ${opt}**${crown}\n${bar(total ? counts[i] / total : 0)} ${pct}% (${counts[i]})`;
	});
	const footer = p.closed ? `Poll #${p.id} closed - ${total} vote${total === 1 ? '' : 's'}` : `Poll #${p.id} - ${total} vote${total === 1 ? '' : 's'}`;
	const embed = new EmbedBuilder()
		.setTitle(`📊 ${p.question}`)
		.setColor(p.closed ? 0x95a5a6 : 0x5865f2)
		.setDescription(lines.join('\n\n'))
		.setFooter({ text: footer });
	if (p.closed) embed.addFields({ name: 'Final results', value: `Closed ${timestamp(p.closedAt)}` });
	else if (p.endsAt) embed.addFields({ name: 'Closes', value: timestamp(p.endsAt) });
	else embed.addFields({ name: 'Closes', value: 'No end time' });
	return embed;
}

function buildRows(p) {
	const rows = [];
	for (let i = 0; i < p.options.length; i += 5) {
		rows.push(new ActionRowBuilder().addComponents(
			p.options.slice(i, i + 5).map((opt, j) => new ButtonBuilder()
				.setCustomId(`poll:vote:${p.id}:${i + j}`)
				.setLabel(`${i + j + 1}. ${opt}`.slice(0, 80))
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(p.closed)),
		));
	}
	return rows;
}

const messagePayload = (p) => ({ embeds: [buildEmbed(p)], components: buildRows(p) });

// Marks the poll closed and persists BEFORE any network call.
async function closePoll(client, p) {
	if (p.closed) return;
	p.closed = true;
	p.closedAt = Date.now();
	store.save();
	const msg = await fetchMessage(client, p.channelId, p.messageId);
	if (msg) await msg.edit(messagePayload(p)).catch((err) => console.error(`[poll #${p.id}] edit failed:`, err.message));
}

// One vote per user. Clicking another option moves the vote; clicking the same one removes it.
async function handleButton(interaction) {
	const [, action, rawId, rawIdx] = interaction.customId.split(':');
	const p = store.guild(interaction.guildId).polls[rawId];
	if (action !== 'vote') return;
	if (!p || p.closed) return interaction.reply({ content: 'This poll is closed.', flags: MessageFlags.Ephemeral });
	const idx = Number(rawIdx);
	if (!Number.isInteger(idx) || idx < 0 || idx >= p.options.length) return;

	const uid = interaction.user.id;
	let note;
	if (p.votes[uid] === idx) {
		delete p.votes[uid];
		note = 'Your vote was removed.';
	} else {
		note = p.votes[uid] === undefined ? `Voted for **${p.options[idx]}**.` : `Vote changed to **${p.options[idx]}**.`;
		p.votes[uid] = idx;
	}
	store.save();
	await interaction.update(messagePayload(p));
	await interaction.followUp({ content: `🗳️ ${note}`, flags: MessageFlags.Ephemeral });
}

scheduler.register('polls', {
	isDue: (p, now) => !p.closed && p.endsAt && p.endsAt <= now,
	run: (client, guildId, p) => closePoll(client, p),
	prune: (p, now) => p.closed && now - p.closedAt > KEEP_CLOSED_MS,
});

module.exports = { messagePayload, closePoll, handleButton };
