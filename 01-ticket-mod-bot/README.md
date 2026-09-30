# 🎫 Ticket & Moderation Bot

An all-in-one support and moderation bot for Discord servers, built with **discord.js v14** and slash commands.

## Features

| Area | What it does |
|---|---|
| **Support tickets** | "Open ticket" button → member types their issue in a pop-up → private channel only they and staff can see. Close button with confirmation. A full **text transcript** goes to the log channel. One open ticket per member. |
| **Welcome + autorole** | Custom welcome message (`{user}`, `{server}`, `{count}`) and a role given to every new member automatically. |
| **Moderation** | `/warn`, `/warnings list/clear`, `/timeout`, `/kick`, `/ban`, `/unban`, `/purge`. Role-hierarchy checks stop mods from punishing people above them. Punished users get a DM. |
| **Logging** | Joins, leaves, deleted and edited messages, every mod action, and ticket open/close, all sent to one log channel. |

## Commands

| Command | Who can use it | Description |
|---|---|---|
| `/config logs` `welcome` `autorole` `tickets` `show` | Manage Server | Set up the bot |
| `/ticketpanel [channel]` | Manage Server | Post the "Open ticket" button |
| `/warn user reason` | Moderate Members | Warn + DM + log |
| `/warnings list\|clear user` | Moderate Members | View/clear warnings |
| `/timeout user minutes [reason]` | Moderate Members | Mute (0 = remove) |
| `/kick user [reason]` | Kick Members | Kick |
| `/ban user [reason] [delete-days]` | Ban Members | Ban, even if they already left |
| `/unban user-id` | Ban Members | Unban |
| `/purge amount [user]` | Manage Messages | Bulk-delete up to 100 messages |

## Setup

**Requirements:** Node.js 20.6 or newer.

1. Create the bot in the Discord Developer Portal and invite it to your server. Step-by-step: [`../docs/discord-portal-setup.md`](../docs/discord-portal-setup.md).
   - Turn on **Server Members Intent** and **Message Content Intent** (Bot tab).
2. Install and configure:
   ```bash
   npm install
   cp .env.example .env     # then open .env and fill in the 3 values
   npm run deploy           # registers the slash commands in your server
   npm start
   ```
3. In Discord, run:
   ```
   /config logs channel:#mod-logs
   /config welcome channel:#welcome
   /config autorole role:@Member
   /config tickets staff-role:@Staff category:Tickets
   /ticketpanel channel:#support
   ```
4. In **Server Settings → Roles**, drag the bot's role **above** the roles it gives out or moderates.

`npm run check` validates all commands offline (no token needed). `npm run dev` restarts the bot automatically when you edit a file.

## Project layout

```
src/
  index.js              starts the bot, loads commands + events
  deploy-commands.js    registers slash commands with Discord
  commands/             one file per slash command
  events/               welcome/autorole, logging, interaction router
  lib/tickets.js        ticket buttons, modal, channel creation, transcripts
  lib/store.js          JSON-file storage (data/db.json)
  lib/modcheck.js       role-hierarchy safety checks
  lib/log.js            log-channel embeds
```

Data lives in `data/db.json`. For large servers this can be swapped for SQLite or Postgres.
