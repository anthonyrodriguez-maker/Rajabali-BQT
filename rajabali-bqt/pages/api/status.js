import { query, initDB } from '../../lib/db';

export default async function handler(req, res) {
  try {
    await initDB();

    if (req.method === 'GET') {
      const result = await query('SELECT * FROM store_status');
      const map = {};
      result.rows.forEach(r => {
        map[r.store_name] = {
          status: r.status,
          opsComplete: r.ops_complete,
          planSubmitted: r.plan_submitted,
        };
      });
      return res.status(200).json(map);
    }

    if (req.method === 'POST') {
      const { store_name, status, ops_complete, plan_submitted } = req.body;
      await query(`
        INSERT INTO store_status (store_name, status, ops_complete, plan_submitted, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (store_name) DO UPDATE
        SET status = EXCLUDED.status,
            ops_complete = EXCLUDED.ops_complete,
            plan_submitted = EXCLUDED.plan_submitted,
            updated_at = NOW()
      `, [store_name, status, ops_complete, plan_submitted]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
