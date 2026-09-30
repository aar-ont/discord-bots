const { Events } = require('discord.js');
const { sendLog } = require('../lib/log');

module.exports = {
	name: Events.MessageDelete,
	async execute(message) {
		if (!message.guild || message.author?.bot) return;
		// Messages sent before the bot started aren't cached, so their content is unknown.
		const content = message.partial ? '*(message was not cached)*' : message.content || '*(no text)*';
		await sendLog(message.guild, {
			title: 'Message deleted',
			color: 'bad',
			description: content,
			fields: [
				{ name: 'Author', value: message.author ? `${message.author}` : 'unknown', inline: true },
				{ name: 'Channel', value: `${message.channel}`, inline: true },
			],
		});
	},
};
