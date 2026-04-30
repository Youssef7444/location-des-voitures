<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminAccessSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_LOGIN_EMAIL', 'admin@speedrent-owner.local');
        $password = (string) env('ADMIN_LOGIN_PASSWORD', 'SpeedRentAdmin!2026#JP');
        $name = (string) env('ADMIN_LOGIN_NAME', 'SpeedRent Owner');

        User::where('role', 'admin')
            ->where('email', '!=', $email)
            ->update(['role' => 'client']);

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => 'admin',
                'status' => 'active',
            ]
        );
    }
}
