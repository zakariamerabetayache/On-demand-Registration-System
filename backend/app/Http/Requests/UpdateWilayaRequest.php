<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWilayaRequest extends FormRequest
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
        $wilayaId = $this->route('wilaya');
        
        return [
            'designation_ar' => 'required|string|max:255|regex:/^[\p{Arabic}\s]+$/u',
            'designation_fr' => 'required|string|max:255|regex:/^[\p{Latin}\s\'\-\.]+$/u',
            'postalw' => 'required|integer|unique:wilayas,postalw,' . $wilayaId,
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
            'designation.required' => 'يرجى إدخال اسم الولاية',
            'designation.string' => 'اسم الولاية يجب أن يكون نص',
            'designation.max' => 'اسم الولاية يجب أن يكون أقل من 255 حرف',
            'designation.unique' => 'اسم الولاية موجود مسبقاً',
            'postalw.required' => 'يرجى إدخال الرمز البريدي للولاية',
            'postalw.integer' => 'الرمز البريدي يجب أن يكون رقم',
            'postalw.unique' => 'الرمز البريدي موجود مسبقاً',
            'nb_wilaya.required' => 'يرجى إدخال رقم الولاية',
            'nb_wilaya.integer' => 'رقم الولاية يجب أن يكون رقم',
            'nb_wilaya.unique' => 'رقم الولاية موجود مسبقاً',
            'designation_ar.regex' => 'اسم الولاية بالعربية يجب أن يحتوي على أحرف عربية فقط',
            'designation_fr.regex' => 'اسم الولاية بالفرنسية يجب أن يحتوي على أحرف لاتينية فقط',
        ];
    }
}
