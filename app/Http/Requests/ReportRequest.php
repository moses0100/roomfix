<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'manager';
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'from' => $this->input('from', now('Asia/Bangkok')->startOfMonth()->format('Y-m-d')),
            'to' => $this->input('to', now('Asia/Bangkok')->format('Y-m-d')),
        ]);
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:'.now('Asia/Bangkok')->format('Y-m-d')],
        ];
    }
}
