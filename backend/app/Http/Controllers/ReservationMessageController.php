<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\ReservationMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReservationMessageController extends Controller
{
    private function resolveAuthorizedReservation(Request $request, int $reservationId): ?Reservation
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }

        $reservation = Reservation::with('user', 'car.company', 'car.images', 'messages.sender')->find($reservationId);
        if (!$reservation) {
            return null;
        }

        if ((int) $reservation->user_id === (int) $user->id) {
            return $reservation;
        }

        if ($user->role === 'company') {
            $company = $user->company()->first();
            if ($company && $reservation->car && (int) $reservation->car->company_id === (int) $company->id) {
                return $reservation;
            }
        }

        return null;
    }

    public function index(Request $request, $reservationId)
    {
        $reservation = $this->resolveAuthorizedReservation($request, (int) $reservationId);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $viewerRole = $request->user()?->role === 'company' ? 'company' : 'client';

        $reservation->messages()
            ->whereNull('read_at')
            ->where('sender_role', '!=', $viewerRole)
            ->update(['read_at' => now()]);

        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->whereIn('type', ['reservation_message', 'reservation_status_updated', 'reservation_created'])
            ->where('data->reservation_id', $reservation->id)
            ->update(['read_at' => now()]);

        return response()->json([
            'reservation' => $reservation->fresh(['user', 'car.company', 'car.images', 'messages.sender']),
            'messages' => $reservation->messages()->with('sender')->orderBy('created_at')->get(),
        ]);
    }

    public function store(Request $request, $reservationId)
    {
        $reservation = $this->resolveAuthorizedReservation($request, (int) $reservationId);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $senderRole = $user->role === 'company' ? 'company' : 'client';

        $message = ReservationMessage::create([
            'reservation_id' => $reservation->id,
            'sender_user_id' => $user->id,
            'sender_role' => $senderRole,
            'message' => trim((string) $request->input('message')),
        ]);

        if ($senderRole === 'company') {
            Notification::create([
                'user_id' => $reservation->user_id,
                'type' => 'reservation_message',
                'title' => 'New reply from the company',
                'message' => 'Your booking has received a new message from the company.',
                'data' => ['reservation_id' => $reservation->id],
            ]);
        } else {
            $companyUserId = $reservation->car?->company?->user_id;

            if ($companyUserId) {
                Notification::create([
                    'user_id' => $companyUserId,
                    'type' => 'reservation_message',
                    'title' => 'New client message',
                    'message' => 'A client has sent a new message about a booking.',
                    'data' => ['reservation_id' => $reservation->id],
                ]);
            }
        }

        return response()->json([
            'message' => 'Message sent successfully',
            'reservation_message' => $message->load('sender'),
        ], 201);
    }
}
