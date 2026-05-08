# InfinityFree Deployment

This guide is for:

- `frontend` on GitHub Pages
- `backend` Laravel API on InfinityFree

## 1. Important limitations

InfinityFree is suitable for a simple demo, but it has constraints:

- no SSH on free hosting
- no Composer install on server
- no queue workers
- no cron jobs for Laravel scheduler

Because of that, you must prepare Laravel locally, then upload it.

## 2. Local preparation

Run locally in `backend`:

```powershell
cd C:\Users\lenovo\Desktop\PFE\location-des-voitures\backend
composer install --no-dev --optimize-autoloader
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan key:generate --show
php artisan jwt:secret --force
```

Keep the generated `APP_KEY` and `JWT_SECRET`.

## 3. InfinityFree folder structure

On InfinityFree, use this structure:

```text
account-root/
  htdocs/
    index.php
    .htaccess
    storage/
  laravel_app/
    app/
    bootstrap/
    config/
    database/
    public/
    resources/
    routes/
    storage/
    vendor/
    artisan
    .env
```

## 4. What to upload where

### Upload to `laravel_app`

Upload the full Laravel backend project:

- `app`
- `bootstrap`
- `config`
- `database`
- `resources`
- `routes`
- `storage`
- `vendor`
- `artisan`
- `composer.json`
- `composer.lock`

Do not rely on Composer on InfinityFree. Upload `vendor` from your local machine.

### Upload to `htdocs`

Upload these files from:

- `backend/deploy/infinityfree/public_html/index.php`
- `backend/deploy/infinityfree/public_html/.htaccess`

Do not upload Laravel's original `backend/public/index.php` directly.

## 5. Environment file

Create `laravel_app/.env` using:

- [backend/.env.infinityfree.example](c:/Users/lenovo/Desktop/PFE/location-des-voitures/backend/.env.infinityfree.example)

Set:

- `APP_KEY`
- `JWT_SECRET`
- `TURNSTILE_SECRET_KEY`
- InfinityFree MySQL credentials
- `APP_URL=https://your-subdomain.infinityfreeapp.com`

Important values:

```env
APP_DEBUG=false
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=public_uploads
PUBLIC_UPLOAD_DISK=public_uploads
PUBLIC_UPLOADS_ROOT=../htdocs/storage
```

## 6. Images and uploads

This project is configured so InfinityFree can store uploads directly in:

```text
htdocs/storage
```

That avoids dependency on `storage:link`.
The `PUBLIC_UPLOADS_ROOT=../htdocs/storage` value is resolved relative to `laravel_app`.

Create these folders in `htdocs/storage`:

```text
avatars
cars
companies
company-logos
documents
```

The app will write uploaded files there through the `public_uploads` disk.



## 8. Frontend connection

Update:

- [docs/.env](c:/Users/lenovo/Desktop/PFE/location-des-voitures/docs/.env)

Set:

```env
VITE_API_URL=https://your-subdomain.infinityfreeapp.com/api
```

Then rebuild and push GitHub Pages.

## 9. Common errors

### White page or 500

Check:

- `public_html/index.php` path to `../laravel_app`
- `.env` exists in `laravel_app`
- `vendor` was uploaded
- `APP_KEY` is set

### Images do not load

Check:

- `FILESYSTEM_DISK=public_uploads`
- `PUBLIC_UPLOAD_DISK=public_uploads`
- folders exist inside `public_html/storage`

### API works locally but not online

Check:

- `APP_URL` is the real InfinityFree URL
- `VITE_API_URL` points to the InfinityFree backend URL
- browser console for CORS or 500 errors
