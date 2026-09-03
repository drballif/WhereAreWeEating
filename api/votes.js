const { neon } = require('@neondatabase/serverless');
const PEOPLE = new Set(['Dad','Mom','Kaycie','Scott','Madi','Skylar','Jaclyn','Justin']);
const RESTAURANTS = new Set(["Summit Pizza","Beto's","Blossom","Teriyaki grill","Zulu's","Mo Bettah's","KFC","Purple Turtle","Taco Amigos","Chick fil-A","Sushi Ya","Costa Vida","Five Guys","Freddy's","Spaghetti Factory","Italian Village","Maraca's"]);
module.exports = async (req, res) => {
  try {
    const sql = neon(process.env.POSTGRES_URL);
    await sql`CREATE TABLE IF NOT EXISTS votes (voter_name TEXT PRIMARY KEY, picks TEXT[] NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    if (req.method === 'GET') {
      const votes = await sql`SELECT voter_name AS "displayName", picks FROM votes ORDER BY created_at`;
      return res.status(200).json({votes});
    }
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed.'});
    const {displayName, picks} = req.body || {};
    if (!PEOPLE.has(displayName) || !Array.isArray(picks) || picks.length !== 3 || new Set(picks).size !== 3 || !picks.every((pick) => RESTAURANTS.has(pick))) return res.status(400).json({error: 'Choose your name and three different restaurants.'});
    const inserted = await sql`INSERT INTO votes (voter_name, picks) VALUES (${displayName}, ${picks}) ON CONFLICT (voter_name) DO NOTHING RETURNING voter_name`;
    if (!inserted.length) return res.status(409).json({error: displayName + ' has already voted this round.'});
    return res.status(201).json({ok: true});
  } catch (error) {
    console.error(error);
    return res.status(500).json({error: 'The vote store is not ready.'});
  }
};
