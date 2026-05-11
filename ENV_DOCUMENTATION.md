# Environment Variables Documentation

## Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | The absolute URL of the NestJS backend (e.g. `http://localhost:3001` for local dev) |
| `NEXT_PUBLIC_WS_URL` | Yes | The absolute WebSocket URL for Socket.io (e.g. `http://localhost:3001`) |

## Backend (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (defaults to 3001) |
| `DATABASE_URL` | Yes | Postgres connection string |
| `REDIS_URL` | Yes | Redis connection string for Socket.io adapter and queues |
| `JWT_SECRET` | Yes | Secure 64-char string for signing session tokens |
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary account name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API Secret |
| `BREVO_API_KEY` | Yes | Brevo (Sendinblue) API key for transactional emails |
| `FRONTEND_URL` | Yes | Used for generating CORS policies and password reset links (e.g. `http://localhost:3000`) |

### Cloudinary Direct Uploads
The API strictly uses a signed-upload flow. The `CLOUDINARY_*` keys must have permissions to issue signatures for direct browser-to-cloud uploads.

### Brevo Email
Ensure the `BREVO_API_KEY` is fully activated to allow sending password reset and verification emails.
