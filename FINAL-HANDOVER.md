# FoodBridge — Final Hackathon Handover

This package is the consolidated version. Use this ZIP instead of the earlier Step 1/Step 2 packages.

## Included fixes
- Real MongoDB-backed food donation, available-food and request synchronization.
- Signup email OTP verification with brute-force attempt protection.
- Public admin signup blocked.
- Admin password reset protected by `ADMIN_SETUP_SECRET`.
- Donation input validation for quantity and prepared/expiry times.
- Donation cancellation keeps requests/pickups consistent.
- Approved receiver requests automatically create an unassigned pickup.
- Volunteer pickup acceptance is atomic to avoid two volunteers claiming one pickup.
- Delivery OTP uses cryptographically secure random generation.
- Impact/notification data no longer starts from fake demo records.
- Donation dashboard counters use actual data instead of hard-coded numbers.
- Frontend donation cancellation uses the backend API.
- Configurable frontend API base and CORS origin support.
- Backend `/health` endpoint and JSON 404 response.
- Removed editor swap/backup/temp artifacts from the handover package.

## Setup
1. Open `FoodBridge-Backend` in a terminal.
2. Copy `.env.example` to `.env`.
3. Put your real `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and `PORT` in `.env`.
4. Set a strong `ADMIN_SETUP_SECRET` if the admin setup endpoint is used.
5. Run `npm install` and then `npm run dev`.
6. Open the `FoodBridge` frontend.

Do not commit or share `.env`; it contains secrets.

## Final end-to-end test
Signup → OTP → Login → Donor posts food → Receiver requests → Donor approves → Pickup appears → Volunteer accepts → Picked Up → In Transit → Delivery OTP → Delivered → Impact/notifications update.

## Local development CORS fix
The backend allows the common Live Server origins on ports 3000 and 5500 in addition to FRONTEND_ORIGIN, so the frontend can run from `127.0.0.1:3000` without a CORS connection error.

## Main Admin Setup
- Public signup does NOT contain an Admin role.
- Admin login remains available on `login.html`.
- The single main admin email is fixed to `janvixaarush@gmail.com`.
- The admin account is provisioned through the private `/api/admin-setup/provision-main` endpoint using the existing `ADMIN_SETUP_SECRET` from the backend `.env`.
- The endpoint refuses a different email and refuses to create a second admin while another admin exists.
- The dedicated admin dashboard is `admin-dashboard.html` and reads users, restaurant food posts, NGO requests and volunteer pickups directly from MongoDB through `/api/admin/dashboard`.
- Admin dashboard refreshes automatically every 15 seconds and has a manual Refresh button.
- Do not put the admin password in frontend files or commit `.env` to GitHub.
