<?php

namespace App\Http\Controllers;

use App\Models\CarImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CarImageController extends Controller
{
    public function index()
    {
        $images = CarImage::with('car')->paginate(15);
        return response()->json($images);
    }

    public function show($id)
    {
        $image = CarImage::with('car')->find($id);

        if (!$image) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        return response()->json($image);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'car_id' => 'required|exists:cars,id',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_main' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('image')->store('cars', 'public');

        if ($request->boolean('is_main')) {
            CarImage::where('car_id', $request->car_id)->update(['is_main' => false]);
        }

        $image = CarImage::create([
            'car_id' => $request->car_id,
            'image_path' => $path,
            'is_main' => $request->boolean('is_main'),
        ]);

        return response()->json([
            'message' => 'Image uploaded successfully',
            'image' => $image,
        ], 201);
    }

    public function destroy($id)
    {
        $image = CarImage::find($id);

        if (!$image) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        if ($image->image_path) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully']);
    }
}
