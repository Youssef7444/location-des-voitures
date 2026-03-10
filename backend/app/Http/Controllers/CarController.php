<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CarController extends Controller
{
    // GET /api/cars - Récupérer toutes les voitures
    public function index()
    {
        $cars = Car::with([
            'company',
            'category',
            'images' => function ($query) {
                $query->orderByDesc('is_main')->orderByDesc('id');
            },
        ])->paginate(15);
        return response()->json($cars);
    }

    // GET /api/cars/search - Recherche de voitures
    public function search(Request $request)
    {
        $query = Car::with([
            'company',
            'category',
            'images' => function ($imageQuery) {
                $imageQuery->orderByDesc('is_main')->orderByDesc('id');
            },
        ]);

        if ($search = $request->query('query')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', '%' . $search . '%')
                    ->orWhere('model', 'like', '%' . $search . '%')
                    ->orWhere('license_plate', 'like', '%' . $search . '%');
            });
        }

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        if ($typeCar = $request->query('type_car')) {
            $query->where('type_car', $typeCar);
        }

        if ($fuelType = $request->query('fuel_type')) {
            $query->where('fuel_type', $fuelType);
        }

        if ($transmission = $request->query('transmission')) {
            $query->where('transmission', $transmission);
        }

        if ($request->has('available')) {
            $available = filter_var($request->query('available'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($available !== null) {
                $query->where('available', $available);
            }
        }

        if ($request->filled('min_price')) {
            $query->where('price_per_day', '>=', $request->query('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price_per_day', '<=', $request->query('max_price'));
        }

        $perPage = (int) $request->query('per_page', 15);
        $cars = $query->orderByDesc('id')->paginate($perPage > 0 ? $perPage : 15);

        return response()->json($cars);
    }

    // GET /api/cars/{id} - Récupérer une voiture
    public function show($id)
    {
        $car = Car::with([
            'company',
            'category',
            'images' => function ($query) {
                $query->orderByDesc('is_main')->orderByDesc('id');
            },
            'reviews.user',
            'reservations',
        ])->find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        return response()->json($car);
    }

    // POST /api/cars - Créer une voiture
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'type_car' => 'nullable|in:sedan,suv,truck,luxury,convertible,van',
            'year' => 'required|integer|min:1900|max:' . date('Y'),
            'color' => 'nullable|string|max:50',
            'license_plate' => 'required|string|unique:cars',
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'required|in:gasoline,diesel,electric,hybrid',
            'transmission' => 'required|in:manual,automatic',
            'seats' => 'required|integer|min:1|max:10',
            'price_per_day' => 'required|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'available' => 'nullable|boolean',
            'features' => 'nullable|json',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $car = Car::create($request->all());

        return response()->json([
            'message' => 'Car created successfully',
            'car' => $car,
        ], 201);
    }

    // PUT /api/cars/{id} - Modifier une voiture
    public function update(Request $request, $id)
    {
        $car = Car::find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'brand' => 'string|max:100',
            'model' => 'string|max:100',
            'type_car' => 'nullable|in:sedan,suv,truck,luxury,convertible,van',
            'year' => 'integer|min:1900|max:' . date('Y'),
            'color' => 'nullable|string|max:50',
            'license_plate' => 'string|unique:cars,license_plate,' . $id,
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'in:gasoline,diesel,electric,hybrid',
            'transmission' => 'in:manual,automatic',
            'seats' => 'integer|min:1|max:10',
            'price_per_day' => 'numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'available' => 'nullable|boolean',
            'features' => 'nullable|json',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $car->update($request->all());

        return response()->json([
            'message' => 'Car updated successfully',
            'car' => $car,
        ]);
    }

    // DELETE /api/cars/{id} - Supprimer une voiture
    public function destroy($id)
    {
        $car = Car::find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        $car->delete();

        return response()->json(['message' => 'Car deleted successfully']);
    }
}
