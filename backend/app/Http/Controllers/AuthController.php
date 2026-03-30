<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    public function companyRegister(Request $request)
    {
        $normalizedUserEmail = mb_strtolower(trim((string) $request->email));
        $normalizedCompanyEmail = mb_strtolower(trim((string) $request->company_email));

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'company_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'address' => 'required|string|max:1000',
            'city' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'company_email' => 'required|string|email|max:255',
            'turnstile_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $turnstileSecret = (string) config('services.turnstile.secret');
        if ($turnstileSecret === '') {
            return response()->json(['message' => 'Captcha service is not configured'], 500);
        }

        $turnstileResponse = Http::asForm()
            ->timeout(10)
            ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $turnstileSecret,
                'response' => $request->turnstile_token,
                'remoteip' => $request->ip(),
            ]);

        if (!$turnstileResponse->ok() || !$turnstileResponse->json('success')) {
            return response()->json(['message' => 'Captcha verification failed'], 422);
        }

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('company-logos', 'public');
        }

        $user = null;
        $company = null;

        DB::transaction(function () use ($request, $logoPath, &$user, &$company) {
            $user = User::create([
                'name' => $request->name,
                'email' => $normalizedUserEmail,
                'password' => Hash::make($request->password),
                'role' => 'company',
                'phone' => $request->phone,
                'address' => $request->address,
                'city' => $request->city,
                'status' => 'active',
            ]);

            $company = Company::create([
                'user_id' => $user->id,
                'name' => $request->company_name,
                'description' => $request->description,
                'logo' => $logoPath,
                'address' => $request->address,
                'city' => $request->city,
                'phone' => $request->phone,
                'email' => $normalizedCompanyEmail,
                'status' => 'pending',
                'verified' => false,
            ]);
        });

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Company account created successfully',
            'user' => $user,
            'company' => $company,
            'token' => $token,
        ], 201);
    }

    // Register
    public function register(Request $request)
    {
        $normalizedEmail = mb_strtolower(trim((string) $request->email));

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'nullable|string|max:255|unique:users,username',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:admin,company,client',
            'turnstile_token' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'country' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'driver_license_number' => 'nullable|string|max:255',
            'avatar_key' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $turnstileSecret = (string) config('services.turnstile.secret');
        if ($turnstileSecret === '') {
            return response()->json(['message' => 'Captcha service is not configured'], 500);
        }

        $turnstileResponse = Http::asForm()
            ->timeout(10)
            ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $turnstileSecret,
                'response' => $request->turnstile_token,
                'remoteip' => $request->ip(),
            ]);

        if (!$turnstileResponse->ok() || !$turnstileResponse->json('success')) {
            return response()->json(['message' => 'Captcha verification failed'], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $normalizedEmail,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'gender' => $request->gender,
            'date_of_birth' => $request->date_of_birth,
            'address' => $request->address,
            'country' => $request->country,
            'city' => $request->city,
            'driver_license_number' => $request->driver_license_number,
            'avatar_key' => $request->avatar_key,
            'status' => 'active',
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    // Login
    public function login(Request $request)
    {
        $normalizedEmail = mb_strtolower(trim((string) $request->email));

        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credentials = [
            'email' => $normalizedEmail,
            'password' => (string) $request->password,
        ];

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }
        } catch (\RuntimeException $e) {
            // Some legacy seed users may still have plain text passwords in DB.
            // Avoid exposing a 500 and return a normal auth failure instead.
            if (str_contains($e->getMessage(), 'Bcrypt algorithm')) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            return response()->json(['message' => 'Authentication failed'], 500);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Could not create token'], 500);
        }

        $user = auth()->user();

        if ($user->status !== 'active') {
            return response()->json(['message' => 'User account is not active'], 403);
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    // Logout
    public function logout(Request $request)
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Logged out successfully']);
    }

    // Get current user
    public function me(Request $request)
    {
        return response()->json(auth()->user());
    }

    // Refresh token
    public function refresh(Request $request)
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return response()->json([
            'message' => 'Token refreshed successfully',
            'token' => $token,
        ]);
    }
}
