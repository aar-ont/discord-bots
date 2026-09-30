# Delivery checklist (every order)

1. **Get requirements in writing.** Features, command names, who can use what, what gets logged, colors/branding. Paste them to Claude as the spec.
2. **Quote + first payment** (see pricing-and-payments.md).
3. **Build.** Claude writes the bot, usually by copying the closest demo and changing it.
4. **Test in your own test server.** Use a second Discord account (or a friend) as a "normal member" to check permissions. Go through every command.
5. **Record a 30–60s clip** of it working. Send it to the client and collect the final payment.
6. **Deliver**, either:
   - **Code:** zip the folder *without* `node_modules`, `.env` or `data/`. Send the README and point them to `docs/discord-portal-setup.md` so they create their own bot and token.
   - **Hosting:** they invite your bot application with your invite link, and you run it on your hosting. **You never need their token or password.**
7. **Follow up after 2–3 days** ("everything working?"), then ask for a review or a vouch in the hiring server.

## Hard rules
- No self-bots, raid/nuke bots, token grabbers, mass-DM or spam tools, or anything that breaks Discord's ToS. Politely turn those down.
- Never ask for anyone's Discord password or their account token.
- Bot tokens live only in `.env`. They never go in chat, GitHub or screenshots.
