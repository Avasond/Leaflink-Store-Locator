import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const months = parseInt(req.query.months, 10);
  const interval = !isNaN(months) && months > 0 ? `${months} months` : "6 months";

  try {
    const { rows } = await pool.query(`
      SELECT customer_id
      FROM stores
      WHERE order_date < NOW() - INTERVAL '${interval}'
    `);

    const ids = rows.map(r => r.customer_id).filter(Boolean);
    res.status(200).json({ delete_ids: ids });
  } catch (err) {
    console.error("Error fetching old customers:", err);
    res.status(500).json({ error: "Failed to retrieve old customer IDs" });
  }
}