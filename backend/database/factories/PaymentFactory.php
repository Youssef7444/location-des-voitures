<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition()
    {
        return [
            'reservation_id' => Reservation::factory(),
            'amount' => $this->faker->numberBetween(100, 1000),
            'payment_method' => $this->faker->randomElement(['credit_card', 'cash', 'bank_transfer', 'paypal', 'stripe']),
            'transaction_id' => strtoupper($this->faker->bothify('TXN-##########')),
            'status' => $this->faker->randomElement(['pending', 'completed', 'failed', 'refunded']),
            'paid_at' => $this->faker->dateTime(),
        ];
    }
}