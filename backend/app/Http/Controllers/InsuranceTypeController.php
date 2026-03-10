<?php

namespace App\Http\Controllers;

use App\Models\InsuranceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InsuranceTypeController extends Controller
{
    public function index()
    {
        $insurances = InsuranceType::paginate(15);
        return response()->json($insurances);
    }

    public function show($id)
    {
        $insurance = InsuranceType::find($id);

        if (!$insurance) {
            return response()->json(['message' => 'Insurance type not found'], 404);
        }

        return response()->json($insurance);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:insurance_types',
            'description' => 'nullable|string',
            'price_per_day' => 'required|numeric|min:0',
            'coverage_details' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $insurance = InsuranceType::create($request->all());

        return response()->json([
            'message' => 'Insurance type created successfully',
            'insurance' => $insurance,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $insurance = InsuranceType::find($id);

        if (!$insurance) {
            return response()->json(['message' => 'Insurance type not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255|unique:insurance_types,name,' . $id,
            'description' => 'nullable|string',
            'price_per_day' => 'numeric|min:0',
            'coverage_details' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $insurance->update($request->all());

        return response()->json([
            'message' => 'Insurance type updated successfully',
            'insurance' => $insurance,
        ]);
    }

    public function destroy($id)
    {
        $insurance = InsuranceType::find($id);

        if (!$insurance) {
            return response()->json(['message' => 'Insurance type not found'], 404);
        }

        $insurance->delete();

        return response()->json(['message' => 'Insurance type deleted successfully']);
    }
}