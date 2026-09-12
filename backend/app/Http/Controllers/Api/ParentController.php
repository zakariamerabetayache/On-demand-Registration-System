<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Morafik;
use App\Models\Child;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ParentController extends Controller
{
    /**
     * Register a new parent user with extended information.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Basic user fields
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            
            // Parent-specific fields
            'identity_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'self_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'nb_crt' => 'nullable|string|max:255',
            'nin' => 'required|string|max:255|unique:users,nin',
            'adress' => 'required|string',
            'wilaya_id' => 'required|integer|exists:wilayas,id',
            'commune_id' => 'required|integer|exists:communes,id',
            'wilaya_res_id' => 'required|integer|exists:wilayas,id',
            'commune_res_id' => 'required|integer|exists:communes,id',
            'telephone' => 'required|string|max:255',
        ], [
            // Arabic validation messages
            'nom_ar.required' => 'الاسم العائلي بالعربية مطلوب',
            'nom_ar.string' => 'الاسم العائلي بالعربية يجب أن يكون نص',
            'nom_ar.max' => 'الاسم العائلي بالعربية يجب ألا يتجاوز 255 حرف',
            
            'nom_fr.required' => 'الاسم العائلي بالفرنسية مطلوب',
            'nom_fr.string' => 'الاسم العائلي بالفرنسية يجب أن يكون نص',
            'nom_fr.max' => 'الاسم العائلي بالفرنسية يجب ألا يتجاوز 255 حرف',
            
            'prenom_ar.required' => 'الاسم الشخصي بالعربية مطلوب',
            'prenom_ar.string' => 'الاسم الشخصي بالعربية يجب أن يكون نص',
            'prenom_ar.max' => 'الاسم الشخصي بالعربية يجب ألا يتجاوز 255 حرف',
            
            'prenom_fr.required' => 'الاسم الشخصي بالفرنسية مطلوب',
            'prenom_fr.string' => 'الاسم الشخصي بالفرنسية يجب أن يكون نص',
            'prenom_fr.max' => 'الاسم الشخصي بالفرنسية يجب ألا يتجاوز 255 حرف',
            
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'email.unique' => 'هذا البريد الإلكتروني مستخدم من قبل. يرجى استخدام بريد إلكتروني آخر',
            'email.string' => 'البريد الإلكتروني يجب أن يكون نص',
            
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون على الأقل 6 أحرف',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
            
            'identity_image.image' => 'صورة الهوية يجب أن تكون صورة',
            'identity_image.mimes' => 'صورة الهوية يجب أن تكون من نوع: jpeg, png, jpg, gif',
            'identity_image.max' => 'حجم صورة الهوية يجب ألا يتجاوز 2 ميجابايت',
            
            'self_photo.image' => 'الصورة الشخصية يجب أن تكون صورة',
            'self_photo.mimes' => 'الصورة الشخصية يجب أن تكون من نوع: jpeg, png, jpg, gif',
            'self_photo.max' => 'حجم الصورة الشخصية يجب ألا يتجاوز 2 ميجابايت',
            
            'date_nais.required' => 'تاريخ الميلاد مطلوب',
            'date_nais.date' => 'تاريخ الميلاد غير صحيح',
            
            'sex.required' => 'الجنس مطلوب',
            'sex.integer' => 'الجنس يجب أن يكون رقم',
            'sex.in' => 'الجنس يجب أن يكون ذكر أو أنثى',
            
            'nb_crt.string' => 'رقم الشهادة يجب أن يكون نص',
            'nb_crt.max' => 'رقم الشهادة يجب ألا يتجاوز 255 حرف',
            
            'nin.required' => 'رقم الهوية الوطنية مطلوب',
            'nin.string' => 'رقم الهوية الوطنية يجب أن يكون نص',
            'nin.max' => 'رقم الهوية الوطنية يجب ألا يتجاوز 255 حرف',
            'nin.unique' => 'رقم الهوية الوطنية مستخدم من قبل',
            
            'adress.required' => 'العنوان مطلوب',
            'adress.string' => 'العنوان يجب أن يكون نص',
            
            'wilaya_id.required' => 'الولاية مطلوبة',
            'wilaya_id.integer' => 'الولاية يجب أن تكون رقم',
            'wilaya_id.exists' => 'الولاية المحددة غير موجودة',
            
            'commune_id.required' => 'البلدية مطلوبة',
            'commune_id.integer' => 'البلدية يجب أن تكون رقم',
            'commune_id.exists' => 'البلدية المحددة غير موجودة',
            
            'wilaya_res_id.required' => 'ولاية الإقامة مطلوبة',
            'wilaya_res_id.integer' => 'ولاية الإقامة يجب أن تكون رقم',
            'wilaya_res_id.exists' => 'ولاية الإقامة المحددة غير موجودة',
            
            'commune_res_id.required' => 'بلدية الإقامة مطلوبة',
            'commune_res_id.integer' => 'بلدية الإقامة يجب أن تكون رقم',
            'commune_res_id.exists' => 'بلدية الإقامة المحددة غير موجودة',
            
            'telephone.required' => 'رقم الهاتف مطلوب',
            'telephone.string' => 'رقم الهاتف يجب أن يكون نص',
            'telephone.max' => 'رقم الهاتف يجب ألا يتجاوز 255 حرف',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['role_id'] = 'parent';
        $data['etablissement_id'] = 1;
        $data['app_id'] = 1;
        $data['password'] = Hash::make($data['password']);
        $data['email_verified_at'] = now();

        // Handle identity image upload
        if ($request->hasFile('identity_image')) {
            $image = $request->file('identity_image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $imagePath = $image->storeAs('public/identity_images', $imageName);
            $data['identity_image'] = 'identity_images/' . $imageName;
        }

        // Handle self photo upload
        if ($request->hasFile('self_photo')) {
            $selfPhoto = $request->file('self_photo');
            $selfPhotoName = time() . '_self_' . $selfPhoto->getClientOriginalName();
            $selfPhotoPath = $selfPhoto->storeAs('public/self_photos', $selfPhotoName);
            $data['self_photo'] = 'self_photos/' . $selfPhotoName;
        }

        // Remove password confirmation from data
        unset($data['password_confirmation']);

        $user = User::create($data);
        $token= $user->createToken('main')->plainTextToken;

        return response()->json([
            'message' => 'Parent registered successfully',
            'user' => $user->load([ 'wilaya', 'commune', 'wilayaResidence', 'communeResidence']),
            'token' => $token,
        ], 201);
    }

    /**
     * Get parent profile with relationships.
     */
    public function profile($id)
    {
        $parent = User::with([
            'etablissement', 
            'wilaya', 
            'commune', 
            'wilayaResidence', 
            'communeResidence',
            'morafiks',
            'children'
        ])->where('role_id', 'parent')->findOrFail($id);

        return response()->json([
            'parent' => $parent
        ]);
    }

    /**
     * Update parent profile.
     */
    public function updateProfile(Request $request, $id)
    {
        $parent = User::where('role_id', 'parent')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email,' . $id,
            'identity_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'nb_crt' => 'nullable|string|max:255',
            'nin' => 'required|string|max:255|unique:users,nin,' . $id,
            'adress' => 'required|string',
            'wilaya_id' => 'required|integer|exists:wilayas,id',
            'commune_id' => 'required|integer|exists:communes,id',
            'wilaya_res_id' => 'required|integer|exists:wilayas,id',
            'commune_res_id' => 'required|integer|exists:communes,id',
            'telephone' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();

        // Handle identity image upload
        if ($request->hasFile('identity_image')) {
            // Delete old image if exists
            if ($parent->identity_image) {
                Storage::delete('public/' . $parent->identity_image);
            }
            
            $image = $request->file('identity_image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $imagePath = $image->storeAs('public/identity_images', $imageName);
            $data['identity_image'] = 'identity_images/' . $imageName;
        }

        $parent->update($data);

        return response()->json([
            'message' => 'Parent profile updated successfully',
            'parent' => $parent->load(['etablissement', 'wilaya', 'commune', 'wilayaResidence', 'communeResidence'])
        ]);
    }

    /**
     * Get parent's morafiks (companions).
     */
    public function getMorafiks($parentId)
    {
        $parent = User::where('role_id', 'parent')->findOrFail($parentId);
        $morafiks = $parent->morafiks;

        return response()->json([
            'morafiks' => $morafiks
        ]);
    }

    /**
     * Add a morafik (companion) for a parent.
     */
    public function addMorafik(Request $request, $parentId)
    {
        $parent = User::where('role_id', 'parent')->findOrFail($parentId);

        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $morafik = Morafik::create([
            'parent_id' => $parentId,
            'nom_ar' => $request->nom_ar,
            'nom_fr' => $request->nom_fr,
            'prenom_ar' => $request->prenom_ar,
            'prenom_fr' => $request->prenom_fr,
        ]);

        return response()->json([
            'message' => 'Morafik added successfully',
            'morafik' => $morafik
        ], 201);
    }

    /**
     * Get parent's children.
     */
    public function getChildren($parentId)
    {
        $parent = User::where('role_id', 'parent')->findOrFail($parentId);
        $children = $parent->children;

        return response()->json([
            'children' => $children
        ]);
    }

    /**
     * Add a child for a parent.
     */
    public function addChild(Request $request, $parentId)
    {
        $parent = User::where('role_id', 'parent')->findOrFail($parentId);

        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'date_nais' => 'required|date',
            'bloodsign' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $child = Child::create([
            'parent_id' => $parentId,
            'nom_ar' => $request->nom_ar,
            'nom_fr' => $request->nom_fr,
            'prenom_ar' => $request->prenom_ar,
            'prenom_fr' => $request->prenom_fr,
            'date_nais' => $request->date_nais,
            'bloodsign' => $request->bloodsign,
        ]);

        return response()->json([
            'message' => 'Child added successfully',
            'child' => $child
        ], 201);
    }

    /**
     * Update parent state (activate/deactivate).
     */
    public function updateState(Request $request, $id)
    {
        

        // Find the parent user
        $parent = User::findOrFail($id);

        // Validate the request
        $validator = Validator::make($request->all(), [
            'state' => 'required|integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update the parent's state
        $parent->update([
            'state' => $request->state
        ]);

        return response()->json([
            'message' => 'Parent state updated successfully',
            'parent' => [
                'id' => $parent->id,
                'nom_ar' => $parent->nom_ar,
                'nom_fr' => $parent->nom_fr,
                'prenom_ar' => $parent->prenom_ar,
                'prenom_fr' => $parent->prenom_fr,
                'email' => $parent->email,
                'state' => $parent->state
            ]
        ]);
    }
}
