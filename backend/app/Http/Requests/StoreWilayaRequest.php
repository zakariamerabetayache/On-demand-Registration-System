<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWilayaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'designation_ar' => 'required|string|max:255|regex:/^[\p{Arabic}\s]+$/u',
            'designation_fr' => 'required|string|max:255|regex:/^[\p{Latin}\s\'\-\.]+$/u',
            'postalw' => 'required|integer|unique:wilayas,postalw',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'designation_ar.required' => 'يرجى إدخال اسم الولاية بالعربية',
            'designation_ar.string' => 'اسم الولاية بالعربية يجب أن يكون نص',
            'designation_ar.max' => 'اسم الولاية بالعربية يجب أن يكون أقل من 255 حرف',
            'designation_fr.required' => 'يرجى إدخال اسم الولاية بالفرنسية',
            'designation_fr.string' => 'اسم الولاية بالفرنسية يجب أن يكون نص',
            'designation_fr.max' => 'اسم الولاية بالفرنسية يجب أن يكون أقل من 255 حرف',
            'postalw.required' => 'يرجى إدخال الرمز البريدي للولاية',
            'postalw.integer' => 'الرمز البريدي يجب أن يكون رقم',
            'postalw.unique' => 'الرمز البريدي موجود مسبقاً',
            'designation_ar.regex' => 'اسم الولاية بالعربية يجب أن يحتوي على أحرف عربية فقط',
            'designation_fr.regex' => 'اسم الولاية بالفرنسية يجب أن يحتوي على أحرف لاتينية فقط',
        ];
    }
}
