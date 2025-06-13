<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class RefreshOpenApiModels extends Command
{
    protected $signature = 'openapi:refresh-models 
                            {--backup : Create backup of existing models before refresh}
                            {--clean : Remove all generated models before regenerating}
                            {--spec= : Path to OpenAPI specification file}';

    protected $description = 'Refresh PHP models from OpenAPI specification';

    public function handle(): int
    {
        $this->info('🔄 Refreshing PHP models from OpenAPI specification...');

        $generatedPath = app_path('Models/Generated');
        
        // Create backup if requested
        if ($this->option('backup')) {
            $this->createBackup($generatedPath);
        }

        // Clean existing models if requested
        if ($this->option('clean')) {
            $this->cleanGeneratedModels($generatedPath);
        }

        // Regenerate models
        $specPath = $this->option('spec');
        $options = ['--force' => true];
        
        if ($specPath) {
            $options['--spec'] = $specPath;
        }

        $this->info('🚀 Regenerating models...');
        $exitCode = $this->call('openapi:generate-models', $options);

        if ($exitCode === 0) {
            $this->info('✅ Models refreshed successfully!');
            
            // Run verification
            $this->info('🔍 Running synchronization verification...');
            $this->call('openapi:verify-sync');
        } else {
            $this->error('❌ Failed to refresh models');
        }

        return $exitCode;
    }

    protected function createBackup(string $generatedPath): void
    {
        if (!File::exists($generatedPath)) {
            $this->info('📁 No generated models directory found, skipping backup');
            return;
        }

        $backupPath = $generatedPath . '_backup_' . date('Y-m-d_H-i-s');
        
        try {
            File::copyDirectory($generatedPath, $backupPath);
            $this->info("💾 Created backup at: {$backupPath}");
        } catch (\Exception $e) {
            $this->warn("⚠️  Could not create backup: " . $e->getMessage());
        }
    }

    protected function cleanGeneratedModels(string $generatedPath): void
    {
        if (!File::exists($generatedPath)) {
            $this->info('📁 No generated models directory found, nothing to clean');
            return;
        }

        try {
            $files = File::files($generatedPath);
            $deletedCount = 0;

            foreach ($files as $file) {
                if ($file->getExtension() === 'php') {
                    $content = File::get($file->getPathname());
                    
                    // Only delete files that are marked as generated
                    if (str_contains($content, '@generated')) {
                        File::delete($file->getPathname());
                        $deletedCount++;
                        $this->line("🗑️  Deleted: " . $file->getFilename());
                    }
                }
            }

            $this->info("🧹 Cleaned {$deletedCount} generated model(s)");

            // Remove directory if empty
            if (empty(File::files($generatedPath)) && empty(File::directories($generatedPath))) {
                File::deleteDirectory($generatedPath);
                $this->info('📁 Removed empty generated models directory');
            }

        } catch (\Exception $e) {
            $this->error("❌ Error cleaning generated models: " . $e->getMessage());
        }
    }
}