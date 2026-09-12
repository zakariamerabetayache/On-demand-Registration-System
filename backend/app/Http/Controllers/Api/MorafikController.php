<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Morafik;
use App\Models\User;
use App\Models\Child;
use App\Models\Etablissement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MorafikController extends Controller
{

    public function store(Request $request)
    {


       

        
        $validator = Validator::make($request->all(), [
            'parent_id' => 'required|integer|exists:users,id',
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


        // Verify parent exists and has parent role
        $parent = User::where('id', $request->parent_id)
                     ->where('role_id', 'parent')
                     ->first();

        if (!$parent) {
            return response()->json([
                'message' => 'Parent not found'
            ], 404);
        }
       $isChild = Child::where('parent_id',$parent->id)->first();
        if (!$isChild ) {
           return response()->json(['message' => 'لا يمكن إضافة مرافق إلا بعد إضافة طفل'], 404);
       }

        $morafik = Morafik::create($request->all());

        return response()->json([
            'message' => 'Morafik created successfully',
            'morafik' => $morafik->load('parent'),
        ], 201);
    }

}
