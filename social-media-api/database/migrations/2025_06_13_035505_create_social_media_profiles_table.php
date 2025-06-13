<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('social_media_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('platform'); // e.g., 'facebook', 'twitter', 'instagram', 'linkedin'
            $table->string('platform_user_id'); // The user ID on the social platform
            $table->string('username')->nullable(); // Username/handle on the platform
            $table->string('display_name')->nullable(); // Display name on the platform
            $table->string('profile_url')->nullable(); // URL to the profile
            $table->string('avatar_url')->nullable(); // Profile picture URL
            $table->text('bio')->nullable(); // Bio/description
            $table->json('additional_data')->nullable(); // Any additional platform-specific data
            $table->boolean('is_active')->default(true); // Whether the profile is active
            $table->timestamp('last_synced_at')->nullable(); // Last time data was synced
            $table->timestamps();
            
            // Ensure one profile per platform per user
            $table->unique(['user_id', 'platform']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_media_profiles');
    }
};
