const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const store = require('./store');
const { COLORS, fmt } = require('./economy');

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

// Sorted [userId, record] pairs for the given board ('xp' or 'coins'), zero scores left out.
function ranked(guildId, type) {
	return Object.entries(store.guild(guildId).users)
		.filter(([, u]) => u[type] > 0)
		.sort((a, b) => b[1][type] - a[1][type]);
}

// Builds the page. State lives in the button IDs ("lb:<type>:<page>:<invokerId>"), so it survives restarts.
function buildPage(guildId, type, page, invokerId) {
	const rows = ranked(guildId, type);
	const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	page = Math.min(Math.max(0, page), pages - 1);
	const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	const lines = slice.map(([id, u], i) => {
		const pos = page * PAGE_SIZE + i;
		const badge = MEDALS[pos] ?? `**${pos + 1}.**`;
		const score = type === 'xp' ? `Level ${u.level} - ${u.xp.toLocaleString('en-US')} XP` : fmt(u.coins);
		return `${badge} <@${id}> - ${score}`;
	});

	const embed = new EmbedBuilder()
		.setTitle(type === 'xp' ? 'XP leaderboard' : 'Richest members')
		.setColor(COLORS.info)
		.setDescription(lines.join('\n') || 'Nobody on the board yet. Start chatting!')
		.setFooter({ text: `Page ${page + 1} of ${pages}` });
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId(`lb:${type}:${page - 1}:${invokerId}`).setLabel('Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
		new ButtonBuilder().setCustomId(`lb:${type}:${page + 1}:${invokerId}`).setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(page >= pages - 1),
	);
	return { embeds: [embed], components: [row] };
}

async function onButton(interaction) {
	const [, type, page, invokerId] = interaction.customId.split(':');
	if (interaction.user.id !== invokerId) {
		return interaction.reply({ content: 'Run `/leaderboard` yourself to page through it.', flags: MessageFlags.Ephemeral });
	}
	if (type !== 'xp' && type !== 'coins') return;
	await interaction.update(buildPage(interaction.guildId, type, Number(page), invokerId));
}

module.exports = { ranked, buildPage, onButton };
