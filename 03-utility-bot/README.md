# 🛠️ Utility Bot

Giveaways, polls, reminders and self-assignable roles for Discord servers, built with **discord.js v14** and slash commands. It needs **no privileged intents** (Guilds only).

## Features

| Area | What it does |
|---|---|
| **Giveaways** | Embed with a "🎉 Enter" button (click again to leave) and a live entry count. Ends at the set time and announces random, unique winners. End early, reroll, or list them. Durations like `30s`, `10m`, `2h`, `1d`, `1h30m`. |
| **Polls** | One button per option (2-10), one vote per member (change it any time), live-updating result bars, closes after a set time (default 1 day), final results shown when it closes. |
| **Reminders** | `/remind in:2h message:...` pings you in the same channel, or DMs you. Max 25 active per person, up to 1 year ahead. List and cancel your own. |
| **Reaction roles** | A panel of toggle buttons (max 25 roles). Click to get or drop a role, with a private confirmation. The bot checks it can actually manage each role. |
| **Restart-proof** | Everything is saved in `data/db.json` with an end time. One scheduler checks for due items every 15 seconds, and on startup it immediately finishes anything that expired while the bot was offline. No long `setTimeout`s. |
| **Safe pings** | Every message uses `allowedMentions`, so prizes, poll text and reminder text can never ping `@everyone`, `@here` or roles. Reminders and giveaway announcements can only ping the intended users. |

## Commands

| Command | Who can use it | Description |
|---|---|---|
| `/giveaway start prize duration winners [channel]` | Manage Server | Start a giveaway (10s to 60 days, 1-20 winners) |
| `/giveaway end id` | Manage Server | End one now and pick winners |
| `/giveaway reroll id [winners]` | Manage Server | Pick new winners from people who have not won yet |
| `/giveaway list` | Manage Server | Running and recently ended giveaways |
| `/poll question options [duration]` | Everyone | Options separated by `\|`, e.g. `Pizza \| Tacos \| Sushi` |
| `/remind in message [dm]` | Everyone | Set a reminder (10s to 1 year) |
| `/reminders list` `cancel id` | Everyone | Manage your own reminders |
| `/reactionroles create title [description]` | Manage Roles | Post a role panel in this channel |
| `/reactionroles add message-id role [label] [emoji]` | Manage Roles | Add a toggle button to a panel |
| `/reactionroles remove message-id role` | Manage Roles | Remove a button from a panel |

Discord's permission system only supports one default permission per command, so giveaways default to **Manage Server**. Server admins can also open the command in **Server Settings → Integrations** to let another role (for example one with Manage Events) use it.

## Setup

**Requirements:** Node.js 20.6 or newer.

1. Create the bot in the Discord Developer Portal and invite it to your server. Step-by-step: [`../docs/discord-portal-setup.md`](../docs/discord-portal-setup.md).
   - No privileged intents are needed. Leave **Server Members Intent** and **Message Content Intent** off.
   - Invite with the `bot` and `applications.commands` scopes and these permissions: View Channels, Send Messages, Embed Links, Read Message History, Manage Roles.
2. Install and configure:
   ```bash
   npm install
   cp .env.example .env     # then open .env and fill in the 3 values
   npm run deploy           # registers the slash commands in your server
   npm start
   ```
3. In Discord, try:
   ```
   /giveaway start prize:Nitro duration:1h30m winners:1
   /poll question:Friday game night? options:Yes | No | Maybe duration:1d
   /remind in:30m message:stretch
   /reactionroles create title:Pick your roles
   /reactionroles add message-id:<id from the reply> role:@Gamer emoji:🎮
   ```
4. In **Server Settings → Roles**, drag the bot's role **above** the roles it hands out.

`npm run check` validates all commands and runs the duration-parser tests offline (no token needed). `npm run dev` restarts the bot automatically when you edit a file.

## Notes

- **Native polls:** Discord now has built-in polls (the poll button in the message box). This bot uses button polls because they can be created with a slash command, closed on a schedule the bot controls, and re-styled freely. For a plain question, the native poll is often the better choice.
- **Reaction roles use buttons, not emoji reactions**, so the bot needs no extra intents and there is no reaction event to miss while offline.
- Clicking the option you already voted for removes your vote.
- Finished giveaways are kept for 30 days (so `/giveaway reroll` works) and closed polls for 7 days, then pruned from the database.

## Project layout

```
src/
  index.js              starts the bot (Guilds intent only), loads commands + events
  deploy-commands.js    registers slash commands with Discord
  check.js              offline checks: command definitions + duration parser tests
  commands/             one file per slash command
  events/               ready (starts the scheduler), interaction router
  lib/scheduler.js      single 15s tick that runs anything that is due
  lib/duration.js       "1h30m" parser and formatter
  lib/giveaways.js      giveaway embed, entry button, end + reroll
  lib/polls.js          poll embed, vote buttons, closing
  lib/reminders.js      reminder delivery and limits
  lib/reactionroles.js  role panel buttons, role safety checks
  lib/util.js           random picks, permission checks, message helpers
  lib/store.js          JSON-file storage (data/db.json)
```

Data lives in `data/db.json`. For large servers this can be swapped for SQLite or Postgres.
