# Backend

Express API for the layoff tracker.

Includes:
- `/api/layoffs` CRUD and filtering
- Summary and aggregation stats
- Company detail endpoints
- Alert subscription endpoints
- Admin login and scraper controls

Run locally:

```bash
cd backend
npm install
npm run dev
```

Environment variables:
- `PORT`
- `JWT_SECRET`
- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`
