# FoodBridge – Live Location & Delivery Map

## What was added
- Leaflet + OpenStreetMap maps (no Google Maps API key/billing required).
- Restaurant/Donor can use browser **Current Location** or enter a real pickup address.
- NGO/Receiver can use browser **Current Location** or enter its service/delivery location during signup.
- Locations are saved as latitude/longitude in MongoDB.
- Every donation stores pickup coordinates.
- When a donor approves an NGO request, the pickup is automatically created with:
  - pickup address + coordinates
  - receiver/delivery address + coordinates
- Volunteer pickup screen shows both pickup and delivery locations.
- Volunteer gets a **Map** button that opens the Leaflet delivery route.
- Delivery map also provides an OpenStreetMap driving-route link.

## Important
- Browser location permission is required when using **Use Current Location**.
- If a user types an address instead, FoodBridge uses the free OpenStreetMap Nominatim geocoder to convert it to coordinates.
- Nominatim is community infrastructure and is rate-limited; normal hackathon/demo usage should be kept light.
- `.env` is intentionally not included. Copy `.env.example` to `.env` and add your own secrets.
