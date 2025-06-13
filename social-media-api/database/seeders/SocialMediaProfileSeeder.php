<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SocialMediaProfile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SocialMediaProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a demo user
        $user = User::firstOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password123'),
            ]
        );

        // Create sample social media profiles
        $profiles = [
            [
                'platform' => 'twitter',
                'platform_user_id' => '123456789',
                'username' => 'demo_user',
                'display_name' => 'Demo User',
                'profile_url' => 'https://twitter.com/demo_user',
                'avatar_url' => 'https://pbs.twimg.com/profile_images/demo.jpg',
                'bio' => 'Software developer and tech enthusiast',
                'additional_data' => [
                    'followers_count' => 1250,
                    'following_count' => 890,
                    'tweets_count' => 3456,
                    'verified' => false
                ],
                'is_active' => true,
                'last_synced_at' => now(),
            ],
            [
                'platform' => 'linkedin',
                'platform_user_id' => 'demo-user-linkedin',
                'username' => 'demo-user',
                'display_name' => 'Demo User',
                'profile_url' => 'https://linkedin.com/in/demo-user',
                'avatar_url' => 'https://media.licdn.com/dms/image/demo.jpg',
                'bio' => 'Senior Software Engineer at Tech Company',
                'additional_data' => [
                    'connections_count' => 500,
                    'industry' => 'Information Technology',
                    'location' => 'San Francisco, CA'
                ],
                'is_active' => true,
                'last_synced_at' => now(),
            ],
            [
                'platform' => 'instagram',
                'platform_user_id' => '987654321',
                'username' => 'demo_user_insta',
                'display_name' => 'Demo User',
                'profile_url' => 'https://instagram.com/demo_user_insta',
                'avatar_url' => 'https://instagram.com/demo_avatar.jpg',
                'bio' => '📱 Tech lover | 🌍 Traveler | ☕ Coffee addict',
                'additional_data' => [
                    'followers_count' => 2100,
                    'following_count' => 450,
                    'posts_count' => 89,
                    'is_private' => false
                ],
                'is_active' => true,
                'last_synced_at' => now(),
            ],
            [
                'platform' => 'facebook',
                'platform_user_id' => 'demo.user.fb',
                'username' => 'demo.user',
                'display_name' => 'Demo User',
                'profile_url' => 'https://facebook.com/demo.user',
                'avatar_url' => 'https://graph.facebook.com/demo.user/picture',
                'bio' => 'Living life to the fullest!',
                'additional_data' => [
                    'friends_count' => 350,
                    'hometown' => 'New York, NY',
                    'current_city' => 'San Francisco, CA'
                ],
                'is_active' => false, // Inactive profile
                'last_synced_at' => now()->subDays(30),
            ]
        ];

        foreach ($profiles as $profileData) {
            SocialMediaProfile::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'platform' => $profileData['platform']
                ],
                $profileData + ['user_id' => $user->id]
            );
        }
    }
}
