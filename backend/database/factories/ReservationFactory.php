<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\User;
use App\Models\Car;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition()
    {
        $startDate = $this->faker->dateTimeBetween('+1 day', '+30 days');
        $endDate = $this->faker->dateTimeBetween($startDate, '+60 days');
        
        // Calculer les jours entre les deux dates
        $totalDays = $startDate->diff($endDate)->days;
        $totalPrice = $totalDays * $this->faker->numberBetween(50, 200);

        return [
            'user_id' => User::factory()->client(),
            'car_id' => Car::factory(),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => $totalDays,
            'total_price' => $totalPrice,
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'cancelled', 'completed']),
            'payment_method' => $this->faker->randomElement(['credit_card', 'cash', 'bank_transfer']),
            'payment_status' => $this->faker->randomElement(['pending', 'paid', 'failed']),
            'pickup_location' => $this->faker->city(),
            'dropoff_location' => $this->faker->city(),
            'driver_license_number' => strtoupper($this->faker->bothify('?????????')),
            'special_requests' => $this->faker->sentence(),
        ];
    }
}
