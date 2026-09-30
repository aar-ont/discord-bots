# Creating a bot in the Discord Developer Portal

You only need to do this once per bot. Use a **test server** you own and never test on a client's live server first.

## 0. Make a test server + turn on Developer Mode
1. In Discord, click **+** in the server list → **Create My Own** → "For me and my friends". Name it something like `Aaron's Bot Lab`.
2. **User Settings → Advanced → Developer Mode: ON.** Now you can right-click anything and choose **Copy ID**.
3. Right-click your server icon → **Copy Server ID**. That's your `GUILD_ID`.

## 1. Create the application
1. Go to https://discord.com/developers/applications and log in.
2. **New Application** → name it (e.g. `TicketBot Demo`) → accept the Developer ToS → **Create**.
3. On **General Information**, copy the **Application ID**. That's your `CLIENT_ID`. You can also set an icon and description here, which looks good in demo videos.

## 2. Set up the bot user
1. Left sidebar → **Bot**.
2. Under **Privileged Gateway Intents**, turn on the ones the bot needs:
   - Ticket/mod bot: **Server Members Intent** + **Message Content Intent**
   - Economy bot: none required (it counts messages without reading them)
   - Utility bot: none required
   - Click **Save Changes**.
3. Optional: turn **Public Bot** OFF so only you can invite it while testing.
4. Click **Reset Token** → copy it → paste it straight into the bot's `.env` file as `DISCORD_TOKEN=...`.
   - Treat the token like a password. Anyone who has it controls the bot.
   - Never paste it into chat (including Claude), GitHub, screenshots or videos.
   - If it ever leaks, click **Reset Token** again right away. The old one stops working.

## 3. Invite the bot to your test server
1. Left sidebar → **OAuth2** → **OAuth2 URL Generator**.
2. **Scopes:** tick `bot` and `applications.commands`.
3. **Bot Permissions:** tick the ones the bot needs.
   - Ticket/mod bot: Manage Roles, Manage Channels, Kick Members, Ban Members, Moderate Members, Manage Messages, View Channels, Send Messages, Embed Links, Attach Files, Read Message History
   - For quick testing in your *own* lab server, **Administrator** is fine. For real clients, use the specific list, because buyers trust it more.
4. Copy the generated URL at the bottom, open it in your browser, pick your test server → **Authorize**.
5. The bot now shows up (offline) in your member list. It goes online when you run `npm start`.

## 4. Run it
```bash
cd 01-ticket-mod-bot
npm install
cp .env.example .env    # fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm run deploy
npm start
```
You should see `Logged in as TicketBot Demo#1234`. Type `/` in your server to see the commands.

## Common problems
| Problem | Fix |
|---|---|
| `Used disallowed intents` | Turn on the privileged intents in step 2.2 |
| `Missing Access` on deploy | Re-invite with the `applications.commands` scope |
| Commands don't show up | Run `npm run deploy` again, then press Ctrl+R in Discord |
| `Missing Permissions` when giving roles or banning | Drag the bot's role higher in Server Settings → Roles |
| `An invalid token was provided` | Reset the token and paste it again with no spaces or quotes |

## Delivering to a client
- **Handing over code:** the client makes their *own* application (steps 1–3) and puts their own token in `.env`. You never need their token or their Discord password.
- **You host it:** they invite *your* bot application using the invite link you send them. Again, no password needed.
