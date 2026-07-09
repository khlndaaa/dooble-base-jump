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
