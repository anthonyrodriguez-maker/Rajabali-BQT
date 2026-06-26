import { query, initDB } from '../../lib/db';

export default async function handler(req, res) {
  try {
    await initDB();

    if (req.method === 'GET') {
      const result = await query('SELECT * FROM visit_tracker');
      const map = {};
      result.rows.forEach(r => {
        if (!map[r.store_name]) map[r.store_name] = {};
        map[r.store_name][r.week_number] = r.completed;
      });
      return res.status(200).json(map);
    }

    if (req.method === 'POST') {
      const { store_name, week_number, completed } = req.body;
      if (completed) {
        await query(`
          INSERT INTO visit_tracker (store_name, week_number, completed, completed_at)
          VALUES ($1, $2, TRUE, NOW())
          ON CONFLICT (store_name, week_number) DO UPDATE SET completed = TRUE, completed_at = NOW()
        `, [store_name, week_number]);
      } else {
        await query('DELETE FROM visit_tracker WHERE store_name = $1 AND week_number = $2', [store_name, week_number]);
      }
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
