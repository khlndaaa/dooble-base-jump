// /api/leaderboard — a tiny serverless endpoint backing the in-game
// leaderboard. Storage is Vercel KV (Upstash Redis under the hood),
// accessed here over plain REST so no extra npm dependency is needed.
//
// Setup (one-time, in the Vercel dashboard):
//   Project → Storage → Create Database → KV → connect it to this project.
//   Vercel automatically adds KV_REST_API_URL and KV_REST_API_TOKEN as
//   environment variables and redeploys. Nothing else to configure.
//
// Data model: two kinds of Redis sorted sets.
//   - "dbj:leaderboard:{day}" — Daily Challenge scores for that UTC day
//     only, since every player gets the same platform layout that day
//     and results are directly comparable.
//   - "dbj:leaderboard" (all-time) — best score ever per player label,
//     from either Daily Challenge or Endless runs (same as before this
//     feature existed, kept for continuity).
// ZADD with GT+CH means we only ever keep each player's personal best
// in a given set.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const ALLTIME_KEY = 'dbj:leaderboard';
const MAX_SCORE = 1_000_000; // sanity ceiling, well above anything reachable legitimately

function dailyKey(day) { return `dbj:leaderboard:${day}`; }
function todayUTCString() {
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}

async function upstash(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Upstash request failed: ${res.status}`);
  }
  return res.json();
}

// Runs multiple Redis commands in a single HTTP round-trip instead of
// one request per command. Matters at scale: with many people
// submitting scores at once, halving the number of outbound requests
// per submission meaningfully cuts both latency and the total request
// volume hitting Upstash/Vercel under concurrent load.
async function upstashPipeline(commands) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    throw new Error(`Upstash pipeline request failed: ${res.status}`);
  }
  return res.json();
}

module.exports = async (req, res) => {
  if (!KV_URL || !KV_TOKEN) {
    res.status(500).json({
      error: 'Leaderboard storage is not configured yet. Add a Vercel KV database to this project (Storage tab) and redeploy.',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const scope = req.query?.scope;
      const day = req.query?.day || todayUTCString();
      const key = scope === 'alltime' ? ALLTIME_KEY : dailyKey(day);

      const data = await upstash(['ZRANGE', key, '0', '9', 'REV', 'WITHSCORES']);
      const flat = data.result || [];
      const leaderboard = [];
      for (let i = 0; i < flat.length; i += 2) {
        leaderboard.push({ player: flat[i], score: Number(flat[i + 1]) });
      }
      res.status(200).json({ leaderboard, day, scope: scope === 'alltime' ? 'alltime' : 'daily' });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const player = typeof body?.player === 'string' ? body.player.slice(0, 40) : null;
      const score = Number(body?.score);
      const day = typeof body?.day === 'string' ? body.day : null; // only set for Daily Challenge runs

      if (!player || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
        res.status(400).json({ error: 'invalid payload' });
        return;
      }

      // GT: only update if the new score beats the player's stored best.
      // CH: report whether the member's score actually changed.
      const commands = [['ZADD', ALLTIME_KEY, 'GT', 'CH', String(Math.floor(score)), player]];
      if (day) commands.unshift(['ZADD', dailyKey(day), 'GT', 'CH', String(Math.floor(score)), player]);
      await upstashPipeline(commands);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'leaderboard request failed' });
  }
};
