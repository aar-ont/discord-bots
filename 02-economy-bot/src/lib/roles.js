const { PermissionFlagsBits } = require('discord.js');

// Returns an error message if the bot can't assign `role`, otherwise null.
function canAssignRole(guild, role) {
	const me = guild.members.me;
	if (role.id === guild.id) return "You can't use @everyone.";
	if (role.managed) return `${role} is managed by an integration and can't be assigned.`;
	if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) return 'I need the **Manage Roles** permission first.';
	if (role.position >= me.roles.highest.position) {
		return `I can't give ${role} - drag my role above it in Server Settings -> Roles first.`;
	}
	return null;
}

module.exports = { canAssignRole };
