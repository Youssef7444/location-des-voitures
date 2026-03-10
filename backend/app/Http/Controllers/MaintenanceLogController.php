<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaintenanceLogController extends Controller
{
    public function index()
    {
        $logs = MaintenanceLog::with('car')->paginate(15);
        return response()->json($logs);
    }

    public function show($id)
    {
        $log = MaintenanceLog::with('car')->find($id);

        if (!$log) {
            return response()->json(['message' => 'Maintenance log not found'], 404);
        }

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'car_id' => 'required|exists:cars,id',
            'maintenance_type' => 'required|string|max:255',
            'description' => 'required|string',
            'cost' => 'required|numeric|min:0',
            'maintenance_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $log = MaintenanceLog::create($request->all());

        return response()->json([
            'message' => 'Maintenance log created successfully',
            'log' => $log,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $log = MaintenanceLog::find($id);

        if (!$log) {
            return response()->json(['message' => 'Maintenance log not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'maintenance_type' => 'string|max:255',
            'description' => 'string',
            'cost' => 'numeric|min:0',
            'maintenance_date' => 'date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $log->update($request->all());

        return response()->json([
            'message' => 'Maintenance log updated successfully',
            'log' => $log,
        ]);
    }

    public function destroy($id)
    {
        $log = MaintenanceLog::find($id);

        if (!$log) {
            return response()->json(['message' => 'Maintenance log not found'], 404);
        }

        $log->delete();

        return response()->json(['message' => 'Maintenance log deleted successfully']);
    }

    public function carLogs($carId)
    {
        $logs = MaintenanceLog::where('car_id', $carId)
            ->orderBy('maintenance_date', 'desc')
            ->paginate(15);

        return response()->json($logs);
    }
}