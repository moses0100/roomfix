<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class TicketUpdated extends Notification
{
    public function __construct(public int $ticketId, public string $message) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['ticket_id' => $this->ticketId, 'message' => $this->message];
    }
}
