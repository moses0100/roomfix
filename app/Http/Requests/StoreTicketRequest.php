<?php

namespace App\Http\Requests;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|min:5|max:120',
            'description' => 'required|string|min:10|max:3000',
            'category' => 'required|in:plumbing,electrical,aircon,structure,other',
            'urgency' => 'required|in:normal,high,urgent',
            'photos' => 'nullable|array|max:2',
            'photos.*' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:3072|dimensions:max_width=3000,max_height=3000',
        ];
    }
}
