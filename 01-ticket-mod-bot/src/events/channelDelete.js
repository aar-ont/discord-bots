const { Events } = require('discord.js');
const store = require('../lib/store');

// If staff delete a ticket channel by hand, forget it so the user can open a new one.
module.exports = {
	name: Events.ChannelDelete,
	execute(channel) {
		if (!channel.guild) return;
		const data = store.guild(channel.guild.id);
		if (data.openTickets[channel.id]) {
			delete data.openTickets[channel.id];
			store.save();
		}
	},
};
