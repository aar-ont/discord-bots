# Discord Bots by Aaron

Portfolio of Discord bots built with **discord.js v14** and slash commands. Each folder is a standalone bot with its own README.

| Bot | Highlights | Privileged intents |
|---|---|---|
| [🎫 Ticket & Moderation](01-ticket-mod-bot) | Button + pop-up support tickets with transcripts, welcome messages, autorole, warn/timeout/kick/ban, message & mod logs | Server Members, Message Content |
| [💰 Economy & Leveling](02-economy-bot) | Chat XP & levels, level-up role rewards, coins, daily streaks, shop that sells roles, leaderboards | none |
| [🛠️ Utility](03-utility-bot) | Giveaways, button polls, reminders, button reaction roles, all restart-safe | none |

## Quick start (any bot)
```bash
cd 01-ticket-mod-bot     # or 02-economy-bot / 03-utility-bot
npm install
cp .env.example .env     # fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm run deploy           # register slash commands in your server
npm start
```
New to the Discord Developer Portal? See [docs/discord-portal-setup.md](docs/discord-portal-setup.md).

Requires Node.js 20.6+. Your bot token stays in `.env`, which is git-ignored and never shared.

**Want a custom bot?** DM me on Discord: `<your-username>`.
