<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = ['resident_id', 'assignee_id', 'room', 'title', 'description', 'category', 'urgency', 'status', 'completion_note', 'closed_at'];

    protected function casts(): array { return ['closed_at' => 'datetime']; }
    public function resident(): BelongsTo { return $this->belongsTo(User::class, 'resident_id'); }
    public function assignee(): BelongsTo { return $this->belongsTo(User::class, 'assignee_id'); }
    public function events(): HasMany { return $this->hasMany(TicketEvent::class)->oldest('id'); }
    public function photos(): HasMany { return $this->hasMany(TicketPhoto::class); }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->role === 'resident') $query->where('resident_id', $user->id);
        elseif ($user->role === 'technician') $query->where('assignee_id', $user->id);
        elseif ($user->role !== 'manager') $query->whereRaw('1 = 0');
    }
}
