<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition()
    {
        return [
            'user_id' => User::factory()->company(),
            'name' => $this->faker->company(),
            'description' => $this->faker->paragraph(),
            'logo' => 'default-logo.png',
            'address' => $this->faker->address(),
            'city' => $this->faker->city(),
            'latitude' => $this->faker->latitude(),
            'longitude' => $this->faker->longitude(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->companyEmail(),
            'website' => $this->faker->url(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'subscription_end_date' => $this->faker->dateTimeBetween('+1 month', '+1 year'),
            'verified' => false,
        ];
    }
}
