// ==============================
// MAP INITIALIZATION & USER LOCATION
// ==============================
mapboxgl.accessToken = "pk.eyJ1IjoiYXZhZ2F0ZXMiLCJhIjoiY205YTBqbGhjMDBmbzJtb2c1djliNXNzayJ9.UR2Vxas91qF0_4XmsofktA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/avagates/cm990hhk9004101sa7soe1h2q",
  center: [-98.5795, 39.8283],
  zoom: 4,
});

// Try to zoom to user location
navigator.geolocation.getCurrentPosition(
  (pos) => {
    map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 });
    new mapboxgl.Marker({ color: "#000" }).setLngLat([pos.coords.longitude, pos.coords.latitude]).setPopup(new mapboxgl.Popup().setText("You are here")).addTo(map);
    userLatLng = { lng: pos.coords.longitude, lat: pos.coords.latitude };
  },
  (err) => console.warn("Geolocation failed:", err.message),
  { enableHighAccuracy: true },
);

let userLatLng = map.getCenter();

// ==============================
// DATASET LOADING & STORE SORTING
// ==============================
map.on("load", () => {
  map.loadImage("img/KBpin512.png", (err, image) => {
    if (err) throw err;
    map.addImage("pin-icon", image);

    // Load dataset from Mapbox Datasets API
    fetch("https://api.mapbox.com/datasets/v1/avagates/cm9a93wlr0emz1mprurdhfgoq/features?access_token=" + mapboxgl.accessToken)
      .then((res) => res.json())
      .then((data) => {
        const sortedFeatures = data.features.slice().sort((a, b) => {
          const [lngA, latA] = a.geometry.coordinates;
          const [lngB, latB] = b.geometry.coordinates;

          const distA = Math.hypot(userLatLng.lat - latA, userLatLng.lng - lngA);
          const distB = Math.hypot(userLatLng.lat - latB, userLatLng.lng - lngB);

          return distA - distB;
        });

        // ==============================
        // SIDEBAR POPULATION
        // ==============================
        map.addSource("stores", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: sortedFeatures,
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 40,
        });
        const storeList = document.getElementById("store-list");

        sortedFeatures.forEach((feature) => {
          const { name, address } = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;

          // Add list entry
          const div = document.createElement("div");
          div.innerHTML = `<strong>${name}</strong><br><small><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank">${address}</a></small>`;
          div.onclick = () => map.flyTo({ center: [lng, lat], zoom: 14 });
          storeList.appendChild(div);
        });

        // ==============================
        // MAP LAYERS & CLUSTER STYLING
        // ==============================
        // Cluster circles
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "stores",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#CE6653",
            "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
          },
        });

        // Cluster count labels
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "stores",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "symbol",
          source: "stores",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": "pin-icon",
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              0.03, // ~15px at low zoom
              10,
              0.08, // ~40px at mid zoom
              14,
              0.12, // ~60px at close zoom
            ],
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
          },
        });

        // ==============================
        // POPUPS & INTERACTIONS
        // ==============================
        map.on("click", "unclustered-point", (e) => {
          const { name, address } = e.features[0].properties;
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${name}</strong><br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank">${address}</a>`)
            .addTo(map);
        });

        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });
          const clusterId = features[0].properties.cluster_id;
          map.getSource("stores").getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom,
            });
          });
        });

        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });
      })
      .catch((err) => console.error("Failed to load dataset:", err));
  });
});

// ==============================
// SEARCH FUNCTIONALITY
// ==============================
function searchLocation() {
  const query = document.getElementById("search-location").value;
  if (!query) return;

  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`)
    .then((res) => res.json())
    .then((data) => {
      const feature = data.features[0];
      if (feature) {
        map.flyTo({
          center: feature.center,
          zoom: 12,
        });
      } else {
        alert("Location not found.");
      }
    })
    .catch((err) => console.error("Geocoding error:", err));
}
