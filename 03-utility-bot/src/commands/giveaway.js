const { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const store = require('../lib/store');
const { resolveDuration } = require('../lib/duration');
const { messageLink, timestamp, checkCanPost } = require('../lib/util');
const { messagePayload, endGiveaway, rerollGiveaway } = require('../lib/giveaways');

const MIN_MS = 10_000;
const MAX_MS = 60 * 86_400_000;
const MAX_ACTIVE = 25;
const reply = (interaction, content) => interaction.reply({ content, flags: MessageFlags.Ephemeral });

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giveaway')
		.setDescription('Run giveaways')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((s) => s.setName('start').setDescription('Start a giveaway')
			.addStringOption((o) => o.setName('prize').setDescription('What is being given away').setRequired(true).setMaxLength(200))
			.addStringOption((o) => o.setName('duration').setDescription('e.g. 30s, 10m, 2h, 1d, 1h30m').setRequired(true))
			.addIntegerOption((o) => o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20))
			.addChannelOption((o) => o.setName('channel').setDescription('Where to post it (default: here)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
		.addSubcommand((s) => s.setName('end').setDescription('End a giveaway right now')
			.addIntegerOption((o) => o.setName('id').setDescription('Giveaway id (see /giveaway list)').setRequired(true).setMinValue(1)))
		.addSubcommand((s) => s.setName('reroll').setDescription('Pick new winners for an ended giveaway')
			.addIntegerOption((o) => o.setName('id').setDescription('Giveaway id').setRequired(true).setMinValue(1))
			.addIntegerOption((o) => o.setName('winners').setDescription('How many (default: original count)').setMinValue(1).setMaxValue(20)))
		.addSubcommand((s) => s.setName('list').setDescription('Show running and recent giveaways')),

	async execute(interaction) {
		// Manage Server is the default gate; servers can also let Manage Events holders in via Integrations settings.
		const perms = interaction.memberPermissions;
		if (!perms.has(PermissionFlagsBits.ManageGuild) && !perms.has(PermissionFlagsBits.ManageEvents)) {
			return reply(interaction, 'You need the Manage Server or Manage Events permission.');
		}
		const data = store.guild(interaction.guildId);
		const sub = interaction.options.getSubcommand();

		if (sub === 'start') {
			const { ms, error } = resolveDuration(interaction.options.getString('duration'), { min: MIN_MS, max: MAX_MS });
			if (error) return reply(interaction, error);
			if (Object.values(data.giveaways).filter((g) => !g.ended).length >= MAX_ACTIVE) {
				return reply(interaction, `This server already has ${MAX_ACTIVE} running giveaways.`);
			}
			const channel = interaction.options.getChannel('channel') ?? interaction.channel;
			const me = await interaction.guild.members.fetchMe();
			const problem = checkCanPost(channel, me);
			if (problem) return reply(interaction, problem);

			const g = {
				id: store.nextId(data, 'giveaway'),
				channelId: channel.id,
				messageId: null,
				prize: interaction.options.getString('prize'),
				hostId: interaction.user.id,
				winnerCount: interaction.options.getInteger('winners'),
				endsAt: Date.now() + ms,
				entrants: [],
				ended: false,
				winners: [],
			};
			const msg = await channel.send({ ...messagePayload(g), allowedMentions: { parse: [] } });
			g.messageId = msg.id;
			data.giveaways[g.id] = g;
			store.save();
			return reply(interaction, `🎉 Giveaway #${g.id} started in ${channel}: ${messageLink(interaction.guildId, channel.id, msg.id)}`);
		}

		if (sub === 'list') {
			const items = Object.values(data.giveaways).sort((a, b) => b.id - a.id);
			if (!items.length) return reply(interaction, 'No giveaways yet. Start one with `/giveaway start`.');
			const line = (g) => {
				const link = `[jump](${messageLink(interaction.guildId, g.channelId, g.messageId)})`;
				return g.ended
					? `**#${g.id}** ${g.prize} - ended, ${g.entrants.length} entries - ${link}`
					: `**#${g.id}** ${g.prize} - ends ${timestamp(g.endsAt)}, ${g.entrants.length} entries - ${link}`;
			};
			const active = items.filter((g) => !g.ended).slice(0, 15).map(line);
			const ended = items.filter((g) => g.ended).slice(0, 5).map(line);
			const embed = new EmbedBuilder().setTitle('Giveaways').setColor(0xf1c40f);
			embed.addFields(
				{ name: 'Running', value: active.join('\n') || '*none*' },
				{ name: 'Recently ended', value: ended.join('\n') || '*none*' },
			);
			return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		const g = data.giveaways[interaction.options.getInteger('id')];
		if (!g) return reply(interaction, 'No giveaway with that id. Use `/giveaway list`.');

		if (sub === 'end') {
			if (g.ended) return reply(interaction, 'That giveaway already ended. Use `/giveaway reroll` to pick new winners.');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			await endGiveaway(interaction.client, g);
			return interaction.editReply(`Giveaway #${g.id} ended.`);
		}

		// reroll
		if (!g.ended) return reply(interaction, 'That giveaway is still running. End it first with `/giveaway end`.');
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const ok = await rerollGiveaway(interaction.client, g, interaction.options.getInteger('winners') ?? g.winnerCount);
		await interaction.editReply(ok ? `Rerolled giveaway #${g.id}.` : 'There is nobody left to pick: everyone who entered has already won.');
	},
};
