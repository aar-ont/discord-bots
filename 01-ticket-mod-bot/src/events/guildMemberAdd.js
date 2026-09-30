const { Events } = require('discord.js');
const store = require('../lib/store');
const { sendLog } = require('../lib/log');
const { DEFAULT_WELCOME } = require('../commands/config');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		const cfg = store.guild(member.guild.id).config;

		if (cfg.autoroleId) {
			await member.roles.add(cfg.autoroleId, 'Autorole').catch((err) => console.warn('[autorole]', err.message));
		}

		if (cfg.welcomeChannelId) {
			const text = (cfg.welcomeMessage ?? DEFAULT_WELCOME)
				.replaceAll('{user}', `${member}`)
				.replaceAll('{server}', member.guild.name)
				.replaceAll('{count}', String(member.guild.memberCount));
			const channel = await member.guild.channels.fetch(cfg.welcomeChannelId).catch(() => null);
			await channel?.send({ content: text, allowedMentions: { users: [member.id] } }).catch(() => {});
		}

		await sendLog(member.guild, {
			title: 'Member joined',
			color: 'good',
			description: `${member} (${member.user.username})\nAccount created <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
		});
	},
};
