# 🪙 Economy & Leveling Bot

A chat-XP, coins and shop bot for Discord servers, built with **discord.js v14** and slash commands. Members level up by chatting, earn coins, and spend them in a server shop that can hand out roles.

## Features

| Area | What it does |
|---|---|
| **XP & levels** | 15-25 XP per message with a 60-second cooldown per member (bots and DMs ignored). MEE6-style curve: XP to next level = `5·L² + 50·L + 100`. Level-up message in the same channel, or a channel you pick. |
| **Level role rewards** | Admins map levels to roles; the role is given automatically on level-up (and catches up if several levels are gained at once). |
| **Coins** | Whole-number coins only. Level-ups pay a bonus (25 × the new level), plus `/daily` with a streak bonus, `/work` with random jobs, and `/pay` between members. |
| **Shop & inventory** | Admin-defined items with a price, description and optional role granted on purchase. Name autocomplete on `/buy`. Roles are given before coins are taken, so a failed purchase never costs anything. |
| **Leaderboards** | `/rank` shows level, rank position and a text progress bar. `/leaderboard` shows XP or coin rankings, 10 per page, with Prev/Next buttons. |
| **Coin flip** | Bet virtual coins (max 1,000) on heads or tails. Coins have no real-world value and cannot be bought or cashed out. |

## Commands

| Command | Who can use it | Description |
|---|---|---|
| `/rank [user]` | Everyone | Level, XP progress bar and rank position |
| `/leaderboard type:xp\|coins` | Everyone | Paginated top members |
| `/balance [user]` | Everyone | Coin balance |
| `/daily` | Everyone | 100 coins every 24h, +20 per streak day (up to +200) |
| `/work` | Everyone | 20-120 coins, 1 hour cooldown |
| `/pay user amount` | Everyone | Send coins to another member |
| `/shop` | Everyone | List shop items |
| `/buy item` | Everyone | Buy an item (may grant a role) |
| `/inventory [user]` | Everyone | Show owned items |
| `/coinflip amount choice` | Everyone | Heads or tails, bet 1-1,000 coins |
| `/economy add-item name price [role] [description]` | Manage Server | Add a shop item |
| `/economy remove-item name` | Manage Server | Remove a shop item |
| `/economy give\|take user amount` | Manage Server | Adjust a balance (never goes below 0) |
| `/economy set-levelup-channel [channel]` | Manage Server | Where level-up messages go (empty = same channel) |
| `/economy level-role add\|remove\|list` | Manage Server | Manage role rewards per level |

## Setup

**Requirements:** Node.js 20.6 or newer.

1. Create the bot in the Discord Developer Portal and invite it to your server. Step-by-step: [`../docs/discord-portal-setup.md`](../docs/discord-portal-setup.md).
   - No privileged intents are needed. The bot only uses the **Guilds** and **Guild Messages** intents, and it never reads message text. Leave **Server Members Intent** and **Message Content Intent** off.
   - Invite it with the **Manage Roles**, **Send Messages** and **Embed Links** permissions.
2. Install and configure:
   ```bash
   npm install
   cp .env.example .env     # then open .env and fill in the 3 values
   npm run deploy           # registers the slash commands in your server
   npm start
   ```
3. In Discord, run:
   ```
   /economy set-levelup-channel channel:#level-ups
   /economy level-role add level:5 role:@Regular
   /economy add-item name:VIP price:2000 role:@VIP description:Shiny VIP role
   ```
4. In **Server Settings → Roles**, drag the bot's role **above** every role used for level rewards or shop items. The bot refuses to save a reward or item it can't assign.

`npm run check` validates all commands offline (no token needed). `npm run dev` restarts the bot automatically when you edit a file.

## Project layout

```
src/
  index.js              starts the bot, loads commands + events
  deploy-commands.js    registers slash commands with Discord
  check.js              offline validation of commands and events
  commands/             one file per slash command
  events/               XP on messageCreate, interaction router (commands, autocomplete, buttons)
  lib/levels.js         level math, XP rolls, level-up bonus and role rewards
  lib/economy.js        coin formatting, cooldown and shop helpers
  lib/leaderboard.js    ranking + paginated leaderboard buttons
  lib/roles.js          "can the bot assign this role?" check
  lib/store.js          JSON-file storage (data/db.json)
```

Data lives in `data/db.json` (per server: settings, member records, shop). For large servers this can be swapped for SQLite or Postgres.
