// Shared helpers for the economy commands.
const { MessageFlags } = require('discord.js');

const COIN = '🪙';
const COLORS = { info: 0x5865f2, good: 0x57f287, warn: 0xfee75c, bad: 0xed4245 };
const MAX_AMOUNT = 1_000_000_000; // hard cap on any single amount so coins stay safe integers

const fmt = (n) => `${COIN} ${n.toLocaleString('en-US')}`;
const unix = (ms) => Math.floor(ms / 1000);
const fail = (interaction, content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

// Milliseconds left on a cooldown (0 when ready).
const cooldownLeft = (last, durationMs) => Math.max(0, last + durationMs - Date.now());

const findItem = (guildData, name) => guildData.shop.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());

// Autocomplete for options that take a shop item name.
async function itemAutocomplete(interaction) {
	const store = require('./store');
	const typed = interaction.options.getFocused().toLowerCase();
	const items = store.guild(interaction.guildId).shop
		.filter((i) => i.name.toLowerCase().includes(typed))
		.slice(0, 25);
	await interaction.respond(items.map((i) => ({ name: `${i.name} (${i.price.toLocaleString('en-US')} coins)`.slice(0, 100), value: i.name })));
}

module.exports = { COIN, COLORS, MAX_AMOUNT, fmt, unix, fail, cooldownLeft, findItem, itemAutocomplete };
