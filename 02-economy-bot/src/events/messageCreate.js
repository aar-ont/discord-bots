const { Events } = require('discord.js');
const store = require('../lib/store');
const levels = require('../lib/levels');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot || message.webhookId || message.system || !message.inGuild()) return;

		const data = store.guild(message.guildId);
		const user = store.user(data, message.author.id);
		const now = Date.now();
		if (now - user.lastXp < levels.XP_COOLDOWN_MS) return;

		// Everything up to store.save() is synchronous, so concurrent messages can't double-award.
		user.lastXp = now;
		user.xp += levels.randomXp();
		const newLevel = levels.levelFromXp(user.xp);
		const oldLevel = user.level;
		let bonus = 0;
		if (newLevel > oldLevel) {
			bonus = levels.levelUpBonus(oldLevel, newLevel);
			user.level = newLevel;
			user.coins += bonus;
		}
		store.save();
		if (newLevel <= oldLevel) return;

		const member = message.member ?? await message.guild.members.fetch(message.author.id).catch(() => null);
		const roles = member ? await levels.grantLevelRoles(member, newLevel) : [];

		let text = `🎉 ${message.author} reached **level ${newLevel}** and earned 🪙 ${bonus.toLocaleString('en-US')}!`;
		if (roles.length) text += ` New role: ${roles.map((r) => `**${r.name}**`).join(', ')}.`;

		const channelId = data.config.levelUpChannelId;
		const channel = (channelId && await message.guild.channels.fetch(channelId).catch(() => null)) || message.channel;
		await channel.send({ content: text, allowedMentions: { users: [message.author.id] } })
			.catch((err) => console.warn('[level-up]', err.message));
	},
};
