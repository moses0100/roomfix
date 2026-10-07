<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        return $user->role === 'manager'
            || ($user->role === 'resident' && $ticket->resident_id === $user->id)
            || ($user->role === 'technician' && $ticket->assignee_id === $user->id);
    }

    public function create(User $user): bool
    {
        return $user->role === 'resident' && filled($user->room);
    }

    public function assign(User $user, Ticket $ticket): bool
    {
        return $user->role === 'manager';
    }

    public function work(User $user, Ticket $ticket): bool
    {
        return $user->role === 'technician' && $ticket->assignee_id === $user->id;
    }

    public function confirm(User $user, Ticket $ticket): bool
    {
        return $user->role === 'resident' && $ticket->resident_id === $user->id;
    }
}
