const { Events } = require('discord.js');
const { sendLog } = require('../lib/log');

module.exports = {
	name: Events.MessageUpdate,
	async execute(oldMessage, newMessage) {
		if (!newMessage.guild || newMessage.author?.bot) return;
		if (oldMessage.partial || oldMessage.content === newMessage.content) return; // embed loads etc.
		await sendLog(newMessage.guild, {
			title: 'Message edited',
			color: 'info',
			description: `[Jump to message](${newMessage.url})`,
			fields: [
				{ name: 'Before', value: (oldMessage.content || '*(empty)*').slice(0, 1024) },
				{ name: 'After', value: (newMessage.content || '*(empty)*').slice(0, 1024) },
				{ name: 'Author', value: `${newMessage.author}`, inline: true },
				{ name: 'Channel', value: `${newMessage.channel}`, inline: true },
			],
		});
	},
};
