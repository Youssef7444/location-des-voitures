<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    // GET /api/reviews - Récupérer tous les avis
    public function index()
    {
        $reviews = Review::with('user', 'car', 'reservation')->paginate(15);
        return response()->json($reviews);
    }

    // GET /api/reviews/{id} - Récupérer un avis
    public function show($id)
    {
        $review = Review::with('user', 'car', 'reservation')->find($id);

        if (!$review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        return response()->json($review);
    }

    // GET /api/cars/{id}/reviews - Recuperer les avis d'une voiture
    public function carReviews($id)
    {
        $reviews = Review::with('user', 'reservation')
            ->where('car_id', $id)
            ->latest()
            ->paginate(15);

        return response()->json($reviews);
    }

    // POST /api/reviews - Créer un avis
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'car_id' => 'required|exists:cars,id',
            'reservation_id' => 'required|exists:reservations,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $review = Review::create($request->all());

        return response()->json([
            'message' => 'Review created successfully',
            'review' => $review,
        ], 201);
    }

    // PUT /api/reviews/{id} - Modifier un avis
    public function update(Request $request, $id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $review->update($request->all());

        return response()->json([
            'message' => 'Review updated successfully',
            'review' => $review,
        ]);
    }

    // DELETE /api/reviews/{id} - Supprimer un avis
    public function destroy($id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted successfully']);
    }
}
