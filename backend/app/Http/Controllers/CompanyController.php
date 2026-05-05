<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    private function publicUploadDisk(): string
    {
        return (string) config('filesystems.public_upload_disk', 'public');
    }

    // GET /api/companies - Récupérer toutes les entreprises
    public function index()
    {
        $companies = Company::with([
            'user',
            'cars.category',
            'cars.images' => function ($query) {
                $query->orderByDesc('is_main')->orderByDesc('id');
            },
        ])->paginate(15);
        return response()->json($companies);
    }

    // GET /api/companies/{id} - Récupérer une entreprise
    public function show($id)
    {
        $company = Company::with([
            'user',
            'cars.category',
            'cars.images' => function ($query) {
                $query->orderByDesc('is_main')->orderByDesc('id');
            },
        ])->find($id);

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        return response()->json($company);
    }

    // POST /api/companies - Créer une entreprise
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|string|email',
            'website' => 'nullable|string',
            'status' => 'in:pending,approved,rejected',
            'subscription_end_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::create($request->all());

        return response()->json([
            'message' => 'Company created successfully',
            'company' => $company,
        ], 201);
    }

    // PUT /api/companies/{id} - Modifier une entreprise
    public function update(Request $request, $id)
    {
        $company = Company::find($id);

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|string',
            'address' => 'string',
            'city' => 'string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|string|email',
            'website' => 'nullable|string',
            'status' => 'in:pending,approved,rejected',
            'subscription_end_date' => 'nullable|date',
            'verified' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company->update($request->all());

        return response()->json([
            'message' => 'Company updated successfully',
            'company' => $company,
        ]);
    }

    // POST /api/admin/companies/{id}/logo - Uploader un logo d'entreprise
    public function uploadLogo(Request $request, $id)
    {
        $company = Company::find($id);

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'logo' => 'required|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($company->logo && !str_starts_with($company->logo, 'http://') && !str_starts_with($company->logo, 'https://')) {
            Storage::disk($this->publicUploadDisk())->delete($company->logo);
        }

        $path = $request->file('logo')->store('companies', $this->publicUploadDisk());
        $company->logo = $path;
        $company->save();

        return response()->json([
            'message' => 'Company logo uploaded successfully',
            'company' => $company,
        ]);
    }

    // DELETE /api/companies/{id} - Supprimer une entreprise
    public function destroy($id)
    {
        $company = Company::find($id);

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        $company->delete();

        return response()->json(['message' => 'Company deleted successfully']);
    }
}
