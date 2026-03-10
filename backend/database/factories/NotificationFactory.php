<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement(['reservation', 'payment', 'review', 'system']),
            'title' => $this->faker->sentence(),
            'message' => $this->faker->paragraph(),
            'data' => json_encode(['key' => 'value']),
            'read_at' => null,
        ];
    }
}