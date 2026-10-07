<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransitionTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ability = in_array($this->input('action'), ['start', 'finish']) ? 'work' : 'confirm';

        return $this->user()->can($ability, $this->route('ticket'));
    }

    public function rules(): array
    {
        return ['action' => 'required|in:start,finish,confirm,reopen', 'note' => 'nullable|required_if:action,finish,reopen|string|min:5|max:1500'];
    }
}
