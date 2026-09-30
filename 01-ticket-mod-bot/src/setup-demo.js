// One-time demo setup for a fresh test server: creates roles/channels, saves config, posts the ticket panel.
// Safe to re-run: it reuses anything that already exists by name. Stop the bot before running it.
const { ChannelType, Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const store = require('./lib/store');
const { panelMessage } = require('./lib/tickets');

const { DISCORD_TOKEN, GUILD_ID } = process.env;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
	try {
		const guild = await client.guilds.fetch(GUILD_ID);
		await guild.roles.fetch();
		await guild.channels.fetch();
		const done = [];

		const role = async (name, color) => {
			const existing = guild.roles.cache.find((r) => r.name === name);
			if (existing) return existing;
			done.push(`role @${name}`);
			return guild.roles.create({ name, colors: { primaryColor: color }, reason: 'Demo setup' });
		};
		const channel = async (name, type, options = {}) => {
			const existing = guild.channels.cache.find((c) => c.name === name && c.type === type);
			if (existing) return existing;
			done.push(`${type === ChannelType.GuildCategory ? 'category ' : 'channel #'}${name}`);
			return guild.channels.create({ name, type, reason: 'Demo setup', ...options });
		};

		const staff = await role('Staff', 0x5865f2);
		const member = await role('Member', 0x99aab5);
		const staffOnly = [
			{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
			{ id: staff.id, allow: [PermissionFlagsBits.ViewChannel] },
			{ id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
		];
		const readOnly = [
			{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
			{ id: client.user.id, allow: [PermissionFlagsBits.SendMessages] },
		];

		const logs = await channel('mod-logs', ChannelType.GuildText, { permissionOverwrites: staffOnly });
		const welcome = await channel('welcome', ChannelType.GuildText, { permissionOverwrites: readOnly });
		const support = await channel('support', ChannelType.GuildText, { permissionOverwrites: readOnly });
		const tickets = await channel('Tickets', ChannelType.GuildCategory, { permissionOverwrites: staffOnly });

		const cfg = store.guild(guild.id).config;
		Object.assign(cfg, {
			logChannelId: logs.id,
			welcomeChannelId: welcome.id,
			autoroleId: member.id,
			staffRoleId: staff.id,
			ticketCategoryId: tickets.id,
		});
		store.save();

		const recent = await support.messages.fetch({ limit: 20 });
		if (!recent.some((m) => m.author.id === client.user.id && m.components.length)) {
			await support.send(panelMessage());
			done.push('ticket panel in #support');
		}

		console.log(`Setup complete in "${guild.name}". Created: ${done.length ? done.join(', ') : 'nothing new (already set up)'}`);
		console.log('Config saved: logs, welcome, autorole @Member, ticket staff @Staff, Tickets category.');
	} catch (err) {
		console.error('Setup failed:', err.message);
		process.exitCode = 1;
	} finally {
		client.destroy();
	}
});

client.login(DISCORD_TOKEN);
