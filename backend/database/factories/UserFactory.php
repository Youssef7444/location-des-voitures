<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'role' => $this->faker->randomElement(['admin', 'company', 'client']),
            'status' => 'active',
            'avatar' => 'default-avatar.png',
            
        ];
    }

    public function admin()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }

    public function company()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'company',
        ]);
    }

    public function client()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'client',
        ]);
    }
}