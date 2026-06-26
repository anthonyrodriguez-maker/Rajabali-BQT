import { query, initDB } from '../../lib/db';

export default async function handler(req, res) {
  try {
    await initDB();

    if (req.method === 'GET') {
      const { network, store } = req.query;
      let sql = 'SELECT * FROM visit_logs';
      const params = [];
      const conditions = [];
      if (network) { params.push(network); conditions.push(`network = $${params.length}`); }
      if (store) { params.push(store); conditions.push(`store_name = $${params.length}`); }
      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY created_at DESC';
      const result = await query(sql, params);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { store_name, network, visit_date, q3_week, focus_area, coaching_notes, progress, logged_by } = req.body;
      if (!store_name || !visit_date || !q3_week || !logged_by) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const result = await query(`
        INSERT INTO visit_logs (store_name, network, visit_date, q3_week, focus_area, coaching_notes, progress, logged_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [store_name, network, visit_date, q3_week, focus_area, coaching_notes, progress, logged_by]);
      return res.status(201).json(result.rows[0]);
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
