<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE reservations MODIFY status ENUM('pending','accepted','confirmed','rejected','cancelled','completed') DEFAULT 'pending'");
            DB::statement("UPDATE reservations SET status = 'accepted' WHERE status = 'confirmed'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE reservations SET status = 'confirmed' WHERE status = 'accepted'");
            DB::statement("ALTER TABLE reservations MODIFY status ENUM('pending','confirmed','rejected','cancelled','completed') DEFAULT 'pending'");
        }
    }
};
