// Level math (MEE6-style curve) and level-up rewards.
const store = require('./store');
const { canAssignRole } = require('./roles');

const XP_MIN = 15;
const XP_MAX = 25;
const XP_COOLDOWN_MS = 60_000;
const LEVEL_UP_BONUS_PER_LEVEL = 25; // coins = 25 * the level you just reached

// XP needed to go from level L to L + 1.
const xpToNext = (L) => 5 * L * L + 50 * L + 100;

// Total XP needed to reach level L from 0.
function totalXpForLevel(L) {
	let total = 0;
	for (let i = 0; i < L; i++) total += xpToNext(i);
	return total;
}

function levelFromXp(xp) {
	let level = 0;
	let remaining = xp;
	while (remaining >= xpToNext(level)) remaining -= xpToNext(level++);
	return level;
}

// Progress inside the current level: { level, current, needed }.
function progress(xp) {
	const level = levelFromXp(xp);
	return { level, current: xp - totalXpForLevel(level), needed: xpToNext(level) };
}

const randomXp = () => XP_MIN + Math.floor(Math.random() * (XP_MAX - XP_MIN + 1));

// Sum of the coin bonuses for every level in (from, to].
function levelUpBonus(from, to) {
	let coins = 0;
	for (let l = from + 1; l <= to; l++) coins += LEVEL_UP_BONUS_PER_LEVEL * l;
	return coins;
}

// Gives every configured role reward at or below `level` that the member doesn't have yet.
// Returns the roles actually granted. Never throws.
async function grantLevelRoles(member, level) {
	const rewards = store.guild(member.guild.id).config.levelRoles;
	const granted = [];
	for (const [reqLevel, roleId] of Object.entries(rewards)) {
		if (Number(reqLevel) > level || member.roles.cache.has(roleId)) continue;
		const role = member.guild.roles.cache.get(roleId);
		if (!role || canAssignRole(member.guild, role)) continue; // deleted role, or bot can't manage it
		try {
			await member.roles.add(role, `Level ${reqLevel} reward`);
			granted.push(role);
		} catch (err) {
			console.warn('[level role]', err.message);
		}
	}
	return granted;
}

module.exports = {
	XP_COOLDOWN_MS, xpToNext, totalXpForLevel, levelFromXp, progress, randomXp, levelUpBonus, grantLevelRoles,
};
