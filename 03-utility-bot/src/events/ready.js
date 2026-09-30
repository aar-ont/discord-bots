const { Events } = require('discord.js');
const scheduler = require('../lib/scheduler');
// Loading these registers each feature with the scheduler.
require('../lib/giveaways');
require('../lib/polls');
require('../lib/reminders');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Logged in as ${client.user.tag} - serving ${client.guilds.cache.size} server(s)`);
		// First pass immediately: ends giveaways/polls and delivers reminders that came due while offline.
		scheduler.start(client);
	},
};
