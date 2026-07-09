// /api/leaderboard — a tiny serverless endpoint backing the in-game
// leaderboard. Storage is Vercel KV (Upstash Redis under the hood),
// accessed here over plain REST so no extra npm dependency is needed.
//
// Setup (one-time, in the Vercel dashboard):
//   Project → Storage → Create Database → KV → connect it to this project.
//   Vercel automatically adds KV_REST_API_URL and KV_REST_API_TOKEN as
//   environment variables and redeploys. Nothing else to configure.
//
// Data model: a single Redis sorted set "dbj:leaderboard" where the
// member is a player label (wallet short-address) and the score is the
// best height (in meters) that player has reached. ZADD with GT+CH means
// we only ever keep each player's personal best.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const LEADERBOARD_KEY = 'dbj:leaderboard';
const MAX_SCORE = 1_000_000; // sanity ceiling, well above anything reachable legitimately

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

module.exports = async (req, res) => {
  if (!KV_URL || !KV_TOKEN) {
    res.status(500).json({
      error: 'Leaderboard storage is not configured yet. Add a Vercel KV database to this project (Storage tab) and redeploy.',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const data = await upstash(['ZRANGE', LEADERBOARD_KEY, '0', '9', 'REV', 'WITHSCORES']);
      const flat = data.result || [];
      const leaderboard = [];
      for (let i = 0; i < flat.length; i += 2) {
        leaderboard.push({ player: flat[i], score: Number(flat[i + 1]) });
      }
      res.status(200).json({ leaderboard });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const player = typeof body?.player === 'string' ? body.player.slice(0, 40) : null;
      const score = Number(body?.score);

      if (!player || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
        res.status(400).json({ error: 'invalid payload' });
        return;
      }

      // GT: only update if the new score beats the player's stored best.
      // CH: report whether the member's score actually changed.
      await upstash(['ZADD', LEADERBOARD_KEY, 'GT', 'CH', String(Math.floor(score)), player]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'leaderboard request failed' });
  }
};
