# OpenAPI Model Generation System

This document describes the OpenAPI model generation system that automatically creates and maintains PHP models from OpenAPI specifications.

## 🎯 Overview

The system provides three main commands to manage the synchronization between your OpenAPI specification and PHP models:

1. **Generate Models** - Create PHP models from OpenAPI schemas
2. **Verify Sync** - Check if models are in sync with OpenAPI specification
3. **Refresh Models** - Regenerate models with backup and verification

## 📋 Commands

### 1. Generate Models

```bash
php artisan openapi:generate-models [options]
```

**Options:**
- `--force` - Overwrite existing models
- `--dry-run` - Show what would be generated without creating files
- `--spec=path` - Path to OpenAPI specification file (default: `openapi.yaml`)

**Examples:**
```bash
# Generate models from default openapi.yaml
php artisan openapi:generate-models

# Preview what would be generated
php artisan openapi:generate-models --dry-run

# Force overwrite existing models
php artisan openapi:generate-models --force

# Use custom specification file
php artisan openapi:generate-models --spec=custom-api.yaml
```

### 2. Verify Synchronization

```bash
php artisan openapi:verify-sync [options]
```

**Options:**
- `--spec=path` - Path to OpenAPI specification file
- `--models=path` - Path to models directory (default: `app/Models`)
- `--fix` - Automatically fix minor discrepancies (future feature)

**Examples:**
```bash
# Verify sync with default settings
php artisan openapi:verify-sync

# Verify with custom specification
php artisan openapi:verify-sync --spec=custom-api.yaml

# Verify specific models directory
php artisan openapi:verify-sync --models=app/Models/Api
```

### 3. Refresh Models

```bash
php artisan openapi:refresh-models [options]
```

**Options:**
- `--backup` - Create backup of existing models before refresh
- `--clean` - Remove all generated models before regenerating
- `--spec=path` - Path to OpenAPI specification file

**Examples:**
```bash
# Refresh with backup
php artisan openapi:refresh-models --backup

# Clean refresh (removes all generated models first)
php artisan openapi:refresh-models --clean

# Full refresh with backup and custom spec
php artisan openapi:refresh-models --backup --spec=custom-api.yaml
```

## 🏗️ Generated Model Structure

### Model Location
Generated models are placed in: `app/Models/Generated/`

### Model Features
Each generated model includes:

1. **Proper Namespace**: `App\Models\Generated`
2. **PHPDoc Properties**: Type-hinted properties with examples
3. **Fillable Array**: Mass assignable attributes
4. **Casts Array**: Automatic type casting
5. **Validation Rules**: Static methods for validation
6. **Generation Marker**: `@generated` annotation

### Example Generated Model

```php
<?php

namespace App\Models\Generated;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Generated model from OpenAPI specification
 * 
 * @property int $id  Example: 1
 * @property string $platform  Example: "twitter"
 * @property string $username  Example: "demo_user"
 * @property bool $is_active  Example: true
 * @property ?\Carbon\Carbon $last_synced_at
 * 
 * @generated This file is auto-generated. Do not edit manually.
 */
class SocialMediaProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'platform',
        'username',
        'is_active',
        'last_synced_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public static function validationRules(): array
    {
        return [
            'platform' => 'required|string|in:twitter,facebook,instagram',
            'username' => 'required|string',
            'is_active' => 'boolean',
        ];
    }

    public static function createValidationRules(): array
    {
        return static::validationRules();
    }

    public static function updateValidationRules(): array
    {
        $rules = static::validationRules();
        
        foreach ($rules as $field => $rule) {
            if (str_contains($rule, 'required')) {
                $rules[$field] = str_replace('required', 'sometimes', $rule);
            }
        }
        
        return $rules;
    }
}
```

## 🔍 Verification System

The verification system checks for:

### Critical Issues (❌)
- Models defined in OpenAPI but missing as PHP classes
- Required properties in OpenAPI but not required in model validation
- Properties in OpenAPI but not in model fillable array

### Warnings (⚠️)
- Properties in model but not in OpenAPI specification
- Missing validation rules for OpenAPI properties
- Type casting mismatches between OpenAPI and model

### Suggestions (💡)
- Commands to fix issues
- Orphaned generated models
- Best practices recommendations

