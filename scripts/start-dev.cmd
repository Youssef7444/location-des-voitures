@echo off
setlocal

set "ROOT=%~dp0.."

cd /d "%ROOT%\backend"
php artisan storage:link >nul 2>nul

start "Laravel Backend" cmd /k "cd /d \"%ROOT%\backend\" && php artisan serve --host=127.0.0.1 --port=8000"
start "Vite Frontend" cmd /k "cd /d \"%ROOT%\frontend\" && npm.cmd run dev -- --host 127.0.0.1 --port 5173"

echo Frontend: http://127.0.0.1:5173
echo Backend API: http://127.0.0.1:8000/api
