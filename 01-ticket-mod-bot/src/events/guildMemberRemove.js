const { Events } = require('discord.js');
const { sendLog } = require('../lib/log');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member) {
		await sendLog(member.guild, { title: 'Member left', color: 'bad', description: `${member.user.username} (${member.id})` });
	},
};