## 📝 OpenAPI Schema Requirements

### Supported Schema Features

1. **Basic Types**: `string`, `integer`, `number`, `boolean`, `array`, `object`
2. **Formats**: `date`, `date-time`, `email`, `uri`
3. **Validation**: `required`, `enum`, `minLength`, `maxLength`
4. **Nullability**: `nullable` property
5. **Examples**: Used in PHPDoc comments

### Schema Filtering

The system automatically skips:
- Schemas ending with `Input`, `Request`, `Response`, `Error`
- Tag descriptions and metadata schemas

### Example OpenAPI Schema

```yaml
components:
  schemas:
    SocialMediaProfile:
      type: object
      required:
        - platform
        - username
        - display_name
      properties:
        id:
          type: integer
          example: 1
        platform:
          type: string
          enum: [twitter, facebook, instagram, linkedin]
          example: "twitter"
        username:
          type: string
          example: "demo_user"
        display_name:
          type: string
          example: "Demo User"
        is_active:
          type: boolean
          default: true
          example: true
        created_at:
          type: string
          format: date-time
          example: "2025-06-13T03:58:14.000000Z"
```

## 🔄 Workflow Integration

### Development Workflow

1. **Update OpenAPI Specification**
   ```bash
   # Edit openapi.yaml with new schemas or changes
   ```

2. **Generate/Refresh Models**
   ```bash
   php artisan openapi:refresh-models --backup
   ```

3. **Verify Synchronization**
   ```bash
   php artisan openapi:verify-sync
   ```

4. **Fix Any Issues**
   - Update OpenAPI specification if needed
   - Regenerate models if necessary

### CI/CD Integration

Add to your CI pipeline:

```bash
# Verify models are in sync
php artisan openapi:verify-sync

# Fail build if critical issues found
if [ $? -ne 0 ]; then
    echo "Models are not in sync with OpenAPI specification"
    exit 1
fi
```

## 🛠️ Customization

### Custom Model Templates

To customize generated models, modify the `generateModelContent()` method in:
`app/Console/Commands/GenerateModelsFromOpenApi.php`

### Custom Validation Rules

The system generates basic validation rules. For complex validation:

1. Create custom validation classes
2. Override validation methods in generated models
3. Use the generated rules as a base

### Custom Type Mapping

Modify the `getCastType()` method to customize how OpenAPI types map to Laravel casts.

## 🚨 Best Practices

### 1. Version Control
- Always commit generated models to version control
- Use `--backup` option when refreshing in production
- Review generated changes before committing

### 2. Model Organization
- Keep generated models separate from hand-written models
- Don't edit generated models directly (they'll be overwritten)
- Extend generated models if you need custom functionality

### 3. OpenAPI Design
- Use clear, descriptive schema names
- Include examples for better documentation
- Define proper validation constraints
- Use consistent naming conventions

### 4. Regular Verification
- Run verification after OpenAPI changes
- Include verification in your test suite
- Set up automated checks in CI/CD

## 🔧 Troubleshooting

### Common Issues

1. **YAML Parsing Errors**
   ```bash
   # Validate your YAML syntax
   php -r "var_dump(yaml_parse_file('openapi.yaml'));"
   ```

2. **Missing Models**
   ```bash
   # Check if schemas are properly defined
   php artisan openapi:generate-models --dry-run
   ```

3. **Validation Mismatches**
   ```bash
   # Review the verification output
   php artisan openapi:verify-sync
   ```

4. **Permission Issues**
   ```bash
   # Ensure proper permissions for Models directory
   chmod -R 755 app/Models/
   ```

### Debug Mode

For debugging, add verbose output to commands by modifying the `handle()` methods to include more detailed logging.

## 📚 Dependencies

- **Symfony YAML**: For parsing YAML files
- **Laravel Framework**: Core functionality
- **PHP Reflection**: For model analysis

## 🔮 Future Enhancements

- [ ] Automatic relationship detection
- [ ] Custom validation rule generation
- [ ] Model factory generation
- [ ] Migration generation from schemas
- [ ] API resource generation
- [ ] Test generation
- [ ] Real-time sync monitoring
- [ ] IDE integration plugins

## 📄 License

This model generation system is part of the Social Media Profiles API project and follows the same MIT license.