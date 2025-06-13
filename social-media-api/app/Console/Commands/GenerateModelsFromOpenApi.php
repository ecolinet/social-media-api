<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;

class GenerateModelsFromOpenApi extends Command
{
    protected $signature = 'openapi:generate-models 
                            {--force : Overwrite existing models}
                            {--dry-run : Show what would be generated without creating files}
                            {--spec= : Path to OpenAPI specification file}';

    protected $description = 'Generate PHP models from OpenAPI specification';

    protected array $generatedFiles = [];
    protected array $skippedFiles = [];

    public function handle(): int
    {
        $this->info('🚀 Generating PHP models from OpenAPI specification...');

        $specPath = $this->option('spec') ?: base_path('openapi.yaml');
        
        if (!File::exists($specPath)) {
            $this->error("OpenAPI specification file not found: {$specPath}");
            return 1;
        }

        try {
            $spec = $this->loadOpenApiSpec($specPath);
            $schemas = $spec['components']['schemas'] ?? [];

            if (empty($schemas)) {
                $this->warn('No schemas found in OpenAPI specification');
                return 0;
            }

            $this->info("Found " . count($schemas) . " schemas to process");

            foreach ($schemas as $schemaName => $schemaDefinition) {
                $this->processSchema($schemaName, $schemaDefinition);
            }

            $this->displaySummary();

            return 0;
        } catch (\Exception $e) {
            $this->error("Error processing OpenAPI specification: " . $e->getMessage());
            return 1;
        }
    }

    protected function loadOpenApiSpec(string $path): array
    {
        $content = File::get($path);
        
        if (Str::endsWith($path, '.yaml') || Str::endsWith($path, '.yml')) {
            return Yaml::parse($content);
        }
        
        return json_decode($content, true);
    }

    protected function parseSimpleYaml(string $content): array
    {
        // Simple YAML parser for our specific use case
        $lines = explode("\n", $content);
        $result = [];
        $currentPath = [];
        $schemas = [];
        $inSchemas = false;
        $currentSchema = null;
        $currentSchemaData = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if (empty($trimmed) || str_starts_with($trimmed, '#')) {
                continue;
            }

            $indent = strlen($line) - strlen(ltrim($line));
            
            if (str_contains($line, 'schemas:')) {
                $inSchemas = true;
                continue;
            }

            if ($inSchemas && $indent === 4 && str_contains($line, ':')) {
                // New schema
                if ($currentSchema && !empty($currentSchemaData)) {
                    $schemas[$currentSchema] = $currentSchemaData;
                }
                $currentSchema = trim(str_replace(':', '', $line));
                $currentSchemaData = ['type' => 'object', 'properties' => []];
                continue;
            }

            if ($inSchemas && $currentSchema && str_contains($line, 'properties:')) {
                continue;
            }

            if ($inSchemas && $currentSchema && $indent >= 8 && str_contains($line, ':')) {
                // Property
                $property = trim(str_replace(':', '', $line));
                $currentSchemaData['properties'][$property] = ['type' => 'string'];
            }
        }

        if ($currentSchema && !empty($currentSchemaData)) {
            $schemas[$currentSchema] = $currentSchemaData;
        }

