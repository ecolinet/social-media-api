<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionProperty;
use Symfony\Component\Yaml\Yaml;

class VerifyOpenApiSync extends Command
{
    protected $signature = 'openapi:verify-sync 
                            {--spec= : Path to OpenAPI specification file}
                            {--models= : Path to models directory}
                            {--fix : Automatically fix minor discrepancies}';

    protected $description = 'Verify that PHP models are in sync with OpenAPI specification';

    protected array $issues = [];
    protected array $warnings = [];
    protected array $suggestions = [];

    public function handle(): int
    {
        $this->info('🔍 Verifying synchronization between PHP models and OpenAPI specification...');

        $specPath = $this->option('spec') ?: base_path('openapi.yaml');
        $modelsPath = $this->option('models') ?: app_path('Models');

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

            $this->info("Found " . count($schemas) . " schemas to verify");

            // Get existing models
            $existingModels = $this->getExistingModels($modelsPath);
            
            // Verify each schema against corresponding model
            foreach ($schemas as $schemaName => $schemaDefinition) {
                $this->verifySchema($schemaName, $schemaDefinition, $existingModels);
            }

            // Check for orphaned models
            $this->checkOrphanedModels($schemas, $existingModels);

            $this->displayResults();

            return empty($this->issues) ? 0 : 1;

        } catch (\Exception $e) {
            $this->error("Error verifying synchronization: " . $e->getMessage());
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
        $schemas = [];
        $inSchemas = false;
        $currentSchema = null;
        $currentSchemaData = [];
        $inProperties = false;

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
                // Save previous schema
                if ($currentSchema && !empty($currentSchemaData)) {
                    $schemas[$currentSchema] = $currentSchemaData;
                }
                
                // New schema
                $currentSchema = trim(str_replace(':', '', $line));
                $currentSchemaData = ['type' => 'object', 'properties' => [], 'required' => []];
                $inProperties = false;
                continue;
            }

