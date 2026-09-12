<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommuneRequest extends FormRequest
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
            'wilaya_id' => 'required|integer|exists:wilayas,id',
            'postalc' => 'required|integer|unique:communes,postalc',
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
            'designation_ar.required' => 'يرجى إدخال اسم البلدية بالعربية',
            'designation_ar.string' => 'اسم البلدية بالعربية يجب أن يكون نص',
            'designation_ar.max' => 'اسم البلدية بالعربية يجب أن يكون أقل من 255 حرف',
            'designation_fr.required' => 'يرجى إدخال اسم البلدية بالفرنسية',
            'designation_fr.string' => 'اسم البلدية بالفرنسية يجب أن يكون نص',
            'designation_fr.max' => 'اسم البلدية بالفرنسية يجب أن يكون أقل من 255 حرف',
            'wilaya_id.required' => 'يرجى اختيار الولاية',
            'wilaya_id.integer' => 'معرف الولاية يجب أن يكون رقم',
            'wilaya_id.exists' => 'الولاية المختارة غير موجودة',
            'postalc.required' => 'يرجى إدخال الرمز البريدي للبلدية',
            'postalc.integer' => 'الرمز البريدي يجب أن يكون رقم',
            'postalc.unique' => 'الرمز البريدي موجود مسبقاً',
            'designation_ar.regex' => 'اسم البلدية بالعربية يجب أن يحتوي على أحرف عربية فقط',
            'designation_fr.regex' => 'اسم البلدية بالفرنسية يجب أن يحتوي على أحرف لاتينية فقط',
        ];
    }
}
