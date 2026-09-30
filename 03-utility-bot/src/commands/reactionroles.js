const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { messageLink, checkCanPost } = require('../lib/util');
const { MAX_ROLES, isEmoji, buildPayload, checkRole, refreshPanel } = require('../lib/reactionroles');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reactionroles')
		.setDescription('Self-assignable role buttons')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addSubcommand((s) => s.setName('create').setDescription('Post a new role panel in this channel')
			.addStringOption((o) => o.setName('title').setDescription('Panel title').setRequired(true).setMaxLength(200))
			.addStringOption((o) => o.setName('description').setDescription('Text under the title').setMaxLength(1000)))
		.addSubcommand((s) => s.setName('add').setDescription('Add a role button to a panel')
			.addStringOption((o) => o.setName('message-id').setDescription('ID of the panel message').setRequired(true))
			.addRoleOption((o) => o.setName('role').setDescription('Role to hand out').setRequired(true))
			.addStringOption((o) => o.setName('label').setDescription('Button text (default: role name)').setMaxLength(80))
			.addStringOption((o) => o.setName('emoji').setDescription('Button emoji, e.g. 🎮')))
		.addSubcommand((s) => s.setName('remove').setDescription('Remove a role button from a panel')
			.addStringOption((o) => o.setName('message-id').setDescription('ID of the panel message').setRequired(true))
			.addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true))),

	async execute(interaction) {
		const reply = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
		const data = store.guild(interaction.guildId);
		const sub = interaction.options.getSubcommand();

		if (sub === 'create') {
			const me = await interaction.guild.members.fetchMe();
			const problem = checkCanPost(interaction.channel, me);
			if (problem) return reply(problem);
			const panel = {
				channelId: interaction.channelId,
				title: interaction.options.getString('title'),
				description: interaction.options.getString('description'),
				roles: [],
			};
			const msg = await interaction.channel.send({ ...buildPayload(panel), allowedMentions: { parse: [] } });
			data.panels[msg.id] = panel;
			store.save();
			return reply(`Panel created: ${messageLink(interaction.guildId, panel.channelId, msg.id)}\nMessage ID: \`${msg.id}\`. Now add roles with \`/reactionroles add\`.`);
		}

		const messageId = interaction.options.getString('message-id').trim();
		const panel = data.panels[messageId];
		if (!panel) return reply('I have no role panel with that message ID. Copy the ID from `/reactionroles create` (right-click the message -> Copy Message ID).');
		const role = interaction.options.getRole('role');

		if (sub === 'add') {
			const emoji = interaction.options.getString('emoji')?.trim() || null;
			if (emoji && !isEmoji(emoji)) return reply('That does not look like a single emoji. Use a normal emoji or a custom one like `<:name:123456789012345678>`.');
			if (panel.roles.some((r) => r.roleId === role.id)) return reply(`${role} is already on that panel.`);
			if (panel.roles.length >= MAX_ROLES) return reply(`A panel can hold at most ${MAX_ROLES} roles.`);
			const problem = await checkRole(interaction, role);
			if (problem) return reply(problem);

			panel.roles.push({ roleId: role.id, label: interaction.options.getString('label') ?? role.name.slice(0, 80), emoji });
			if (!(await refreshPanel(interaction.client, messageId, panel).catch(() => false))) {
				panel.roles.pop();
				return reply('I could not edit the panel message. Was it deleted, or can I not see that channel?');
			}
			store.save();
			return reply(`Added ${role} to the panel (${panel.roles.length}/${MAX_ROLES}).`);
		}

		// remove
		const i = panel.roles.findIndex((r) => r.roleId === role.id);
		if (i === -1) return reply(`${role} is not on that panel.`);
		const [removed] = panel.roles.splice(i, 1);
		if (!(await refreshPanel(interaction.client, messageId, panel).catch(() => false))) {
			panel.roles.splice(i, 0, removed);
			return reply('I could not edit the panel message. Was it deleted, or can I not see that channel?');
		}
		store.save();
		await reply(`Removed ${role} from the panel.`);
	},
};
