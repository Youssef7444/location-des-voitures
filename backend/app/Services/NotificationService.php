<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Créer une notification
     */
    public function createNotification($userId, $type, $title, $message, $data = [])
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Créer une notification pour plusieurs utilisateurs
     */
    public function createBulkNotifications($userIds, $type, $title, $message, $data = [])
    {
        $notifications = [];

        foreach ($userIds as $userId) {
            $notifications[] = [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => json_encode($data),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        return Notification::insert($notifications);
    }

    /**
     * Marquer comme lu
     */
    public function markAsRead($notificationId)
    {
        $notification = Notification::find($notificationId);

        if ($notification) {
            $notification->update(['read_at' => now()]);
        }

        return $notification;
    }

    /**
     * Marquer tous comme lus
     */
    public function markAllAsRead($userId)
    {
        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Obtenir les notifications non lues
     */
    public function getUnreadNotifications($userId)
    {
        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Compter les notifications non lues
     */
    public function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Supprimer une notification
     */
    public function deleteNotification($notificationId)
    {
        return Notification::destroy($notificationId);
    }

    /**
     * Supprimer toutes les notifications lues
     */
    public function deleteReadNotifications($userId)
    {
        return Notification::where('user_id', $userId)
            ->whereNotNull('read_at')
            ->delete();
    }

    /**
     * Envoyer une notification de réservation
     */
    public function notifyReservationCreated($reservation)
    {
        $this->createNotification(
            $reservation->user_id,
            'reservation_created',
            'Réservation créée',
            'Votre réservation pour ' . $reservation->car->brand . ' a été créée',
            ['reservation_id' => $reservation->id]
        );

        // Notifier l'entreprise
        $company = $reservation->car->company;
        if ($company && $company->user) {
            $this->createNotification(
                $company->user_id,
                'new_reservation',
                'Nouvelle réservation',
                'Une nouvelle réservation a été créée',
                ['reservation_id' => $reservation->id]
            );
        }
    }

    /**
     * Envoyer une notification de paiement
     */
    public function notifyPaymentProcessed($payment)
    {
        $this->createNotification(
            $payment->reservation->user_id,
            'payment_processed',
            'Paiement reçu',
            'Votre paiement de ' . $payment->amount . ' € a été reçu',
            ['payment_id' => $payment->id]
        );
    }

    /**
     * Envoyer une notification d'annulation
     */
    public function notifyReservationCancelled($reservation)
    {
        $this->createNotification(
            $reservation->user_id,
            'reservation_cancelled',
            'Réservation annulée',
            'Votre réservation a été annulée',
            ['reservation_id' => $reservation->id]
        );
    }
}