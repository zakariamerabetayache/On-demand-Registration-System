<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\User;
use App\Models\Etablissement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Payment;

class ChildController extends Controller
{
    /**
     * Display a listing of children for a specific parent.
     */
    public function index($parentId, Request $request)
    {
        $parent = User::where('role_id', 'parent')->findOrFail($parentId);
        
        $query = Child::where('parent_id', $parentId);

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_ar', 'like', "%{$search}%")
                  ->orWhere('nom_fr', 'like', "%{$search}%")
                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                  ->orWhere('prenom_fr', 'like', "%{$search}%")
                  ->orWhere('bloodsign', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100);
        $children = $query->paginate($perPage);

        return response()->json($children);
    }
    /**
     * Get all children for parents in a specific establishment
     * Route: GET /children/{etablissement_id}
     */
    public function getAllChildren($etablissementId, Request $request)
    {
        try {
            // Validate the establishment exists
            $etablissement = Etablissement::find($etablissementId);
            if (!$etablissement) {
                return response()->json([
                    'message' => 'Establishment not found',
                    'data' => [],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                    'last_page' => 1
                ], 404);
            }
    
            // Start query: children whose parent's etablissement_id = given one
            $query = Child::whereHas('parent', function ($parentQuery) use ($etablissementId) {
                $parentQuery->where('etablissement_id', $etablissementId);
            })
            ->with('parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,etablissement_id,telephone');
    
            // Search feature
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom_ar', 'like', "%{$search}%")
                      ->orWhere('nom_fr', 'like', "%{$search}%")
                      ->orWhere('prenom_ar', 'like', "%{$search}%")
                      ->orWhere('prenom_fr', 'like', "%{$search}%")
                      ->orWhere('bloodsign', 'like', "%{$search}%")
                      ->orWhereHas('parent', function ($parentQuery) use ($search) {
                          $parentQuery->where('nom_ar', 'like', "%{$search}%")
                                      ->orWhere('nom_fr', 'like', "%{$search}%")
                                      ->orWhere('prenom_ar', 'like', "%{$search}%")
                                      ->orWhere('prenom_fr', 'like', "%{$search}%")
                                      ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
    
            // Sorting
            $sortBy = $request->get('sort_by', 'id');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
    
            // Pagination
            $perPage = min($request->get('per_page', 10), 100);
            $children = $query->paginate($perPage);
    
            // Return result (includes parent info)
            return response()->json($children);
    
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching children: ' . $e->getMessage(),
                'data' => [],
                'current_page' => 1,
                'per_page' => 10,
                'total' => 0,
                'last_page' => 1
            ], 500);
        }
    }
    

    /**
     * Store a newly created child.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'required|integer|exists:users,id',
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'bloodsign' => 'nullable|string|max:10',
            'self_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
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

        $data = $request->all();
        
        // Handle self photo upload
        if ($request->hasFile('self_photo')) {
            $selfPhoto = $request->file('self_photo');
            $selfPhotoName = time() . '_child_self_' . $selfPhoto->getClientOriginalName();
            $selfPhotoPath = $selfPhoto->storeAs('public/self_photos', $selfPhotoName);
            $data['self_photo'] = 'self_photos/' . $selfPhotoName;
        }

        $child = Child::create($data);

        return response()->json([
            'message' => 'Child created successfully',
            'child' => $child->load('parent'),
        ], 201);
    }

    /**
     * Display the specified child.
     */
    public function show($id)
    {
        $child = Child::with('parent')->findOrFail($id);
        
        return response()->json([
            'child' => $child
        ]);
    }

    /**
     * Update the specified child.
     */
    public function update(Request $request, $id)
    {
        $parent = $request->user();
        
        if ($parent->role_id !== 'parent') {
            return response()->json([
                'message' => 'Access denied. Only parents can access this resource.'
            ], 403);
        }
        
        $child = Child::where('id', $id)
                     ->where('parent_id', $parent->id)
                     ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'bloodsign' => 'nullable|string|max:10',
            'self_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        
        // Handle self photo upload
        if ($request->hasFile('self_photo')) {
            // Delete old self photo if exists
            if ($child->self_photo) {
                Storage::delete('public/' . $child->self_photo);
            }
            
            $selfPhoto = $request->file('self_photo');
            $selfPhotoName = time() . '_child_self_' . $selfPhoto->getClientOriginalName();
            $selfPhotoPath = $selfPhoto->storeAs('public/self_photos', $selfPhotoName);
            $data['self_photo'] = 'self_photos/' . $selfPhotoName;
        }

        $child->update($data);

        return response()->json([
            'message' => 'Child updated successfully',
            'data' => $child,
        ]);
    }

    /**
     * Remove the specified child.
     */
    public function destroy(Request $request, $id)
    {
        $parent = $request->user();
        
        if ($parent->role_id !== 'parent') {
            return response()->json([
                'message' => 'Access denied. Only parents can access this resource.'
            ], 403);
        }
        
        $child = Child::where('id', $id)
                     ->where('parent_id', $parent->id)
                     ->firstOrFail();
        $child->delete();

        return response()->json([
            'message' => 'Child deleted successfully'
        ]);
    }

