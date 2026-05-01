# Render Deployment

This backend can be deployed on Render as a Docker web service.

## 1. Create the backend service on Render

- New `Web Service`
- Connect this GitHub repository
- Root directory: `backend`
- Environment: `Docker`

Render will detect `backend/Dockerfile`.

## 2. Required environment variables

Set these in the Render dashboard:

```env
APP_NAME=SpeedRent
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-render-service.onrender.com
APP_KEY=base64:GENERATED_LARAVEL_KEY

LOG_CHANNEL=stderr
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=YOUR_MYSQL_HOST
DB_PORT=3306
DB_DATABASE=YOUR_DB_NAME
DB_USERNAME=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=public

JWT_SECRET=YOUR_JWT_SECRET
TURNSTILE_SECRET_KEY=YOUR_TURNSTILE_SECRET_KEY
```

## 3. One-time values you must generate locally

Generate `APP_KEY`:

```powershell
cd C:\Users\lenovo\Desktop\PFE\location-des-voitures\backend
php artisan key:generate --show
```

Generate `JWT_SECRET`:

```powershell
cd C:\Users\lenovo\Desktop\PFE\location-des-voitures\backend
php artisan jwt:secret --force
```

Copy the printed values into Render environment variables.

## 4. Database

GitHub Pages cannot read your local MySQL database.
You must use a public MySQL database.

You can use:

- a hosted MySQL service
- a MySQL instance you manage yourself
- a MySQL-compatible cloud provider

Then put its `DB_*` values into Render.

## 5. Run migrations on Render

After the first deploy, open the Render Shell or use a pre-deploy command and run:

```bash
php artisan migrate --force
```

If you want seed data:

```bash
php artisan db:seed --force
```

## 6. Frontend GitHub Pages

After the backend is live, update the frontend variable in `docs/.env`:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

Then rebuild and redeploy GitHub Pages.

## 7. Important note about uploaded images

This project stores car and company images on the local `public` disk.

On cloud hosting, local files may be lost on redeploy unless you attach persistent storage or move uploads to object storage like S3.

For a first deployment, you should attach a persistent disk or later migrate media to S3-compatible storage.
