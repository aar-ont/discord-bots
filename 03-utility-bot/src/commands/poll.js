const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { resolveDuration } = require('../lib/duration');
const { checkCanPost } = require('../lib/util');
const { messagePayload } = require('../lib/polls');

const MIN_MS = 10_000;
const MAX_MS = 30 * 86_400_000;
const MAX_OPEN = 25;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Create a button poll')
		.addStringOption((o) => o.setName('question').setDescription('What are you asking?').setRequired(true).setMaxLength(200))
		.addStringOption((o) => o.setName('options').setDescription('2-10 choices separated by |  e.g. Pizza | Tacos | Sushi').setRequired(true).setMaxLength(1000))
		.addStringOption((o) => o.setName('duration').setDescription('Closes after e.g. 30m, 2h, 1d (default 1d)')),

	async execute(interaction) {
		const reply = (content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });
		const options = interaction.options.getString('options').split('|').map((s) => s.trim()).filter(Boolean);
		if (options.length < 2 || options.length > 10) return reply('Give me between 2 and 10 options, separated by `|`.');
		if (options.some((o) => o.length > 70)) return reply('Each option can be at most 70 characters.');
		if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return reply('Options must be different from each other.');

		const { ms, error } = resolveDuration(interaction.options.getString('duration') ?? '1d', { min: MIN_MS, max: MAX_MS });
		if (error) return reply(error);
		const endsAt = Date.now() + ms;

		const data = store.guild(interaction.guildId);
		if (Object.values(data.polls).filter((p) => !p.closed).length >= MAX_OPEN) {
			return reply(`This server already has ${MAX_OPEN} open polls.`);
		}
		const me = await interaction.guild.members.fetchMe();
		const problem = checkCanPost(interaction.channel, me);
		if (problem) return reply(problem);

		const p = {
			id: store.nextId(data, 'poll'),
			channelId: interaction.channelId,
			messageId: null,
			question: interaction.options.getString('question'),
			options,
			votes: {}, // userId -> option index
			authorId: interaction.user.id,
			endsAt,
			closed: false,
		};
		// Reply publicly so the poll appears as the command's response; no pings are allowed in it.
		const response = await interaction.reply({ ...messagePayload(p), allowedMentions: { parse: [] }, withResponse: true });
		p.messageId = response.resource.message.id;
		data.polls[p.id] = p;
		store.save();
	},
};
