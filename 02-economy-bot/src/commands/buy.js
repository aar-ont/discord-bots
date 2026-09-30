const { SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { canAssignRole } = require('../lib/roles');
const { fmt, fail, findItem, itemAutocomplete } = require('../lib/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buy')
		.setDescription('Buy an item from the shop')
		.addStringOption((o) => o.setName('item').setDescription('Item name').setAutocomplete(true).setRequired(true)),

	autocomplete: itemAutocomplete,

	async execute(interaction) {
		const data = store.guild(interaction.guildId);
		const item = findItem(data, interaction.options.getString('item', true));
		if (!item) return fail(interaction, 'No such item. See `/shop`.');

		const u = store.user(data, interaction.user.id);
		if (u.coins < item.price) return fail(interaction, `That costs ${fmt(item.price)} and you have ${fmt(u.coins)}.`);

		let roleNote = '';
		if (item.roleId) {
			const role = interaction.guild.roles.cache.get(item.roleId);
			if (!role) return fail(interaction, 'The role for this item no longer exists. Ask an admin to fix the item.');
			if (interaction.member.roles.cache.has(role.id)) return fail(interaction, `You already have ${role}, so you weren't charged.`);
			const problem = canAssignRole(interaction.guild, role);
			if (problem) return fail(interaction, `${problem} You weren't charged.`);
			// Give the role before taking coins, so a failure never costs the buyer anything.
			await interaction.member.roles.add(role, `Bought "${item.name}"`);
			roleNote = ` You now have ${role}.`;
		}

		// Re-check after the await above; the balance may have changed meanwhile.
		if (u.coins < item.price) {
			if (item.roleId) await interaction.member.roles.remove(item.roleId).catch(() => {});
			return fail(interaction, 'Your balance changed while buying. Try again.');
		}
		u.coins -= item.price;
		u.inventory[item.id] ??= { name: item.name, qty: 0 };
		u.inventory[item.id].qty += 1;
		store.save();
		await interaction.reply({ content: `🛒 You bought **${item.name}** for ${fmt(item.price)}.${roleNote}\nBalance: ${fmt(u.coins)}`, allowedMentions: { parse: [] } });
	},
};