    /**
     * Display a listing of children for the current authenticated parent.
     */
    public function indexForCurrentParent(Request $request)
    {
        $parent = $request->user();
        
        if ($parent->role_id !== 'parent') {
            return response()->json([
                'message' => 'Access denied. Only parents can access this resource.'
            ], 403);
        }
        
        $query = Child::where('parent_id', $parent->id);

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_ar', 'like', "%{$search}%")
                  ->orWhere('nom_fr', 'like', "%{$search}%")
                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                  ->orWhere('prenom_fr', 'like', "%{$search}%")
                  ->orWhere('bloodsign', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $children = $query->get();

        return response()->json([
            'data' => $children
        ]);
    }

    /**
     * Store a newly created child for the current authenticated parent.
     */
    public function storeForCurrentParent(Request $request)
    {
        $parent = $request->user();
        
        if ($parent->role_id !== 'parent') {
            return response()->json([
                'message' => 'Access denied. Only parents can access this resource.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'bloodsign' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $child = Child::create([
            'parent_id' => $parent->id,
            'nom_ar' => $request->nom_ar,
            'nom_fr' => $request->nom_fr,
            'prenom_ar' => $request->prenom_ar,
            'prenom_fr' => $request->prenom_fr,
            'date_nais' => $request->date_nais,
            'sex' => $request->sex,
            'bloodsign' => $request->bloodsign,
        ]);

        return response()->json([
            'message' => 'Child created successfully',
            'data' => $child,
        ], 201);
    }

    // Parent-specific methods for authenticated parent management
    
    /** 
     * Get children for the current authenticated parent (individual parent access)
     */
    public function getChildrenForParent(Request $request)
    {
        $user = $request->user();
        
        // Verify user is a parent
        if ($user->role_id !== 'parent') {
            return response()->json(['message' => 'Unauthorized. Only parents can access this resource.'], 403);
        }

        $query = Child::where('parent_id', $user->id);

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_ar', 'like', "%{$search}%")
                  ->orWhere('nom_fr', 'like', "%{$search}%")
                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                  ->orWhere('prenom_fr', 'like', "%{$search}%")
                  ->orWhere('bloodsign', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $children = $query->get();

        return response()->json([
            'data' => $children,
            'message' => 'Children retrieved successfully'
        ]);
    }

 

    /**
     * Store a new child for the current authenticated parent
     */
    public function createChildForParent(Request $request, $parent_id)
    
    {

        $parent = User::find($parent_id);
        $user = $request->user();
        
        // Verify user is a parent
        if ($user->role_id !== 'parent') {
            return response()->json(['message' => 'Unauthorized. Only parents can access this resource.'], 403);
        }
       $paymentNotSure = Payment::where('user_id', $parent->id)->where('child_id', null)->first();
       $paymentSure = Payment::where('user_id', $parent->id)->where('child_id', null)->Where('state',1)->first();
       if (!$paymentNotSure ) {
           return response()->json(['message' => 'يجب دفع رسوم التسجيل قبل إضافة طفل',"message_type"=>"not_sure"], 404);
       } else if (!$paymentSure) {
           return response()->json(['message' => 'يتم التحقق من رسوم التسجيل بانتظار الموافقة',"message_type"=>"sure"], 404);
       } 
       
      


        $validator = Validator::make($request->all(), [ 
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'bloodsign' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $child = Child::create([
            'parent_id' => $user->id,
            'nom_ar' => $request->nom_ar,
            'nom_fr' => $request->nom_fr,
            'prenom_ar' => $request->prenom_ar,
            'prenom_fr' => $request->prenom_fr,
            'date_nais' => $request->date_nais,
            'sex' => $request->sex,
            'bloodsign' => $request->bloodsign,
        ]);

        $paymentSure->child_id = $child->id;
        $paymentSure->save();

        return response()->json([
            'data' => $child,
            'message' => 'Child created successfully'
        ], 201);
    }

    /**
     * Update a child (only if it belongs to the authenticated parent)
     */
    public function updateChildForParent(Request $request, Child $child)
    {
        $user = $request->user();
        
        // Verify user is a parent and owns this child
        if ($user->role_id !== 'parent' || $child->parent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized. You can only update your own children.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'bloodsign' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $child->update([
            'nom_ar' => $request->nom_ar,
            'nom_fr' => $request->nom_fr,
            'prenom_ar' => $request->prenom_ar,
            'prenom_fr' => $request->prenom_fr,
            'date_nais' => $request->date_nais,
            'sex' => $request->sex,
            'bloodsign' => $request->bloodsign,
        ]);

        return response()->json([
            'data' => $child,
            'message' => 'Child updated successfully'
        ]);
    }

    /**
     * Delete a child (only if it belongs to the authenticated parent)
     */
    public function deleteChildForParent(Request $request, Child $child)
    {
        $user = $request->user();
        
        // Verify user is a parent and owns this child
        if ($user->role_id !== 'parent' || $child->parent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized. You can only delete your own children.'], 403);
        }

        $child->delete();

        return response()->json([
            'message' => 'Child deleted successfully'
        ]);
    }


   
    /**
     * Get total count of all children
     * Route: GET /children/count
     */
    public function count($etablissementId)
    {
        try {
            $totalChildren = Child::whereHas('parent', function ($query) use ($etablissementId) {
                $query->where('etablissement_id', $etablissementId);
            })->count();
            
            return response()->json([
                'data' => $totalChildren,
                'message' => 'Children count retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching children count',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
