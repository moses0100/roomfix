<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestampTz('appointment_start')->nullable();
            $table->timestampTz('appointment_end')->nullable();
            $table->string('appointment_status', 20)->nullable();
            $table->unsignedInteger('appointment_version')->default(0);
            $table->text('appointment_note')->nullable();
            $table->text('appointment_response_note')->nullable();
            $table->index(['assignee_id', 'appointment_status', 'appointment_start'], 'tickets_appointment_lookup');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_appointment_lookup');
            $table->dropColumn(['appointment_start', 'appointment_end', 'appointment_status', 'appointment_version', 'appointment_note', 'appointment_response_note']);
        });
    }
};
