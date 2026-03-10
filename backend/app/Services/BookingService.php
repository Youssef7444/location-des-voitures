<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Car;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BookingService
{
    /**
     * Créer une réservation
     */
    public function createBooking($userId, $data)
    {
        try {
            DB::beginTransaction();

            $car = Car::find($data['car_id']);
            if (!$car || !$car->available) {
                throw new \Exception('Car is not available');
            }

            $startDate = Carbon::parse($data['start_date']);
            $endDate = Carbon::parse($data['end_date']);

            if ($startDate->isPast()) {
                throw new \Exception('Start date cannot be in the past');
            }

            if ($endDate->isBefore($startDate)) {
                throw new \Exception('End date must be after start date');
            }

            // Vérifier la disponibilité
            $existingBooking = Reservation::where('car_id', $car->id)
                ->where(function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function ($q) use ($startDate, $endDate) {
                            $q->where('start_date', '<=', $startDate)
                                ->where('end_date', '>=', $endDate);
                        });
                })
                ->where('status', '!=', 'cancelled')
                ->first();

            if ($existingBooking) {
                throw new \Exception('Car is already booked for this period');
            }

            $totalDays = $endDate->diffInDays($startDate);
            $totalPrice = $car->price_per_day * $totalDays;

            if ($car->discount_percent > 0) {
                $discount = ($totalPrice * $car->discount_percent) / 100;
                $totalPrice -= $discount;
            }

            $reservation = Reservation::create([
                'user_id' => $userId,
                'car_id' => $car->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_days' => $totalDays,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'payment_method' => $data['payment_method'] ?? 'credit_card',
                'payment_status' => 'pending',
                'pickup_location' => $data['pickup_location'] ?? null,
                'dropoff_location' => $data['dropoff_location'] ?? null,
                'driver_license_number' => $data['driver_license_number'],
                'special_requests' => $data['special_requests'] ?? null,
            ]);

            DB::commit();
            return $reservation;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Annuler une réservation
     */
    public function cancelBooking($reservationId)
    {
        try {
            DB::beginTransaction();

            $reservation = Reservation::find($reservationId);
            if (!$reservation) {
                throw new \Exception('Reservation not found');
            }

            if ($reservation->status === 'completed') {
                throw new \Exception('Cannot cancel completed reservation');
            }

            $reservation->update(['status' => 'cancelled']);

            DB::commit();
            return $reservation;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Confirmer une réservation
     */
    public function confirmBooking($reservationId)
    {
        try {
            DB::beginTransaction();

            $reservation = Reservation::find($reservationId);
            if (!$reservation) {
                throw new \Exception('Reservation not found');
            }

            $reservation->update(['status' => 'confirmed']);

            DB::commit();
            return $reservation;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Obtenir les réservations d'un utilisateur
     */
    public function getUserBookings($userId, $perPage = 15)
    {
        return Reservation::where('user_id', $userId)
            ->with('car', 'car.company', 'car.category')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Obtenir les statistiques
     */
    public function getBookingStats($userId = null)
    {
        $query = Reservation::query();

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return [
            'total' => $query->count(),
            'pending' => $query->where('status', 'pending')->count(),
            'confirmed' => $query->where('status', 'confirmed')->count(),
            'completed' => $query->where('status', 'completed')->count(),
            'cancelled' => $query->where('status', 'cancelled')->count(),
        ];
    }
}