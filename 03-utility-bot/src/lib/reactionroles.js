const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const store = require('./store');
const { fetchMessage } = require('./util');

const MAX_ROLES = 25; // 5 rows x 5 buttons

// Unicode emoji or a custom emoji like <:name:123456789012345678>
const EMOJI_RE = /^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}\p{Emoji_Modifier}]*|<a?:\w{2,32}:\d{17,20}>)$/u;
const isEmoji = (s) => EMOJI_RE.test(s);

function buildPayload(panel) {
	const embed = new EmbedBuilder().setTitle(panel.title).setColor(0x5865f2);
	const list = panel.roles.map((r) => `${r.emoji ? `${r.emoji} ` : ''}<@&${r.roleId}>`).join('\n');
	embed.setDescription([panel.description, list || '*No roles yet. Add some with `/reactionroles add`.*'].filter(Boolean).join('\n\n'));
	embed.setFooter({ text: 'Click a button to add or remove a role' });

	const rows = [];
	for (let i = 0; i < panel.roles.length; i += 5) {
		rows.push(new ActionRowBuilder().addComponents(panel.roles.slice(i, i + 5).map((r) => {
			const b = new ButtonBuilder().setCustomId(`rr:toggle:${r.roleId}`).setLabel(r.label).setStyle(ButtonStyle.Secondary);
			if (r.emoji) b.setEmoji(r.emoji);
			return b;
		})));
	}
	return { embeds: [embed], components: rows };
}

// Returns an error string if the bot (and the admin setting it up) is not allowed to hand out this role, else null.
async function checkRole(interaction, role) {
	if (role.id === interaction.guildId) return 'The @everyone role cannot be used.';
	if (role.managed) return `${role} is managed by an integration or bot and cannot be assigned manually.`;
	const me = await interaction.guild.members.fetchMe();
	if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) return 'I need the **Manage Roles** permission.';
	if (role.position >= me.roles.highest.position) {
		return `I can't hand out ${role}: drag my role above it in Server Settings -> Roles first.`;
	}
	// Stop admins with Manage Roles from creating a button that grants a role above their own.
	if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
		return `You can't add ${role} because it is at or above your own highest role.`;
	}
	return null;
}

// Re-render the panel message from stored state.
async function refreshPanel(client, messageId, panel) {
	const msg = await fetchMessage(client, panel.channelId, messageId);
	if (!msg) return false;
	await msg.edit(buildPayload(panel));
	return true;
}

// Button click: toggle the role and confirm privately.
async function handleButton(interaction) {
	const [, action, roleId] = interaction.customId.split(':');
	if (action !== 'toggle') return;
	const panel = store.guild(interaction.guildId).panels[interaction.message.id];
	if (!panel || !panel.roles.some((r) => r.roleId === roleId)) {
		return interaction.reply({ content: 'This role button is no longer active.', flags: MessageFlags.Ephemeral });
	}
	const role = interaction.guild.roles.cache.get(roleId);
	if (!role) return interaction.reply({ content: 'That role no longer exists.', flags: MessageFlags.Ephemeral });

	const me = await interaction.guild.members.fetchMe();
	if (role.managed || role.position >= me.roles.highest.position || !me.permissions.has(PermissionFlagsBits.ManageRoles)) {
		return interaction.reply({ content: `I can't manage ${role} right now. Ask an admin to check my role position.`, flags: MessageFlags.Ephemeral });
	}

	const member = interaction.member;
	if (member.roles.cache.has(roleId)) {
		await member.roles.remove(roleId, 'Reaction role panel');
		await interaction.reply({ content: `➖ Removed ${role}.`, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
	} else {
		await member.roles.add(roleId, 'Reaction role panel');
		await interaction.reply({ content: `➕ You now have ${role}.`, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
	}
}

module.exports = { MAX_ROLES, isEmoji, buildPayload, checkRole, refreshPanel, handleButton };
