<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\Category;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ApiCoreFlowsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => 'testing-secret-key',
            'jwt.ttl' => 60,
            'jwt.refresh_ttl' => 20160,
        ]);
    }

    public function test_cars_search_endpoint_returns_matching_results(): void
    {
        [$car] = $this->createCompanyAndCars();

        $response = $this->getJson('/api/cars/search?query=Toyota');

        $response
            ->assertOk()
            ->assertJsonFragment(['id' => $car->id])
            ->assertJsonFragment(['brand' => 'Toyota']);
    }

    public function test_car_reviews_endpoint_returns_reviews_for_specific_car(): void
    {
        [$car] = $this->createCompanyAndCars();
        $client = User::factory()->create([
            'role' => 'client',
            'status' => 'active',
        ]);

        $reservation = Reservation::factory()->create([
            'user_id' => $client->id,
            'car_id' => $car->id,
        ]);

        Review::factory()->create([
            'user_id' => $client->id,
            'car_id' => $car->id,
            'reservation_id' => $reservation->id,
            'rating' => 5,
        ]);

        $response = $this->getJson("/api/cars/{$car->id}/reviews");

        $response
            ->assertOk()
            ->assertJsonFragment(['car_id' => $car->id])
            ->assertJsonFragment(['rating' => 5]);
    }

    public function test_user_profile_endpoint_returns_authenticated_user(): void
    {
        $user = User::factory()->create([
            'role' => 'client',
            'status' => 'active',
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this
            ->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/user/profile');

        $response
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email);
    }

    public function test_company_stats_returns_company_scoped_payment_metrics(): void
    {
        [$car, $companyUser] = $this->createCompanyAndCars();

        $client = User::factory()->create([
            'role' => 'client',
            'status' => 'active',
        ]);

        $reservation = Reservation::factory()->create([
            'user_id' => $client->id,
            'car_id' => $car->id,
        ]);

        Payment::factory()->create([
            'reservation_id' => $reservation->id,
            'amount' => 250,
            'status' => 'completed',
        ]);

        $token = JWTAuth::fromUser($companyUser);

        $response = $this
            ->withHeaders(['Authorization' => "Bearer {$token}"])
            ->getJson('/api/company/stats');

        $response->assertOk();

        $payload = $response->json();
        $this->assertSame('company', $payload['scope']);
        $this->assertSame(1, $payload['total_payments']);
        $this->assertSame(1, $payload['completed_payments']);
        $this->assertSame(0, $payload['pending_payments']);
        $this->assertSame(0, $payload['failed_payments']);
        $this->assertSame(0, $payload['refunded_payments']);
        $this->assertSame(250.0, (float) $payload['total_revenue']);
    }

    /**
     * @return array{0: Car, 1: User}
     */
    private function createCompanyAndCars(): array
    {
        $companyUser = User::factory()->create([
            'role' => 'company',
            'status' => 'active',
        ]);

        $company = Company::factory()->create([
            'user_id' => $companyUser->id,
        ]);

        $category = Category::factory()->create([
            'name' => 'Category-' . uniqid(),
        ]);

        $car = Car::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
            'brand' => 'Toyota',
            'model' => 'Yaris',
            'license_plate' => strtoupper('TS' . substr(uniqid(), -6)),
        ]);

        Car::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
            'brand' => 'Honda',
            'model' => 'Civic',
            'license_plate' => strtoupper('HD' . substr(uniqid(), -6)),
        ]);

        return [$car, $companyUser];
    }
}
