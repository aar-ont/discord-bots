const {
	ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder,
	MessageFlags, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const store = require('./store');
const { sendLog, COLORS } = require('./log');

function panelMessage() {
	const embed = new EmbedBuilder()
		.setTitle('Need help?')
		.setDescription('Click the button below to open a private support ticket with the staff team.')
		.setColor(COLORS.info);
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('ticket:open').setLabel('Open ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary),
	);
	return { embeds: [embed], components: [row] };
}

// Button on the panel -> ask for a reason in a modal.
async function onOpenButton(interaction) {
	const data = store.guild(interaction.guildId);
	const existing = Object.entries(data.openTickets).find(([, t]) => t.userId === interaction.user.id);
	if (existing) {
		return interaction.reply({ content: `You already have an open ticket: <#${existing[0]}>`, flags: MessageFlags.Ephemeral });
	}
	const modal = new ModalBuilder().setCustomId('ticket:modal').setTitle('Open a ticket');
	modal.addComponents(new ActionRowBuilder().addComponents(
		new TextInputBuilder()
			.setCustomId('reason')
			.setLabel('What do you need help with?')
			.setStyle(TextInputStyle.Paragraph)
			.setMaxLength(1000)
			.setRequired(true),
	));
	await interaction.showModal(modal);
}

// Modal submitted -> create the private channel.
async function onModalSubmit(interaction) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const { guild, user } = interaction;
	const data = store.guild(guild.id);
	const { ticketCategoryId, staffRoleId } = data.config;
	const reason = interaction.fields.getTextInputValue('reason');

	data.ticketCount += 1;
	const number = data.ticketCount;

	const overwrites = [
		{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
		{
			id: user.id,
			allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
		},
		{
			id: interaction.client.user.id,
			allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
		},
	];
	if (staffRoleId) {
		overwrites.push({
			id: staffRoleId,
			allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
		});
	}

	const channel = await guild.channels.create({
		name: `ticket-${String(number).padStart(4, '0')}`,
		type: ChannelType.GuildText,
		parent: ticketCategoryId ?? null,
		topic: `Ticket #${number} opened by ${user.username} (${user.id})`,
		permissionOverwrites: overwrites,
	});

	data.openTickets[channel.id] = { userId: user.id, number, reason, openedAt: Date.now() };
	store.save();

	const embed = new EmbedBuilder()
		.setTitle(`Ticket #${number}`)
		.setDescription(`${user}, thanks for reaching out! Staff will be with you shortly.`)
		.addFields({ name: 'Reason', value: reason })
		.setColor(COLORS.good);
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('ticket:close').setLabel('Close ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
	);
	await channel.send({
		content: staffRoleId ? `${user} <@&${staffRoleId}>` : `${user}`,
		embeds: [embed],
		components: [row],
		allowedMentions: { users: [user.id], roles: staffRoleId ? [staffRoleId] : [] },
	});

	await interaction.editReply(`Your ticket is open: ${channel}`);
	await sendLog(guild, {
		title: 'Ticket opened',
		color: 'good',
		fields: [
			{ name: 'Ticket', value: `#${number} (${channel} · ${channel.name})`, inline: true },
			{ name: 'User', value: `${user} (${user.id})`, inline: true },
			{ name: 'Reason', value: reason.slice(0, 1024) },
		],
	});
}

async function onCloseButton(interaction) {
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('ticket:close-confirm').setLabel('Yes, close it').setStyle(ButtonStyle.Danger),
		new ButtonBuilder().setCustomId('ticket:close-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
	);
	await interaction.reply({ content: 'Close this ticket? A transcript will be saved to the log channel.', components: [row] });
}

async function fetchAllMessages(channel, max = 1000) {
	const out = [];
	let before;
	while (out.length < max) {
		const batch = await channel.messages.fetch({ limit: 100, before });
		if (!batch.size) break;
		out.push(...batch.values());
		before = batch.last().id;
	}
	return out.reverse();
}

async function onCloseConfirm(interaction) {
	const { channel, guild, user } = interaction;
	const data = store.guild(guild.id);
	const ticket = data.openTickets[channel.id];
	if (!ticket) return interaction.update({ content: 'This is not an open ticket channel.', components: [] });

	await interaction.update({ content: `Closing ticket... (closed by ${user})`, components: [] });

	const messages = await fetchAllMessages(channel);
	const lines = messages.map((m) => {
		const time = new Date(m.createdTimestamp).toISOString().replace('T', ' ').slice(0, 19);
		const attachments = [...m.attachments.values()].map((a) => ` [attachment: ${a.url}]`).join('');
		const embeds = m.embeds.map((e) => ` [embed: ${[e.title, e.description].filter(Boolean).join(' - ')}]`).join('');
		return `[${time} UTC] ${m.author.username}: ${m.cleanContent}${attachments}${embeds}`;
	});
	const header = `Ticket #${ticket.number} | opened by ${ticket.userId} | reason: ${ticket.reason}\n${'-'.repeat(60)}\n`;
	const file = new AttachmentBuilder(Buffer.from(header + lines.join('\n')), { name: `ticket-${ticket.number}.txt` });

	await sendLog(guild, {
		title: 'Ticket closed',
		color: 'bad',
		fields: [
			{ name: 'Ticket', value: `#${ticket.number}`, inline: true },
			{ name: 'Opened by', value: `<@${ticket.userId}>`, inline: true },
			{ name: 'Closed by', value: `${user}`, inline: true },
			{ name: 'Messages', value: String(messages.length), inline: true },
		],
		files: [file],
	});

	delete data.openTickets[channel.id];
	store.save();
	setTimeout(() => channel.delete(`Ticket closed by ${user.username}`).catch(() => {}), 3000);
}

async function onCloseCancel(interaction) {
	await interaction.update({ content: 'Close cancelled.', components: [] });
}

// Routes every button/modal whose customId starts with "ticket:".
const handlers = {
	'ticket:open': onOpenButton,
	'ticket:modal': onModalSubmit,
	'ticket:close': onCloseButton,
	'ticket:close-confirm': onCloseConfirm,
	'ticket:close-cancel': onCloseCancel,
};

module.exports = { panelMessage, handlers };
