<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class TicketEvent extends Model
{
    protected $fillable = ['actor_id', 'action', 'message'];
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_id'); }
}
