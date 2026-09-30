const { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { canAssignRole } = require('../lib/roles');
const { COLORS, MAX_AMOUNT, fmt, fail, findItem, itemAutocomplete } = require('../lib/economy');

const MAX_ITEMS = 25;
const MAX_LEVEL = 200;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('economy')
		.setDescription('Manage the economy, shop and level rewards')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((s) => s.setName('add-item').setDescription('Add an item to the shop')
			.addStringOption((o) => o.setName('name').setDescription('Item name').setMaxLength(32).setRequired(true))
			.addIntegerOption((o) => o.setName('price').setDescription('Price in coins').setMinValue(1).setMaxValue(MAX_AMOUNT).setRequired(true))
			.addRoleOption((o) => o.setName('role').setDescription('Role granted on purchase'))
			.addStringOption((o) => o.setName('description').setDescription('Short description').setMaxLength(200)))
		.addSubcommand((s) => s.setName('remove-item').setDescription('Remove an item from the shop')
			.addStringOption((o) => o.setName('name').setDescription('Item name').setAutocomplete(true).setRequired(true)))
		.addSubcommand((s) => s.setName('give').setDescription('Give coins to a member')
			.addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
			.addIntegerOption((o) => o.setName('amount').setDescription('Coins').setMinValue(1).setMaxValue(MAX_AMOUNT).setRequired(true)))
		.addSubcommand((s) => s.setName('take').setDescription('Take coins from a member (balance never goes below 0)')
			.addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
			.addIntegerOption((o) => o.setName('amount').setDescription('Coins').setMinValue(1).setMaxValue(MAX_AMOUNT).setRequired(true)))
		.addSubcommand((s) => s.setName('set-levelup-channel').setDescription('Where level-up messages are posted')
			.addChannelOption((o) => o.setName('channel').setDescription('Channel (leave empty to post in the same channel)').addChannelTypes(ChannelType.GuildText)))
		.addSubcommandGroup((g) => g.setName('level-role').setDescription('Roles given when members reach a level')
			.addSubcommand((s) => s.setName('add').setDescription('Give a role at a level')
				.addIntegerOption((o) => o.setName('level').setDescription('Level').setMinValue(1).setMaxValue(MAX_LEVEL).setRequired(true))
				.addRoleOption((o) => o.setName('role').setDescription('Role to give').setRequired(true)))
			.addSubcommand((s) => s.setName('remove').setDescription('Remove the reward for a level')
				.addIntegerOption((o) => o.setName('level').setDescription('Level').setMinValue(1).setMaxValue(MAX_LEVEL).setRequired(true)))
			.addSubcommand((s) => s.setName('list').setDescription('List level rewards'))),

	autocomplete: itemAutocomplete,

	async execute(interaction) {
		const data = store.guild(interaction.guildId);
		const group = interaction.options.getSubcommandGroup(false);
		const sub = interaction.options.getSubcommand();
		let reply;

		if (group === 'level-role') {
			const rewards = data.config.levelRoles;
			if (sub === 'list') {
				const lines = Object.entries(rewards).sort((a, b) => a[0] - b[0]).map(([lvl, id]) => `Level **${lvl}** -> <@&${id}>`);
				const embed = new EmbedBuilder().setTitle('Level role rewards').setColor(COLORS.info).setDescription(lines.join('\n') || '*none set*');
				return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}
			const level = interaction.options.getInteger('level', true);
			if (sub === 'add') {
				const role = interaction.options.getRole('role', true);
				const problem = canAssignRole(interaction.guild, role);
				if (problem) return fail(interaction, problem);
				rewards[level] = role.id;
				reply = `Members reaching level ${level} will get ${role}.`;
			} else {
				if (!rewards[level]) return fail(interaction, `There is no reward for level ${level}.`);
				delete rewards[level];
				reply = `Removed the level ${level} reward.`;
			}
		} else if (sub === 'add-item') {
			const name = interaction.options.getString('name', true).trim();
			const role = interaction.options.getRole('role');
			if (!name) return fail(interaction, 'Give the item a name.');
			if (findItem(data, name)) return fail(interaction, `An item named **${name}** already exists.`);
			if (data.shop.length >= MAX_ITEMS) return fail(interaction, `The shop is full (${MAX_ITEMS} items). Remove one first.`);
			if (role) {
				const problem = canAssignRole(interaction.guild, role);
				if (problem) return fail(interaction, problem);
			}
			const price = interaction.options.getInteger('price', true);
			data.shop.push({
				id: String(data.nextItemId++),
				name,
				price,
				roleId: role?.id ?? null,
				description: interaction.options.getString('description') ?? '',
			});
			reply = `Added **${name}** for ${fmt(price)}${role ? `, granting ${role}` : ''}.`;
		} else if (sub === 'remove-item') {
			const item = findItem(data, interaction.options.getString('name', true));
			if (!item) return fail(interaction, 'No such item.');
			data.shop = data.shop.filter((i) => i.id !== item.id);
			reply = `Removed **${item.name}** from the shop. Members keep any copies they already own.`;
		} else if (sub === 'give' || sub === 'take') {
			const target = interaction.options.getUser('user', true);
			if (target.bot) return fail(interaction, 'Bots do not have wallets.');
			const amount = interaction.options.getInteger('amount', true);
			const u = store.user(data, target.id);
			if (sub === 'give') {
				u.coins = Math.min(u.coins + amount, Number.MAX_SAFE_INTEGER);
				reply = `Gave ${fmt(amount)} to ${target}. New balance: ${fmt(u.coins)}.`;
			} else {
				const taken = Math.min(amount, u.coins);
				u.coins -= taken;
				reply = `Took ${fmt(taken)} from ${target}. New balance: ${fmt(u.coins)}.`;
			}
		} else if (sub === 'set-levelup-channel') {
			const channel = interaction.options.getChannel('channel');
			data.config.levelUpChannelId = channel?.id ?? null;
			reply = channel ? `Level-up messages will go to ${channel}.` : 'Level-up messages will be posted in the channel where the member is chatting.';
		}

		store.save();
		await interaction.reply({ content: `✅ ${reply}`, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
	},
};
