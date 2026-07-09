# Dooble Base Jump — game (no token yet)

A clean version of the game: a Doodle Jump-style platformer, ready to run
as a Farcaster/Base Mini App, with zero blockchain code. Token and reward
logic can be added later as a separate step (a ready-made contract exists
in a previous iteration of this project).

```
dbj-game/
  index.html                  # the whole game — HTML/CSS/JS in one file
  .well-known/farcaster.json  # Mini App manifest
```

## Run it locally

```bash
cd dbj-game
python3 -m http.server 8080
# open http://localhost:8080
```

## Leaderboard setup (Vercel KV)

The game now has a "🏆 Leaderboard" button and auto-saves your score at
the end of each run. This is backed by a tiny serverless function
(`api/leaderboard.js`) that needs a Redis-compatible store behind it —
Vercel's own **KV** product, which is free on the Hobby plan for this
kind of usage.

One-time setup, no code changes needed:
1. Open your project on vercel.com → **Storage** tab
2. **Create Database** → **KV** → give it any name → connect it to this project
3. Vercel automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   as environment variables and triggers a redeploy
4. That's it — `/api/leaderboard` will start working once that redeploy finishes

Until you do this, the leaderboard button will show "Leaderboard not set
up yet" instead of erroring out — the rest of the game is unaffected.

**What "player" means right now:** each entry is the connected wallet's
short address (e.g. `0xAb12…9F3d`). If someone plays without connecting
a wallet, their score isn't saved — the game just shows a prompt to
connect first. There's no anti-cheat on the submitted score yet (a
determined person could POST a fake number directly to the API) — fine
for a casual leaderboard, but don't wire real money to these numbers
without adding server-side score verification first.

## Wallet connection

The "Connect Base Wallet" button is **read-only** — it just requests the
connected address (via the Farcaster Mini App wallet when running inside
Base App/Warpcast, or `window.ethereum` in a regular browser) and tries
to switch the wallet to Base mainnet for display purposes. It never
requests a signature or sends a transaction, so there's no gas cost and
nothing to approve beyond "share my address."

## Deploy (fastest path — Vercel)

1. Push this folder to a GitHub repo (or drag-and-drop it straight into Vercel — no git required for that path).
2. Go to https://vercel.com → New Project → Import your repo → Deploy.
   No build settings needed, this is a static HTML site.
3. Vercel gives you a domain like `dooble-base-jump.vercel.app` with HTTPS out of the box.
4. In `index.html` (the `fc:miniapp` meta tag) and in `.well-known/farcaster.json`,
   replace every `YOUR_DOMAIN` with your real domain.
5. Redeploy (Vercel does this automatically on every git push, or you can
   trigger it manually with the "Redeploy" button).
6. Confirm that `https://your-domain/.well-known/farcaster.json` actually
   loads in a browser — without this, Base App/Farcaster won't recognize
   the app as a Mini App.

## Connecting to Base App / Farcaster

1. Open Warpcast → Settings → Developer Tools → Manifest Tool
   (naming may vary slightly depending on the current Warpcast version —
   look for "Mini App Manifest" under Developer Tools).
2. Enter your domain; the tool generates `accountAssociation`
   (`header`/`payload`/`signature`) — paste those values into
   `.well-known/farcaster.json` in place of `REPLACE_WITH_YOUR_HEADER`, etc.
3. Redeploy once more with the final manifest.
4. Post a link to your domain in Farcaster — it should unfurl as a Mini App
   card with a "🕹️ Play Dooble Base Jump" button.

## Bringing the token back later

A previous iteration of this project already has:
- `DoobleBaseJumpToken.sol` — the DBJ ERC-20, fixed 1B supply
- `GameRewards.sol` — claim logic with a 1.5x hold-boost, a daily cap,
  and an anti-sybil approach built around Farcaster FIDs

Just ask to wire that functionality back into this clean version of the
game whenever you're ready to deploy the contracts.
