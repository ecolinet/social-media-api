<?php

namespace App\Models\Generated;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Generated model from OpenAPI specification
 * 
 * @property int $id  Example: 1
 * @property int $user_id  Example: 1
 * @property string $platform  Example: "twitter"
 * @property string $platform_user_id  Example: "123456789"
 * @property string $username  Example: "demo_user"
 * @property string $display_name  Example: "Demo User"
 * @property string $profile_url  Example: "https:\/\/twitter.com\/demo_user"
 * @property ?string $avatar_url  Example: "https:\/\/pbs.twimg.com\/profile_images\/demo.jpg"
 * @property ?string $bio  Example: "Software developer and tech enthusiast"
 * @property ?array $additional_data  Example: {"followers_count":1250,"following_count":890,"tweets_count":3456,"verified":false}
 * @property bool $is_active  Example: true
 * @property ?\Carbon\Carbon $last_synced_at  Example: "2025-06-13T03:58:14.000000Z"
 * @property \Carbon\Carbon $created_at  Example: "2025-06-13T03:58:14.000000Z"
 * @property \Carbon\Carbon $updated_at  Example: "2025-06-13T03:58:14.000000Z"
 * 
 * @generated This file is auto-generated. Do not edit manually.
 */
class SocialMediaProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'user_id',
        'platform',
        'platform_user_id',
        'username',
        'display_name',
        'profile_url',
        'avatar_url',
        'bio',
        'additional_data',
        'is_active',
        'last_synced_at',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'additional_data' => 'array',
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get validation rules for this model.
     *
     * @return array<string, string>
     */
    public static function validationRules(): array
    {
        return [
        'id' => 'integer',
        'user_id' => 'integer',
        'platform' => 'string|in:facebook,twitter,instagram,linkedin,youtube,tiktok,snapchat,pinterest',
        'platform_user_id' => 'string',
        'username' => 'string',
        'display_name' => 'string',
        'profile_url' => 'string|url',
        'avatar_url' => 'string|url',
        'bio' => 'string',
        'is_active' => 'boolean',
        'last_synced_at' => 'string',
        'created_at' => 'string',
        'updated_at' => 'string',
    ];
    }

    /**
     * Get validation rules for creating this model.
     *
     * @return array<string, string>
     */
    public static function createValidationRules(): array
    {
        return static::validationRules();
    }

    /**
     * Get validation rules for updating this model.
     *
     * @return array<string, string>
     */
    public static function updateValidationRules(): array
    {
        $rules = static::validationRules();
        
        // Make all rules optional for updates
        foreach ($rules as $field => $rule) {
            if (str_contains($rule, 'required')) {
                $rules[$field] = str_replace('required', 'sometimes', $rule);
            }
        }
        
        return $rules;
    }
}