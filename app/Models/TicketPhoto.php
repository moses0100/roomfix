<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class TicketPhoto extends Model
{
    protected $fillable = ['path', 'mime'];
    protected $hidden = ['path'];
    public function ticket(): BelongsTo { return $this->belongsTo(Ticket::class); }
}
