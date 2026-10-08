<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = ['resident_id', 'assignee_id', 'room', 'title', 'description', 'category', 'urgency', 'status', 'completion_note', 'closed_at', 'appointment_start', 'appointment_end', 'appointment_status', 'appointment_version', 'appointment_note', 'appointment_response_note'];

    protected function casts(): array
    {
        return ['closed_at' => 'datetime', 'appointment_start' => 'immutable_datetime', 'appointment_end' => 'immutable_datetime', 'appointment_version' => 'integer'];
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(TicketEvent::class)->oldest('id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(TicketPhoto::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->role === 'resident') {
            $query->where('resident_id', $user->id);
        } elseif ($user->role === 'technician') {
            $query->where('assignee_id', $user->id);
        } elseif ($user->role !== 'manager') {
            $query->whereRaw('1 = 0');
        }
    }

    public function scopeOverdue(Builder $query): void
    {
        $query->whereIn('status', ['new', 'assigned', 'in_progress', 'reopened'])->where('created_at', '<', now()->subDays(3));
    }
}
