<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\User;
use App\Models\Car;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition()
    {
        return [
            'user_id' => User::factory()->client(),
            'car_id' => Car::factory(),
            'reservation_id' => Reservation::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'comment' => $this->faker->paragraph(),
        ];
    }
}