<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $clientCount = User::where('role', 'client')->count();
        $companyCount = Company::count();
        $pendingCompanyCount = Company::where('status', 'pending')->count();
        $activeReservations = Reservation::whereIn('status', ['pending', 'confirmed'])->count();
        $availableCars = Car::where('available', true)->count();
        $completedRevenue = (float) Payment::where('status', 'completed')->sum('amount');

        $topCars = Car::with(['images', 'company'])
            ->withCount('reservations')
            ->orderByDesc('reservations_count')
            ->limit(3)
            ->get();

        $latestReviews = Review::with(['user', 'car'])
            ->latest()
            ->limit(3)
            ->get();

        $latestCompanies = Company::latest()
            ->limit(4)
            ->get();

        $monthlyReservations = collect(range(5, 0))
            ->map(function ($monthsAgo) {
                $date = Carbon::now()->subMonths($monthsAgo);

                return [
                    'label' => $date->format('M'),
                    'value' => Reservation::whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->count(),
                ];
            })
            ->push([
                'label' => Carbon::now()->format('M'),
                'value' => Reservation::whereYear('created_at', Carbon::now()->year)
                    ->whereMonth('created_at', Carbon::now()->month)
                    ->count(),
            ])
            ->values();

        return response()->json([
            'stats' => [
                'clients' => $clientCount,
                'companies' => $companyCount,
                'pending_companies' => $pendingCompanyCount,
                'active_reservations' => $activeReservations,
                'available_cars' => $availableCars,
                'monthly_revenue' => $completedRevenue,
            ],
            'monthly_reservations' => $monthlyReservations,
            'top_cars' => $topCars,
            'latest_reviews' => $latestReviews,
            'latest_companies' => $latestCompanies,
        ]);
    }
}
