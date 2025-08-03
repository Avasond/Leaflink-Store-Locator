# Leaflink Store Locator

This repository contains a store locator that retrieves verified dispensary locations, enriches them, and visualizes them on a map.

- **LeafLink API** to collect verified dispensary locations
- **Neon** for storing customer and order data
- **Mapbox** for geolocation and map visualization
- **Postman + GitHub Actions** to automate data collection, enrichment, and cleanup

## 🔗 Live Deployment

View the live store locator:
https://kb-storelocator.vercel.app

## 🛠 Features

- Collects LeafLink customer and order data across multiple states
- Geocodes addresses and syncs them to Mapbox Datasets
- Pushes all enriched data to both Neon and Mapbox
- Automatically cleans up outdated Mapbox data based on Neon timestamps
- Fully automated via GitHub Actions + Postman collections

## 🧪 Tests

Use Postman to simulate individual steps or run complete workflows. The repo includes:
- `leaflink.postman_collection.json` – full data pipeline
- `leaflink_cleanup.postman_collection.json` – cleans stale locations from Mapbox

## ⚙️ Deployment

Deployment is handled automatically by [Vercel](https://vercel.com), and GitHub Actions keeps the dataset fresh.

---

For questions or contributions, reach out via GitHub.
