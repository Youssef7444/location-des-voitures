<?php

namespace App\Services;

use App\Models\User;
use App\Models\Reservation;
use Illuminate\Support\Facades\Mail;

class EmailService
{
    /**
     * Envoyer un email de bienvenue
     */
    public function sendWelcomeEmail(User $user)
    {
        try {
            // Vous pouvez utiliser Mailable ici
            // Mail::send(new WelcomeEmail($user));
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Envoyer un email de confirmation de réservation
     */
    public function sendReservationConfirmation(Reservation $reservation)
    {
        try {
            $data = [
                'user_name' => $reservation->user->name,
                'car_brand' => $reservation->car->brand,
                'car_model' => $reservation->car->model,
                'start_date' => $reservation->start_date,
                'end_date' => $reservation->end_date,
                'total_price' => $reservation->total_price,
                'reservation_id' => $reservation->id,
            ];

            // Mail::send('emails.reservation-confirmation', $data, function ($message) use ($reservation) {
            //     $message->to($reservation->user->email)
            //         ->subject('Confirmation de réservation');
            // });

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Envoyer un email d'annulation
     */
    public function sendCancellationEmail(Reservation $reservation)
    {
        try {
            $data = [
                'user_name' => $reservation->user->name,
                'reservation_id' => $reservation->id,
                'car_brand' => $reservation->car->brand,
            ];

            // Mail::send('emails.reservation-cancelled', $data, function ($message) use ($reservation) {
            //     $message->to($reservation->user->email)
            //         ->subject('Annulation de réservation');
            // });

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Envoyer un email de paiement
     */
    public function sendPaymentConfirmation($payment)
    {
        try {
            $data = [
                'user_name' => $payment->reservation->user->name,
                'amount' => $payment->amount,
                'payment_method' => $payment->payment_method,
                'transaction_id' => $payment->transaction_id,
            ];

            // Mail::send('emails.payment-confirmation', $data, function ($message) use ($payment) {
            //     $message->to($payment->reservation->user->email)
            //         ->subject('Confirmation de paiement');
            // });

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Envoyer un email de réinitialisation de mot de passe
     */
    public function sendPasswordResetEmail(User $user, $token)
    {
        try {
            $resetUrl = config('app.url') . '/reset-password?token=' . $token;

            $data = [
                'user_name' => $user->name,
                'reset_url' => $resetUrl,
            ];

            // Mail::send('emails.password-reset', $data, function ($message) use ($user) {
            //     $message->to($user->email)
            //         ->subject('Réinitialisation de mot de passe');
            // });

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Envoyer un email de contact
     */
    public function sendContactEmail($data)
    {
        try {
            // Mail::send('emails.contact', $data, function ($message) {
            //     $message->to(config('mail.from.address'))
            //         ->subject('Nouveau message de contact');
            // });

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}