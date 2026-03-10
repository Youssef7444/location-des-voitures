<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Créer 1 admin
        User::factory()->admin()->create([
            'email' => 'admin@example.com',
            'name' => 'Admin User',
        ]);

        // Créer 5 entreprises
        User::factory(5)->company()->create();

        // Créer 50 clients
        User::factory(50)->client()->create();
    }
}