// Offline sanity check: loads every command/event, validates command definitions, and unit-tests the duration parser. No token needed.
const assert = require('node:assert/strict');
const { loadDir } = require('./lib/loader');
const { parseDuration, formatDuration, resolveDuration } = require('./lib/duration');

const commands = loadDir('commands');
for (const c of commands) c.data.toJSON();
const events = loadDir('events');
for (const e of events) if (!e.name || typeof e.execute !== 'function') throw new Error(`Bad event module: ${JSON.stringify(e)}`);

// Duration parser
const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;
const good = { '30s': 30 * S, '10m': 10 * M, '2h': 2 * H, '1d': D, '1w': 7 * D, '1h30m': H + 30 * M, '1d 12h': D + 12 * H, ' 5M ': 5 * M, '2h30m15s': 2 * H + 30 * M + 15 * S };
for (const [input, ms] of Object.entries(good)) assert.equal(parseDuration(input), ms, `parseDuration(${JSON.stringify(input)})`);
for (const bad of ['', '30', 'abc', '10x', 'm10', '-5m', '1.5h', '0s', '1h30', '99999999999999999999d', null, undefined]) {
	assert.equal(parseDuration(bad), null, `parseDuration(${JSON.stringify(bad)}) should be null`);
}
assert.equal(formatDuration(H + 30 * M), '1h 30m');
assert.equal(formatDuration(D + S), '1d 1s');
assert.ok(resolveDuration('5s', { min: 10 * S, max: D }).error);
assert.ok(resolveDuration('2d', { min: 10 * S, max: D }).error);
assert.equal(resolveDuration('1h', { min: 10 * S, max: D }).ms, H);

console.log(`OK: ${commands.length} commands (${commands.map((c) => '/' + c.data.name).join(' ')}), ${events.length} events, duration parser tests passed`);
