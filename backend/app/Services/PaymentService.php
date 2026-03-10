<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Reservation;

class PaymentService{
    public function processPayment($data)
    {
        $reservation = Reservation::find($data['reservation_id']);

        if (!$reservation) {
            throw new \Exception('Reservation not found');
        }

        // Vérifier le montant
        if ($data['amount'] != $reservation->total_price) {
            throw new \Exception('Invalid payment amount');
        }

        // Créer le paiement
        $payment = Payment::create([
            'reservation_id' => $data['reservation_id'],
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'],
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        // Mettre à jour le statut de la réservation
        $reservation->update(['payment_status' => 'paid']);

        return $payment;
    }

    public function refundPayment($payment)
    {
        if ($payment->status === 'refunded') {
            throw new \Exception('Payment already refunded');
        }

        $payment->update(['status' => 'refunded']);

        // Mettre à jour la réservation
        $reservation = $payment->reservation;
        $reservation->update(['payment_status' => 'refunded']);

        return $payment;
    }
    /**
 * Obtenir les paiements d'un utilisateur
 */
    public function getUserPayments($userId, $perPage = 15)
    {
        return Payment::whereHas('reservation', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
        ->with('reservation', 'reservation.car')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);
    }

    /**
     * Obtenir les paiements d'une entreprise
     */
    public function getCompanyPayments($companyId, $perPage = 15)
    {
        return Payment::whereHas('reservation.car', function ($query) use ($companyId) {
            $query->where('company_id', $companyId);
        })
        ->with('reservation', 'reservation.user', 'reservation.car')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);
    }

    /**
     * Obtenir les statistiques des paiements
     */
    public function getPaymentStats($companyId = null)
    {
        $query = Payment::query();

        if ($companyId) {
            $query->whereHas('reservation.car', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        }

        return [
            'total_payments' => $query->count(),
            'total_amount' => $query->sum('amount'),
            'completed' => $query->where('status', 'completed')->count(),
            'pending' => $query->where('status', 'pending')->count(),
            'refunded' => $query->where('status', 'refunded')->count(),
            'failed' => $query->where('status', 'failed')->count(),
            'average_payment' => $query->avg('amount'),
        ];
    }
}