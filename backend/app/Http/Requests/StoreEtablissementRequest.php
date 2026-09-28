<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEtablissementRequest extends FormRequest
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
            'designation_ar' => 'required|string|max:255',
            'designation_fr' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'wilaya_id' => 'required|exists:wilayas,id',
            'commune_id' => 'required|exists:communes,id',
            'adress' => 'nullable|string',
            'type' => 'required|string',
            'email' => 'nullable|email|max:255',
            'verificationby' => 'boolean',
            'change_token' => 'boolean',
            'validation_by' => 'nullable|string|in:watani,wilayi',
            'app_name' => 'nullable|string|max:255',
            'hero_title' => 'nullable|string|max:255',
            'hero_description' => 'nullable|string',
            'primary_color' => 'nullable|string|max:20',
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
            'designation_ar.required' => 'الاسم بالعربية مطلوب',
            'designation_ar.string' => 'الاسم بالعربية يجب أن يكون نص',
            'designation_ar.max' => 'الاسم بالعربية يجب أن يكون أقل من 255 حرف',
            'designation_fr.required' => 'الاسم بالفرنسية مطلوب',
            'designation_fr.string' => 'الاسم بالفرنسية يجب أن يكون نص',
            'designation_fr.max' => 'الاسم بالفرنسية يجب أن يكون أقل من 255 حرف',
            'logo.string' => 'الشعار يجب أن يكون نص',
            'logo.max' => 'مسار الشعار يجب أن يكون أقل من 500 حرف',
            'wilaya_id.required' => 'الولاية مطلوبة',
            'wilaya_id.integer' => 'معرف الولاية يجب أن يكون رقم صحيح',
            'wilaya_id.exists' => 'الولاية المحددة غير موجودة',
            'commune_id.required' => 'البلدية مطلوبة',
            'commune_id.integer' => 'معرف البلدية يجب أن يكون رقم صحيح',
            'commune_id.exists' => 'البلدية المحددة غير موجودة',
            'adress.string' => 'العنوان يجب أن يكون نص',
            'adress.max' => 'العنوان يجب أن يكون أقل من 500 حرف',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.max' => 'البريد الإلكتروني يجب أن يكون أقل من 255 حرف',
            'designation_ar.regex' => 'اسم المؤسسة بالعربية يجب أن يحتوي على أحرف عربية فقط',
            'designation_fr.regex' => 'اسم المؤسسة بالفرنسية يجب أن يحتوي على أحرف لاتينية فقط',
           
        ];
    }
}
