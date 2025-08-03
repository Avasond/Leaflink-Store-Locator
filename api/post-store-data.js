import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") return res.status(405).end();
  
  res.setHeader("Content-Type", "application/json");

  const { customer_id, name, address, city, state, zipcode, lat, lng, order_date } = req.body;

  const latFloat = lat ? parseFloat(lat) : null;
  const lngFloat = lng ? parseFloat(lng) : null;

  console.log("Incoming payload:", {
    customer_id,
    name,
    address,
    city,
    state,
    zipcode,
    lat: latFloat,
    lng: lngFloat,
    order_date
  });

  try {
    await pool.query(
      `
        INSERT INTO stores (
          customer_id, name, address, lat, lng, city, state, zip_code, order_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (customer_id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip_code = EXCLUDED.zip_code,
          order_date = EXCLUDED.order_date
      `,
      [customer_id, name, address, latFloat, lngFloat, city, state, zipcode, order_date]
    );

    console.log("Executed INSERT/UPDATE for customer_id:", customer_id);

    res.status(200).json({ success: true });
  } 
  catch (err) {
    console.error("DB Error Stack:", err.stack || err);
    console.error("DB Error Message:", err.message || err);
    console.error("Full Error Object:", JSON.stringify(err, null, 2));
    res.status(500).json({ error: "DB insert failed" });
  }
}