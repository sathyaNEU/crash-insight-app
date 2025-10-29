<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RunDDL extends Command
{
    protected $signature = 'db:run-ddl';
    protected $description = 'Execute the DDL and view SQL files to set up the database schema.';

    public function handle()
    {
        try {
            $ddlPath = base_path('database/ddl.sql');
            $viewPath = base_path('database/view.sql');

            $this->info("Running DDL file...");
            DB::unprepared(File::get($ddlPath));
            $this->info("Schema created successfully.");

            $this->info("Running view DDL file...");
            DB::unprepared(File::get($viewPath));
            $this->info("View(s) created successfully.");

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Error executing SQL: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
