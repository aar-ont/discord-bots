// Parses durations like "30s", "10m", "2h", "1d", "1w" and combos such as "1h30m".
const UNITS = { w: 604_800_000, d: 86_400_000, h: 3_600_000, m: 60_000, s: 1000 };

function parseDuration(input) {
	if (typeof input !== 'string') return null;
	const s = input.toLowerCase().replace(/\s+/g, '');
	if (!/^(\d+[wdhms])+$/.test(s)) return null;
	let total = 0;
	for (const [, n, unit] of s.matchAll(/(\d+)([wdhms])/g)) total += Number(n) * UNITS[unit];
	return Number.isSafeInteger(total) && total > 0 ? total : null;
}

// 5400000 -> "1h 30m"
function formatDuration(ms) {
	let s = Math.round(ms / 1000);
	const parts = [];
	for (const [label, size] of [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]) {
		const n = Math.floor(s / size);
		if (n) parts.push(`${n}${label}`);
		s -= n * size;
	}
	return parts.join(' ') || '0s';
}

// Parse + range check in one go. Returns { ms } or { error } (a message safe to show the user).
function resolveDuration(input, { min, max }) {
	const ms = parseDuration(input);
	if (ms === null) return { error: 'I could not read that duration. Try `30s`, `10m`, `2h`, `1d` or `1h30m`.' };
	if (ms < min) return { error: `The duration must be at least ${formatDuration(min)}.` };
	if (ms > max) return { error: `The duration can be at most ${formatDuration(max)}.` };
	return { ms };
}

module.exports = { parseDuration, formatDuration, resolveDuration };
