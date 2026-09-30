const { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');

const DEFAULT_WELCOME = 'Welcome {user} to **{server}**! You are member #{count}.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Set up the bot for this server')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((s) => s.setName('logs').setDescription('Channel for mod/ticket/message logs')
			.addChannelOption((o) => o.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
		.addSubcommand((s) => s.setName('welcome').setDescription('Welcome new members')
			.addChannelOption((o) => o.setName('channel').setDescription('Welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
			.addStringOption((o) => o.setName('message').setDescription('Use {user}, {server}, {count}').setMaxLength(1000)))
		.addSubcommand((s) => s.setName('autorole').setDescription('Role given to every new member')
			.addRoleOption((o) => o.setName('role').setDescription('Role to give (leave empty to turn off)')))
		.addSubcommand((s) => s.setName('tickets').setDescription('Where tickets go and who can see them')
			.addRoleOption((o) => o.setName('staff-role').setDescription('Role that can see all tickets').setRequired(true))
			.addChannelOption((o) => o.setName('category').setDescription('Category for ticket channels').addChannelTypes(ChannelType.GuildCategory)))
		.addSubcommand((s) => s.setName('show').setDescription('Show the current settings')),

	async execute(interaction) {
		const data = store.guild(interaction.guildId);
		const cfg = data.config;
		const sub = interaction.options.getSubcommand();
		let reply;

		if (sub === 'logs') {
			cfg.logChannelId = interaction.options.getChannel('channel').id;
			reply = `Logs will go to <#${cfg.logChannelId}>.`;
		} else if (sub === 'welcome') {
			cfg.welcomeChannelId = interaction.options.getChannel('channel').id;
			cfg.welcomeMessage = interaction.options.getString('message') ?? DEFAULT_WELCOME;
			reply = `Welcome messages will go to <#${cfg.welcomeChannelId}>.`;
		} else if (sub === 'autorole') {
			const role = interaction.options.getRole('role');
			if (role && role.position >= interaction.guild.members.me.roles.highest.position) {
				return interaction.reply({ content: `I can't give ${role} - drag my role above it in Server Settings -> Roles first.`, flags: MessageFlags.Ephemeral });
			}
			cfg.autoroleId = role?.id ?? null;
			reply = role ? `New members will get ${role}.` : 'Autorole turned off.';
		} else if (sub === 'tickets') {
			cfg.staffRoleId = interaction.options.getRole('staff-role').id;
			cfg.ticketCategoryId = interaction.options.getChannel('category')?.id ?? null;
			reply = `Ticket staff role: <@&${cfg.staffRoleId}>. Now run \`/ticketpanel\` in the channel where members should open tickets.`;
		} else {
			const show = (id, fmt) => (id ? fmt(id) : '*not set*');
			const embed = new EmbedBuilder()
				.setTitle('Server settings')
				.setColor(0x5865f2)
				.addFields(
					{ name: 'Log channel', value: show(cfg.logChannelId, (id) => `<#${id}>`), inline: true },
					{ name: 'Welcome channel', value: show(cfg.welcomeChannelId, (id) => `<#${id}>`), inline: true },
					{ name: 'Autorole', value: show(cfg.autoroleId, (id) => `<@&${id}>`), inline: true },
					{ name: 'Ticket staff', value: show(cfg.staffRoleId, (id) => `<@&${id}>`), inline: true },
					{ name: 'Ticket category', value: show(cfg.ticketCategoryId, (id) => `<#${id}>`), inline: true },
					{ name: 'Tickets opened', value: String(data.ticketCount), inline: true },
					{ name: 'Welcome message', value: cfg.welcomeMessage ?? DEFAULT_WELCOME },
				);
			return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		store.save();
		await interaction.reply({ content: `✅ ${reply}`, flags: MessageFlags.Ephemeral });
	},
	DEFAULT_WELCOME,
};
