<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('resident')->index();
            $table->string('room', 20)->nullable();
        });
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('room', 20);
            $table->string('title', 120);
            $table->text('description');
            $table->string('category', 30);
            $table->string('urgency', 20)->default('normal');
            $table->string('status', 30)->default('new');
            $table->text('completion_note')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['resident_id', 'status']);
            $table->index(['assignee_id', 'status']);
            $table->index(['status', 'created_at']);
        });
        Schema::create('ticket_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 30);
            $table->text('message');
            $table->timestamps();
        });
        Schema::create('ticket_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('mime', 40);
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('ticket_photos');
        Schema::dropIfExists('ticket_events');
        Schema::dropIfExists('tickets');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'room']));
    }
};
