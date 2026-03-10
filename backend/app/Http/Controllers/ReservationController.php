<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReservationController extends Controller
{
    // GET /api/reservations - Récupérer toutes les réservations
    public function index()
    {
        $reservations = Reservation::with('user', 'car')->paginate(15);
        return response()->json($reservations);
    }

    // GET /api/user/reservations - Recuperer les reservations de l'utilisateur connecte
    public function userReservations(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Reservation::with('car.company', 'car.category')
            ->where('user_id', $user->id);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $reservations = $query->latest()->paginate(15);

        return response()->json($reservations);
    }

    // GET /api/company/reservations - Recuperer les reservations de la societe connectee
    public function companyReservations(Request $request)
    {
        $user = $request->user();
        $company = $user ? $user->company()->first() : null;

        if (!$company) {
            return response()->json(['message' => 'Company profile not found'], 404);
        }

        $query = Reservation::with('user', 'car.category')
            ->whereHas('car', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            });

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $reservations = $query->latest()->paginate(15);

        return response()->json($reservations);
    }

    // GET /api/reservations/{id} - Récupérer une réservation
    public function show($id)
    {
        $reservation = Reservation::with('user', 'car', 'payments', 'reviews')->find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        return response()->json($reservation);
    }

    // POST /api/reservations - Créer une réservation
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'car_id' => 'required|exists:cars,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'total_days' => 'required|integer|min:1',
            'total_price' => 'required|numeric|min:0',
            'status' => 'in:pending,confirmed,cancelled,completed',
            'payment_method' => 'in:credit_card,cash,bank_transfer',
            'payment_status' => 'in:pending,paid,failed',
            'pickup_location' => 'nullable|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
            'driver_license_number' => 'nullable|string|max:50',
            'special_requests' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reservation = Reservation::create($request->all());

        return response()->json([
            'message' => 'Reservation created successfully',
            'reservation' => $reservation,
        ], 201);
    }

    // PUT /api/reservations/{id} - Modifier une réservation
    public function update(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'start_date' => 'date|after_or_equal:today',
            'end_date' => 'date|after:start_date',
            'total_days' => 'integer|min:1',
            'total_price' => 'numeric|min:0',
            'status' => 'in:pending,confirmed,cancelled,completed',
            'payment_method' => 'in:credit_card,cash,bank_transfer',
            'payment_status' => 'in:pending,paid,failed',
            'pickup_location' => 'nullable|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
            'driver_license_number' => 'nullable|string|max:50',
            'special_requests' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reservation->update($request->all());

        return response()->json([
            'message' => 'Reservation updated successfully',
            'reservation' => $reservation,
        ]);
    }

    // POST /api/reservations/{id}/status - Changer le statut d'une reservation
    public function updateStatus(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,cancelled,completed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reservation->status = $request->status;
        $reservation->save();

        return response()->json([
            'message' => 'Reservation status updated successfully',
            'reservation' => $reservation,
        ]);
    }

    // DELETE /api/reservations/{id} - Supprimer une réservation
    public function destroy($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $reservation->delete();

        return response()->json(['message' => 'Reservation deleted successfully']);
    }
}