        return ['components' => ['schemas' => $schemas]];
    }

    protected function processSchema(string $schemaName, array $schemaDefinition): void
    {
        // Skip input/request schemas and error responses
        if (Str::endsWith($schemaName, 'Input') || 
            Str::endsWith($schemaName, 'Request') || 
            Str::endsWith($schemaName, 'Response') ||
            Str::endsWith($schemaName, 'Error')) {
            $this->skippedFiles[] = $schemaName . ' (input/response schema)';
            return;
        }

        $modelName = $this->getModelName($schemaName);
        $modelPath = app_path("Models/Generated/{$modelName}.php");

        if (File::exists($modelPath) && !$this->option('force')) {
            $this->skippedFiles[] = $modelName . ' (already exists)';
            return;
        }

        $modelContent = $this->generateModelContent($modelName, $schemaDefinition);

        if ($this->option('dry-run')) {
            $this->line("Would generate: {$modelPath}");
            $this->line($modelContent);
            $this->line(str_repeat('-', 80));
            return;
        }

        // Ensure directory exists
        $directory = dirname($modelPath);
        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        File::put($modelPath, $modelContent);
        $this->generatedFiles[] = $modelName;
        $this->info("✅ Generated: {$modelName}");
    }

    protected function getModelName(string $schemaName): string
    {
        // Convert schema name to proper model name
        return Str::studly($schemaName);
    }

    protected function generateModelContent(string $modelName, array $schemaDefinition): string
    {
        $properties = $schemaDefinition['properties'] ?? [];
        $required = $schemaDefinition['required'] ?? [];

        $fillable = [];
        $casts = [];
        $rules = [];
        $docProperties = [];

        foreach ($properties as $propertyName => $propertyDefinition) {
            $fillable[] = $propertyName;
            
            // Generate cast based on type
            $cast = $this->getCastType($propertyDefinition);
            if ($cast) {
                $casts[$propertyName] = $cast;
            }

            // Generate validation rules
            $rule = $this->getValidationRule($propertyDefinition, in_array($propertyName, $required));
            if ($rule) {
                $rules[$propertyName] = $rule;
            }

            // Generate doc property
            $docProperties[] = $this->getDocProperty($propertyName, $propertyDefinition);
        }

        $namespace = 'App\\Models\\Generated';
        $uses = [
            'Illuminate\\Database\\Eloquent\\Model',
            'Illuminate\\Database\\Eloquent\\Factories\\HasFactory',
        ];

        $fillableString = $this->arrayToString($fillable);
        $castsString = $this->arrayToString($casts, true);
        $rulesString = $this->arrayToString($rules, true);
        $docPropertiesString = implode("\n * ", $docProperties);

        return <<<PHP
<?php

namespace {$namespace};

use {$uses[0]};
use {$uses[1]};

/**
 * Generated model from OpenAPI specification
 * 
 * {$docPropertiesString}
 * 
 * @generated This file is auto-generated. Do not edit manually.
 */
class {$modelName} extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected \$fillable = {$fillableString};

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected \$casts = {$castsString};

    /**
     * Get validation rules for this model.
     *
     * @return array<string, string>
     */
    public static function validationRules(): array
    {
        return {$rulesString};
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
        \$rules = static::validationRules();
        
        // Make all rules optional for updates
        foreach (\$rules as \$field => \$rule) {
            if (str_contains(\$rule, 'required')) {
                \$rules[\$field] = str_replace('required', 'sometimes', \$rule);
            }
        }
        
        return \$rules;
    }
}
PHP;
    }

    protected function getCastType(array $propertyDefinition): ?string
    {
        $type = $propertyDefinition['type'] ?? 'string';
        $format = $propertyDefinition['format'] ?? null;

        return match ($type) {
            'integer' => 'integer',
            'number' => 'float',
            'boolean' => 'boolean',
            'array' => 'array',
            'object' => 'array',
            'string' => match ($format) {
                'date' => 'date',
                'date-time' => 'datetime',
                'email' => null,
                'uri' => null,
                default => null,
            },
            default => null,
        };
    }

    protected function getValidationRule(array $propertyDefinition, bool $required): string
    {
        $rules = [];
        
        if ($required) {
            $rules[] = 'required';
        }

        $type = $propertyDefinition['type'] ?? 'string';
        $format = $propertyDefinition['format'] ?? null;

        switch ($type) {
            case 'integer':
                $rules[] = 'integer';
                break;
            case 'number':
                $rules[] = 'numeric';
                break;
            case 'boolean':
                $rules[] = 'boolean';
                break;
            case 'array':
                $rules[] = 'array';
                break;
            case 'string':
                $rules[] = 'string';
                if ($format === 'email') {
                    $rules[] = 'email';
                } elseif ($format === 'uri') {
                    $rules[] = 'url';
                }
                if (isset($propertyDefinition['minLength'])) {
                    $rules[] = 'min:' . $propertyDefinition['minLength'];
                }
                if (isset($propertyDefinition['maxLength'])) {
                    $rules[] = 'max:' . $propertyDefinition['maxLength'];
                }
                break;
        }

        if (isset($propertyDefinition['enum'])) {
            $enumValues = implode(',', $propertyDefinition['enum']);
            $rules[] = "in:{$enumValues}";
        }

        return implode('|', $rules);
    }

    protected function getDocProperty(string $propertyName, array $propertyDefinition): string
    {
        $type = $propertyDefinition['type'] ?? 'string';
        $format = $propertyDefinition['format'] ?? null;
        $nullable = $propertyDefinition['nullable'] ?? false;

        $phpType = match ($type) {
            'integer' => 'int',
            'number' => 'float',
            'boolean' => 'bool',
            'array' => 'array',
            'object' => 'array',
            'string' => match ($format) {
                'date', 'date-time' => '\\Carbon\\Carbon',
                default => 'string',
            },
            default => 'mixed',
        };

        if ($nullable) {
            $phpType = "?{$phpType}";
        }

        $description = $propertyDefinition['description'] ?? '';
        $example = isset($propertyDefinition['example']) ? ' Example: ' . json_encode($propertyDefinition['example']) : '';

        return "@property {$phpType} \${$propertyName} {$description}{$example}";
    }

    protected function arrayToString(array $array, bool $associative = false): string
    {
        if (empty($array)) {
            return '[]';
        }

        if (!$associative) {
            $items = array_map(fn($item) => "'{$item}'", $array);
            return "[\n        " . implode(",\n        ", $items) . ",\n    ]";
        }

        $items = [];
        foreach ($array as $key => $value) {
            $items[] = "'{$key}' => '{$value}'";
        }
        return "[\n        " . implode(",\n        ", $items) . ",\n    ]";
    }

    protected function displaySummary(): void
    {
        $this->newLine();
        $this->info('📊 Generation Summary:');
        
        if (!empty($this->generatedFiles)) {
            $this->info('✅ Generated models (' . count($this->generatedFiles) . '):');
            foreach ($this->generatedFiles as $file) {
                $this->line("   - {$file}");
            }
        }

        if (!empty($this->skippedFiles)) {
            $this->warn('⏭️  Skipped (' . count($this->skippedFiles) . '):');
            foreach ($this->skippedFiles as $file) {
                $this->line("   - {$file}");
            }
        }

        $this->newLine();
        $this->info('💡 Generated models are located in: app/Models/Generated/');
        $this->info('💡 Use --force to overwrite existing models');
        $this->info('💡 Use --dry-run to preview without creating files');
    }
}