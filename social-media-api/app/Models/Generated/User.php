<?php

namespace App\Models\Generated;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Generated model from OpenAPI specification
 * 
 * @property int $id  Example: 1
 * @property string $name  Example: "Demo User"
 * @property string $email  Example: "demo@example.com"
 * @property ?\Carbon\Carbon $email_verified_at 
 * @property \Carbon\Carbon $created_at  Example: "2025-06-13T03:58:14.000000Z"
 * @property \Carbon\Carbon $updated_at  Example: "2025-06-13T03:58:14.000000Z"
 * 
 * @generated This file is auto-generated. Do not edit manually.
 */
class User extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'email_verified_at',
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
        'email_verified_at' => 'datetime',
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
        'name' => 'string',
        'email' => 'string|email',
        'email_verified_at' => 'string',
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