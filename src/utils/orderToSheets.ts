import cron from "node-cron";
import fetch from "node-fetch";
import Order from "../models/Order";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";

// Run every hour
cron.schedule("0 * * * *", async () => {
  try {
    console.log("⏳ Syncing orders to Google Sheet...");

    // Fetch orders from DB
    const orders = await Order.findAll({
      attributes: [
        "id",
        "order_amount",
        "order_status",
        "created_at",
        "updated_at",
        "schedule_at",
        "picked_up",
        "delivered",
        "reached_delivery_timestamp",
        "canceled",
        "distance",
        "promised_duration",
      ],
      raw: true,
    });

    // Transform into array of arrays for Google Sheet
    const rows = orders.map((o: any) => [
      o.id,
      o.order_amount,
      o.order_status,
      new Date(Number(o.created_at)).toISOString(),
      new Date(Number(o.updated_at)).toISOString(),
      o.schedule_at ? new Date(Number(o.schedule_at)).toISOString() : "",
      o.picked_up ? new Date(Number(o.picked_up)).toISOString() : "",
      o.delivered ? new Date(Number(o.delivered)).toISOString() : "",
      o.reached_delivery_timestamp
        ? new Date(Number(o.reached_delivery_timestamp)).toISOString()
        : "",
      o.canceled ? new Date(Number(o.canceled)).toISOString() : "",
      o.distance,
      o.promised_duration || "",
    ]);

    // Send to Apps Script webhook
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    const result = await resp.json();
    console.log("✅ Sync result:", result);
  } catch (err) {
    console.error("❌ Error syncing orders:", err);
  }
});
