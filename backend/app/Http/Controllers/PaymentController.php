<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    // GET /api/payments - Récupérer tous les paiements
    public function index()
    {
        $payments = Payment::with('reservation')->paginate(15);
        return response()->json($payments);
    }

    // GET /api/payments - Recuperer les paiements de l'utilisateur connecte
    public function userPayments(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $payments = Payment::with('reservation.car')
            ->whereHas('reservation', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->latest()
            ->paginate(15);

        return response()->json($payments);
    }

    // GET /api/company/payments - Recuperer les paiements de la societe connectee
    public function companyPayments(Request $request)
    {
        $user = $request->user();
        $company = $user ? $user->company()->first() : null;

        if (!$company) {
            return response()->json(['message' => 'Company profile not found'], 404);
        }

        $payments = Payment::with('reservation.user', 'reservation.car')
            ->whereHas('reservation.car', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            })
            ->latest()
            ->paginate(15);

        return response()->json($payments);
    }

    // GET /api/payments/{id} - Récupérer un paiement
    public function show($id)
    {
        $payment = Payment::with('reservation')->find($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        return response()->json($payment);
    }

    // POST /api/payments - Créer un paiement
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reservation_id' => 'required|exists:reservations,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:credit_card,cash,bank_transfer,paypal,stripe',
            'transaction_id' => 'nullable|string|unique:payments',
            'status' => 'in:pending,completed,failed,refunded',
            'paid_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payment = Payment::create($request->all());

        return response()->json([
            'message' => 'Payment created successfully',
            'payment' => $payment,
        ], 201);
    }

    // PUT /api/payments/{id} - Modifier un paiement
    public function update(Request $request, $id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'numeric|min:0',
            'payment_method' => 'in:credit_card,cash,bank_transfer,paypal,stripe',
            'transaction_id' => 'string|unique:payments,transaction_id,' . $id,
            'status' => 'in:pending,completed,failed,refunded',
            'paid_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payment->update($request->all());

        return response()->json([
            'message' => 'Payment updated successfully',
            'payment' => $payment,
        ]);
    }

    // POST /api/payments/{id}/refund - Rembourser un paiement
    public function refund($id)
    {
        $payment = Payment::with('reservation')->find($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        if ($payment->status !== 'completed') {
            return response()->json(['message' => 'Only completed payments can be refunded'], 422);
        }

        $payment->status = 'refunded';
        $payment->save();

        if ($payment->reservation && $payment->reservation->payment_status === 'paid') {
            $payment->reservation->payment_status = 'failed';
            $payment->reservation->save();
        }

        return response()->json([
            'message' => 'Payment refunded successfully',
            'payment' => $payment,
        ]);
    }

    // GET /api/payments/stats and GET /api/company/stats - Statistiques paiements
    public function stats(Request $request)
    {
        $user = $request->user();
        $query = Payment::query();
        $scope = 'global';

        if ($user && $user->role === 'company') {
            $company = $user->company()->first();

            if (!$company) {
                return response()->json(['message' => 'Company profile not found'], 404);
            }

            $scope = 'company';
            $query->whereHas('reservation.car', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            });
        }

        $totalPayments = (clone $query)->count();
        $completedPayments = (clone $query)->where('status', 'completed')->count();
        $pendingPayments = (clone $query)->where('status', 'pending')->count();
        $failedPayments = (clone $query)->where('status', 'failed')->count();
        $refundedPayments = (clone $query)->where('status', 'refunded')->count();
        $totalRevenue = (clone $query)->where('status', 'completed')->sum('amount');

        return response()->json([
            'scope' => $scope,
            'total_payments' => $totalPayments,
            'completed_payments' => $completedPayments,
            'pending_payments' => $pendingPayments,
            'failed_payments' => $failedPayments,
            'refunded_payments' => $refundedPayments,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }

    // DELETE /api/payments/{id} - Supprimer un paiement
    public function destroy($id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $payment->delete();

        return response()->json(['message' => 'Payment deleted successfully']);
    }
}
