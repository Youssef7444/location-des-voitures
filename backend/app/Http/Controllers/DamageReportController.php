<?php

namespace App\Http\Controllers;

use App\Models\DamageReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DamageReportController extends Controller
{
    public function index()
    {
        $reports = DamageReport::with('reservation')->paginate(15);
        return response()->json($reports);
    }

    public function show($id)
    {
        $report = DamageReport::with('reservation')->find($id);

        if (!$report) {
            return response()->json(['message' => 'Damage report not found'], 404);
        }

        return response()->json($report);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reservation_id' => 'required|exists:reservations,id',
            'description' => 'required|string',
            'estimated_cost' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $report = DamageReport::create([
            'reservation_id' => $request->reservation_id,
            'description' => $request->description,
            'estimated_cost' => $request->estimated_cost,
            'status' => 'reported',
        ]);

        return response()->json([
            'message' => 'Damage report created successfully',
            'report' => $report,
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $report = DamageReport::find($id);

        if (!$report) {
            return response()->json(['message' => 'Damage report not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:reported,under_review,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $report->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Damage report status updated',
            'report' => $report,
        ]);
    }

    public function destroy($id)
    {
        $report = DamageReport::find($id);

        if (!$report) {
            return response()->json(['message' => 'Damage report not found'], 404);
        }

        $report->delete();

        return response()->json(['message' => 'Damage report deleted successfully']);
    }
}