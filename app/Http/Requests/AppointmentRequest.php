<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ability = in_array($this->input('action'), ['propose', 'cancel']) ? 'assign' : 'confirm';

        return $this->user()->can($ability, $this->route('ticket'));
    }

    public function rules(): array
    {
        $rules = ['action' => 'required|in:propose,confirm,decline,cancel', 'version' => 'required|integer|min:0', 'note' => 'nullable|string|max:500'];
        if ($this->input('action') === 'propose') {
            // Explicit ISO offsets avoid interpreting a resident's local clock as UTC.
            $iso = 'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/';
            $rules['start'] = ['required', 'date', $iso, 'after:now', 'before:'.now()->addDays(90)->toIso8601String()];
            $rules['end'] = ['required', 'date', $iso, 'after:start'];
        } elseif ($this->input('action') === 'decline') {
            $rules['note'] = 'required|string|min:5|max:500';
        }

        return $rules;
    }
}
