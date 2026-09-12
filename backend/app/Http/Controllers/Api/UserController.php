<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;    
use App\Models\Etablissement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Display a listing of users with pagination and filtering.
     *
     * @param  int  $user_id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $id = null)
    {
        try {
            // Get user context
            $userId = $id ?: $request->user()?->id;
            
            if (!$userId) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                    'last_page' => 1
                ], 200);
            }

            $contextUser = User::find($userId);
            if (!$contextUser) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $query = User::with(['etablissement']);
            
            // Apply role-based filtering
            if ($contextUser->isAdmin()) {
                // Root admin can see all admins (national and wilaya)
                $query->whereIn('role_id', [User::ROLE_NATIONAL_ADMIN, User::ROLE_WILAYA_ADMIN]);
            } elseif ($contextUser->isNationalAdmin()) {
                // National admin sees wilaya admins
                $query->where('role_id', User::ROLE_WILAYA_ADMIN);
            } elseif ($contextUser->isWilayaAdmin()) {
                // Wilaya admin sees party members in their wilaya
                $query->where('role_id', User::ROLE_PARTY_MEMBER)
                      ->where('wilaya_res_id', $contextUser->wilaya_res_id);
            } else {
                // Others only see themselves
                $query->where('id', $contextUser->id);
            }

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom_ar', 'like', "%{$search}%")
                      ->orWhere('nom_fr', 'like', "%{$search}%")
                      ->orWhere('prenom_ar', 'like', "%{$search}%")
                      ->orWhere('prenom_fr', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            
            // Filter by role_id
            if ($request->has('role_id') && !empty($request->role_id)) {
                $query->where('role_id', $request->role_id);
            }

            // Filter by etablissement_id
            if ($request->has('etablissement_id') && !empty($request->etablissement_id)) {
                $query->where('etablissement_id', $request->etablissement_id);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'id');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = min((int)$request->get('per_page', 10), 100);
            $users = $query->paginate($perPage);

            // Return in format expected by usersService.js
            return response()->json([
                'data' => UserResource::collection($users),
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Internal Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

 

    /**
     * Store a newly created user in storage.
     *
     * @param  \App\Http\Requests\StoreUserRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        // Map roles to app_id
        if ($data['role_id'] == User::ROLE_PARTY_MEMBER) {
            $data['app_id'] = 2;
        } elseif (in_array($data['role_id'], [User::ROLE_NATIONAL_ADMIN, User::ROLE_WILAYA_ADMIN])) {
            $data['app_id'] = 1;
        } else {
            $data['app_id'] = 0;
        }
         $data['personal_token'] = strval(random_int(10000000, 99999999));

         $data['state'] = 'joined';
        // Hash the password then create the user with validated data
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json([
            'message' => 'User created successfully',
            'user' => new UserResource($user->load(['etablissement']))
        ], 201);
    }

    /**
     * Display the specified user.
     *
     * @param  int  $id
     * @return \App\Http\Resources\UserResource
     */
    public function show($id)
    {
        $user = User::with(['etablissement'])->findOrFail($id);
        return new UserResource($user);
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $data = $request->validated();

        // Hash password if provided
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            // Remove password from data if not provided to avoid overwriting
            unset($data['password']);
        }

        // Handle self photo upload
        if ($request->hasFile('self_photo')) {
            // Delete old self photo if exists
            if ($user->self_photo) {
                Storage::delete('public/' . $user->self_photo);
            }
            
            $selfPhoto = $request->file('self_photo');
            $selfPhotoName = time() . '_self_' . $selfPhoto->getClientOriginalName();
            $selfPhotoPath = $selfPhoto->storeAs('public/self_photos', $selfPhotoName);
            $data['self_photo'] = 'self_photos/' . $selfPhotoName;
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => new UserResource($user),
        ], 200);
    }

    /**
     * Remove the specified user from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Update user RFID only.
     */
    public function updateRfid(Request $request, $id)
    {
        $request->validate([
            'rfid' => 'nullable|string|max:255|unique:users,rfid,' . $id,
        ]);

        try {
            $user = User::findOrFail($id);
            $user->update([
                'rfid' => $request->rfid
            ]);

            return response()->json([
                'message' => 'RFID updated successfully',
                'user' => new UserResource($user),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update RFID',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user by RFID for check-in/out system.
     */
    public function getUserByRfid(Request $request)
    {
        $request->validate([
            'rfid' => 'required|string|max:255',
        ]);

        try {
            $user = User::where('rfid', $request->rfid)
                        ->with(['etablissement'])
                        ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'RFID card not found in system',
                ], 404);
            }

            return response()->json([
                'message' => 'User found successfully',
                'user' => new UserResource($user),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to find user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete users.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:users,id',
        ]);

        $deletedCount = User::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => "{$deletedCount} users deleted successfully",
        ], 200);
    }

    /**
     * Get users count for statistics.
     */
    public function getCount($etablissement_id, Request $request)
    {
        $query = User::query();
        $query->where('etablissement_id', $etablissement_id);

        // Get total count
        $total = $query->count();

        // Get counts by role
        $roleQuery = clone $query;
        $roleCounts = $roleQuery->selectRaw('role_id, count(*) as count')
            ->groupBy('role_id')
            ->pluck('count', 'role_id')
            ->toArray();

        // Define available roles for statistics
        $availableRoles = [
            User::ROLE_ADMIN,
            User::ROLE_NATIONAL_ADMIN,
            User::ROLE_WILAYA_ADMIN,
            User::ROLE_PARTY_MEMBER
        ];

        $counts = ['all' => $total];
        foreach ($availableRoles as $roleName) {
            $counts[$roleName] = $roleCounts[$roleName] ?? 0;
        }

        return response()->json($counts, 200);
    }

    /**
     * Get all parents for admin view
     */
    public function getParents($etablissement_id, Request $request)
    {
        $query = User::with(['etablissement'])
            ->where('etablissement_id', $etablissement_id)
            ->where('role_id', 'parent');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_ar', 'like', "%{$search}%")
                  ->orWhere('nom_fr', 'like', "%{$search}%")
                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                  ->orWhere('prenom_fr', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 10);
        $parents = $query->paginate($perPage);

        return response()->json([
            'data' => $parents->items(),
            'current_page' => $parents->currentPage(),
            'per_page' => $parents->perPage(),
            'total' => $parents->total(),
            'last_page' => $parents->lastPage(),
        ]);
    }

    /**
     * Upload payment receipt for parent
     */
    public function uploadReceipt(Request $request, $userId)
    {
        $validator = Validator::make($request->all(), [
            'pdf' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // Max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        
        // Verify the userId matches the authenticated user
        if ($user->id != $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Only parents can upload receipts
        if ($user->role_id !== 'parent') {
            return response()->json([
                'success' => false,
                'message' => 'Only parents can upload payment receipts'
            ], 403);
        }

        // Check if user is in state 1 (approved, needs payment)
        if ($user->state != 1) {
            return response()->json([
                'success' => false,
                'message' => 'You are not eligible to upload a receipt at this time'
            ], 400);
        }

        // Delete old receipt if exists
        if ($user->price_receipt && Storage::exists($user->price_receipt)) {
            Storage::delete($user->price_receipt);
        }

        // Store new receipt
        $path = $request->file('pdf')->store('receipts', 'public');
        
        $user->update([
            'price_receipt' => $path
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الملف بنجاح',
            'receipt_path' => $path,
            'data' => [
                'id' => $user->id,
                'price_receipt' => $path
            ]
        ]);
    }

    /**
     * Update parent payment state (manager only)
     */
    public function updatePaymentState(Request $request, $userId)
    {
        try {
            $request->validate([
                'state' => 'required|integer|in:0,1,2',
            ]);

            $currentUser = $request->user();
            
            // Only managers and admins can update payment state
            if (!$currentUser->isAdmin() && !$currentUser->isNationalAdmin() && !$currentUser->isWilayaAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $parent = User::findOrFail($userId);

            // Verify parent is in the same wilaya if wilaya admin
            if ($currentUser->isWilayaAdmin() && 
                $parent->wilaya_res_id !== $currentUser->wilaya_res_id) {
                return response()->json([
                    'message' => 'You can only manage members in your wilaya'
                ], 403);
            }

            $parent->state = $request->state;
            $parent->save();

            return response()->json([
                'message' => 'Payment state updated successfully',
                'user' => new UserResource($parent)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update payment state',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get total count of parents for a specific etablissement
     * Route: GET /parents/count/{etablissement_id}
     */
    public function getParentsCount($etablissement_id)
    {
        try {
            $parentsCount = User::where('etablissement_id', $etablissement_id)
                                ->where('role_id', 'parent')
                                ->count();
            
            return response()->json([
                'data' => $parentsCount,
                'message' => 'Parents count retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching parents count',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
