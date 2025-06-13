<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialMediaProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SocialMediaProfileController extends Controller
{
    /**
     * Display a listing of the authenticated user's social media profiles.
     */
    public function index(Request $request): JsonResponse
    {
        $profiles = $request->user()->socialMediaProfiles()
            ->when($request->platform, function ($query, $platform) {
                return $query->platform($platform);
            })
            ->when($request->active !== null, function ($query) use ($request) {
                return $query->where('is_active', $request->boolean('active'));
            })
            ->orderBy('platform')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'profiles' => $profiles,
                'total' => $profiles->count()
            ]
        ]);
    }

    /**
     * Store a newly created social media profile.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:facebook,twitter,instagram,linkedin,youtube,tiktok,snapchat,pinterest',
            'platform_user_id' => 'required|string',
            'username' => 'nullable|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'profile_url' => 'nullable|url|max:500',
            'avatar_url' => 'nullable|url|max:500',
            'bio' => 'nullable|string|max:1000',
            'additional_data' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if profile already exists for this platform
        $existingProfile = $request->user()->socialMediaProfiles()
            ->where('platform', $request->platform)
            ->first();

        if ($existingProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile for this platform already exists. Use PUT to update.'
            ], 409);
        }

        $profile = $request->user()->socialMediaProfiles()->create([
            'platform' => $request->platform,
            'platform_user_id' => $request->platform_user_id,
            'username' => $request->username,
            'display_name' => $request->display_name,
            'profile_url' => $request->profile_url,
            'avatar_url' => $request->avatar_url,
            'bio' => $request->bio,
            'additional_data' => $request->additional_data,
            'is_active' => $request->boolean('is_active', true),
            'last_synced_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Social media profile created successfully',
            'data' => [
                'profile' => $profile
            ]
        ], 201);
    }

    /**
     * Display the specified social media profile.
     */
    public function show(Request $request, SocialMediaProfile $socialMediaProfile): JsonResponse
    {
        // Ensure the profile belongs to the authenticated user
        if ($socialMediaProfile->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $socialMediaProfile
            ]
        ]);
    }

    /**
     * Update the specified social media profile.
     */
    public function update(Request $request, SocialMediaProfile $socialMediaProfile): JsonResponse
    {
        // Ensure the profile belongs to the authenticated user
        if ($socialMediaProfile->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'platform_user_id' => 'sometimes|required|string',
            'username' => 'nullable|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'profile_url' => 'nullable|url|max:500',
            'avatar_url' => 'nullable|url|max:500',
            'bio' => 'nullable|string|max:1000',
            'additional_data' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $socialMediaProfile->update(array_merge(
            $request->only([
                'platform_user_id',
                'username',
                'display_name',
                'profile_url',
                'avatar_url',
                'bio',
                'additional_data',
                'is_active'
            ]),
            ['last_synced_at' => now()]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Social media profile updated successfully',
            'data' => [
                'profile' => $socialMediaProfile->fresh()
            ]
        ]);
    }

    /**
     * Remove the specified social media profile.
     */
    public function destroy(Request $request, SocialMediaProfile $socialMediaProfile): JsonResponse
    {
        // Ensure the profile belongs to the authenticated user
        if ($socialMediaProfile->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        $socialMediaProfile->delete();

        return response()->json([
            'success' => true,
            'message' => 'Social media profile deleted successfully'
        ]);
    }

    /**
     * Get profiles grouped by platform.
     */
    public function byPlatform(Request $request): JsonResponse
    {
        $profiles = $request->user()->socialMediaProfiles()
            ->active()
            ->get()
            ->groupBy('platform');

        return response()->json([
            'success' => true,
            'data' => [
                'profiles_by_platform' => $profiles,
                'platforms' => $profiles->keys(),
                'total_platforms' => $profiles->count()
            ]
        ]);
    }

    /**
     * Sync profile data (placeholder for external API integration).
     */
    public function sync(Request $request, SocialMediaProfile $socialMediaProfile): JsonResponse
    {
        // Ensure the profile belongs to the authenticated user
        if ($socialMediaProfile->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        // This is where you would integrate with external APIs
        // For now, we'll just update the last_synced_at timestamp
        $socialMediaProfile->update([
            'last_synced_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile synced successfully',
            'data' => [
                'profile' => $socialMediaProfile->fresh()
            ]
        ]);
    }
}