            if ($inSchemas && $currentSchema) {
                if (str_contains($line, 'properties:')) {
                    $inProperties = true;
                    continue;
                }

                if (str_contains($line, 'required:')) {
                    $inProperties = false;
                    continue;
                }

                if ($inProperties && $indent >= 8 && str_contains($line, ':')) {
                    // Property
                    $property = trim(str_replace(':', '', $line));
                    $currentSchemaData['properties'][$property] = [
                        'type' => 'string', // Default type
                        'description' => ''
                    ];
                }
            }
        }

        if ($currentSchema && !empty($currentSchemaData)) {
            $schemas[$currentSchema] = $currentSchemaData;
        }

        return ['components' => ['schemas' => $schemas]];
    }

    protected function getExistingModels(string $modelsPath): array
    {
        $models = [];
        
        // Get models from main Models directory
        $this->scanModelsDirectory($modelsPath, $models, 'App\\Models');
        
        // Get models from Generated directory
        $generatedPath = $modelsPath . '/Generated';
        if (File::exists($generatedPath)) {
            $this->scanModelsDirectory($generatedPath, $models, 'App\\Models\\Generated');
        }

        return $models;
    }

    protected function scanModelsDirectory(string $path, array &$models, string $namespace): void
    {
        if (!File::exists($path)) {
            return;
        }

        $files = File::files($path);
        
        foreach ($files as $file) {
            if ($file->getExtension() === 'php') {
                $className = $file->getFilenameWithoutExtension();
                $fullClassName = $namespace . '\\' . $className;
                
                if (class_exists($fullClassName)) {
                    try {
                        $reflection = new ReflectionClass($fullClassName);
                        if (!$reflection->isAbstract() && $reflection->isSubclassOf('Illuminate\\Database\\Eloquent\\Model')) {
                            $models[$className] = [
                                'class' => $fullClassName,
                                'reflection' => $reflection,
                                'path' => $file->getPathname()
                            ];
                        }
                    } catch (\Exception $e) {
                        $this->warnings[] = "Could not analyze model {$fullClassName}: " . $e->getMessage();
                    }
                }
            }
        }
    }

    protected function verifySchema(string $schemaName, array $schemaDefinition, array $existingModels): void
    {
        // Skip input/response schemas
        if (Str::endsWith($schemaName, 'Input') || 
            Str::endsWith($schemaName, 'Request') || 
            Str::endsWith($schemaName, 'Response') ||
            Str::endsWith($schemaName, 'Error')) {
            return;
        }

        $modelName = Str::studly($schemaName);
        
        if (!isset($existingModels[$modelName])) {
            $this->issues[] = "❌ Model {$modelName} is defined in OpenAPI but does not exist as PHP model";
            $this->suggestions[] = "💡 Run 'php artisan openapi:generate-models' to generate missing models";
            return;
        }

        $model = $existingModels[$modelName];
        $this->verifyModelProperties($schemaName, $schemaDefinition, $model);
        $this->verifyModelValidation($schemaName, $schemaDefinition, $model);
        $this->verifyModelCasts($schemaName, $schemaDefinition, $model);
    }

    protected function verifyModelProperties(string $schemaName, array $schemaDefinition, array $model): void
    {
        $schemaProperties = array_keys($schemaDefinition['properties'] ?? []);
        $modelClass = $model['class'];
        
        try {
            $modelInstance = new $modelClass();
            $fillable = $modelInstance->getFillable();
            
            // Check for missing properties in model
            $missingInModel = array_diff($schemaProperties, $fillable);
            foreach ($missingInModel as $property) {
                $this->issues[] = "❌ Property '{$property}' is defined in OpenAPI schema '{$schemaName}' but not in model fillable array";
            }
            
            // Check for extra properties in model
            $extraInModel = array_diff($fillable, $schemaProperties);
            foreach ($extraInModel as $property) {
                // Skip common Laravel properties
                if (!in_array($property, ['id', 'created_at', 'updated_at', 'deleted_at'])) {
                    $this->warnings[] = "⚠️  Property '{$property}' is in model '{$modelClass}' fillable but not defined in OpenAPI schema";
                }
            }
            
        } catch (\Exception $e) {
            $this->warnings[] = "Could not instantiate model {$modelClass}: " . $e->getMessage();
        }
    }

    protected function verifyModelValidation(string $schemaName, array $schemaDefinition, array $model): void
    {
        $modelClass = $model['class'];
        
        if (!method_exists($modelClass, 'validationRules')) {
            $this->warnings[] = "⚠️  Model '{$modelClass}' does not have validationRules() method";
            return;
        }
        
        try {
            $validationRules = $modelClass::validationRules();
            $schemaProperties = $schemaDefinition['properties'] ?? [];
            $requiredProperties = $schemaDefinition['required'] ?? [];
            
            foreach ($schemaProperties as $propertyName => $propertyDefinition) {
                if (!isset($validationRules[$propertyName])) {
                    $this->warnings[] = "⚠️  Property '{$propertyName}' in schema '{$schemaName}' has no validation rule in model";
                    continue;
                }
                
                $rule = $validationRules[$propertyName];
                $isRequired = in_array($propertyName, $requiredProperties);
                
                if ($isRequired && !str_contains($rule, 'required')) {
                    $this->issues[] = "❌ Property '{$propertyName}' is required in OpenAPI but not in model validation";
                }
                
                if (!$isRequired && str_contains($rule, 'required')) {
                    $this->issues[] = "❌ Property '{$propertyName}' is not required in OpenAPI but is required in model validation";
                }
            }
            
        } catch (\Exception $e) {
            $this->warnings[] = "Could not get validation rules from {$modelClass}: " . $e->getMessage();
        }
    }

    protected function verifyModelCasts(string $schemaName, array $schemaDefinition, array $model): void
    {
        $modelClass = $model['class'];
        
        try {
            $modelInstance = new $modelClass();
            $casts = $modelInstance->getCasts();
            $schemaProperties = $schemaDefinition['properties'] ?? [];
            
            foreach ($schemaProperties as $propertyName => $propertyDefinition) {
                $expectedCast = $this->getExpectedCast($propertyDefinition);
                
                if ($expectedCast && !isset($casts[$propertyName])) {
                    $this->warnings[] = "⚠️  Property '{$propertyName}' in schema '{$schemaName}' should have cast '{$expectedCast}' but none is defined";
                } elseif ($expectedCast && isset($casts[$propertyName]) && $casts[$propertyName] !== $expectedCast) {
                    $this->warnings[] = "⚠️  Property '{$propertyName}' has cast '{$casts[$propertyName]}' but OpenAPI suggests '{$expectedCast}'";
                }
            }
            
        } catch (\Exception $e) {
            $this->warnings[] = "Could not get casts from {$modelClass}: " . $e->getMessage();
        }
    }

    protected function getExpectedCast(array $propertyDefinition): ?string
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
                default => null,
            },
            default => null,
        };
    }

    protected function checkOrphanedModels(array $schemas, array $existingModels): void
    {
        $schemaModelNames = [];
        
        foreach (array_keys($schemas) as $schemaName) {
            if (!Str::endsWith($schemaName, 'Input') && 
                !Str::endsWith($schemaName, 'Request') && 
                !Str::endsWith($schemaName, 'Response') &&
                !Str::endsWith($schemaName, 'Error')) {
                $schemaModelNames[] = Str::studly($schemaName);
            }
        }
        
        foreach ($existingModels as $modelName => $modelData) {
            if (!in_array($modelName, $schemaModelNames)) {
                // Check if it's a generated model
                if (str_contains($modelData['class'], 'Generated')) {
                    $this->warnings[] = "⚠️  Generated model '{$modelName}' exists but has no corresponding OpenAPI schema";
                    $this->suggestions[] = "💡 Consider removing orphaned generated model or adding it to OpenAPI specification";
                }
            }
        }
    }

    protected function displayResults(): void
    {
        $this->newLine();
        
        if (empty($this->issues) && empty($this->warnings)) {
            $this->info('✅ All models are in sync with OpenAPI specification!');
            return;
        }
        
        if (!empty($this->issues)) {
            $this->error('🚨 Critical Issues Found (' . count($this->issues) . '):');
            foreach ($this->issues as $issue) {
                $this->line("   {$issue}");
            }
            $this->newLine();
        }
        
        if (!empty($this->warnings)) {
            $this->warn('⚠️  Warnings (' . count($this->warnings) . '):');
            foreach ($this->warnings as $warning) {
                $this->line("   {$warning}");
            }
            $this->newLine();
        }
        
        if (!empty($this->suggestions)) {
            $this->info('💡 Suggestions:');
            foreach (array_unique($this->suggestions) as $suggestion) {
                $this->line("   {$suggestion}");
            }
            $this->newLine();
        }
        
        $this->info('📊 Summary:');
        $this->line("   Issues: " . count($this->issues));
        $this->line("   Warnings: " . count($this->warnings));
        
        if (!empty($this->issues)) {
            $this->newLine();
            $this->error('❌ Synchronization verification failed. Please fix the issues above.');
        } else {
            $this->newLine();
            $this->info('✅ No critical issues found. Models are mostly in sync with OpenAPI specification.');
        }
    }
}