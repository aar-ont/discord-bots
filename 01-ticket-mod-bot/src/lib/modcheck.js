// Returns an error message if the invoker may not moderate `target`, otherwise null.
function checkHierarchy(interaction, target, action) {
	const { member: mod, guild } = interaction;
	if (!target) return null; // user isn't in the server (e.g. banning by ID) - nothing to compare
	if (target.id === mod.id) return `You can't ${action} yourself.`;
	if (target.id === guild.ownerId) return `You can't ${action} the server owner.`;
	if (target.id === interaction.client.user.id) return `Nice try.`;
	if (mod.id !== guild.ownerId && target.roles.highest.position >= mod.roles.highest.position) {
		return `You can't ${action} someone with an equal or higher role than you.`;
	}
	const botCan = { ban: target.bannable, kick: target.kickable, timeout: target.moderatable, warn: true };
	if (!botCan[action]) return `I can't ${action} that member - move my role above theirs in Server Settings -> Roles.`;
	return null;
}

module.exports = { checkHierarchy };
