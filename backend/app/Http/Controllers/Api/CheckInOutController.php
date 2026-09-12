<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckInOut;
use App\Models\User;
use App\Models\Child;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CheckInOutController extends Controller
{
    /**
     * Display a listing of check-in/outs.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = CheckInOut::with([
                'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id', 
                'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id',
                'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email'
            ]);

            // Role-based filtering
            if ($user->role_id === 'parent') {
                // Parents can only see check-in/outs for their own children
                $childIds = Child::where('parent_id', $user->id)->pluck('id');
                $query->whereIn('child_id', $childIds);
            } elseif ($user->role_id === 'manager') {
                // Managers can see check-in/outs for their establishment
                $parentIds = User::where('etablissement_id', $user->etablissement_id)
                    ->where('role_id', 'parent')
                    ->pluck('id');
                $childIds = Child::whereIn('parent_id', $parentIds)->pluck('id');
                $query->whereIn('child_id', $childIds);
            }
            // Admins can see all check-in/outs (no additional filtering)

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('checker', function($checkerQuery) use ($search) {
                        $checkerQuery->where('nom_ar', 'like', "%{$search}%")
                                    ->orWhere('nom_fr', 'like', "%{$search}%")
                                    ->orWhere('prenom_ar', 'like', "%{$search}%")
                                    ->orWhere('prenom_fr', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('child', function($childQuery) use ($search) {
                        $childQuery->where('nom_ar', 'like', "%{$search}%")
                                  ->orWhere('nom_fr', 'like', "%{$search}%")
                                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                                  ->orWhere('prenom_fr', 'like', "%{$search}%");
                    })->orWhereHas('child.parent', function($parentQuery) use ($search) {
                        $parentQuery->where('nom_ar', 'like', "%{$search}%")
                                   ->orWhere('nom_fr', 'like', "%{$search}%")
                                   ->orWhere('prenom_ar', 'like', "%{$search}%")
                                   ->orWhere('prenom_fr', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                    })->orWhere('date', 'like', "%{$search}%")
                      ->orWhere('hour', 'like', "%{$search}%");
                });
            }

            // Filter by checker_id
            if ($request->has('checker_id') && !empty($request->checker_id)) {
                $query->where('checker_id', $request->checker_id);
            }

            // Filter by child_id
            if ($request->has('child_id') && !empty($request->child_id)) {
                $query->where('child_id', $request->child_id);
            }

            // Filter by date
            if ($request->has('date') && !empty($request->date)) {
                $query->whereDate('date', $request->date);
            }

            // Filter by date range
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('date', '>=', $request->date_from);
            }
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('date', '<=', $request->date_to);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $checkInOuts = $query->paginate($perPage);

            return response()->json($checkInOuts);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching check-in/outs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created check-in/out.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'checker_id' => 'required|exists:users,id',
                'child_id' => 'required|exists:children,id',
                'type' => 'required|integer|in:0,1', // 0 = check-in, 1 = check-out
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify that the checker is a valid user (staff member)
            $checker = User::find($request->checker_id);
            if (!$checker || !in_array($checker->role_id, ['companion','parent'])) {
                return response()->json([
                    'message' => 'Invalid checker. '
                ], 422);
            }

            // Verify that the child exists
            $child = Child::find($request->child_id);
            if (!$child) {
                return response()->json([
                    'message' => 'Child not found'
                ], 422);
            }
            $checkInOut = CheckInOut::create([
                'checker_id' => $request->checker_id,
                'child_id' => $request->child_id,
                'date' => now()->toDateString(),
                'hour' => now()->toTimeString(),
                'type' => $request->type,
            ]); 

            return response()->json([
                'message' => 'Check-in/out recorded successfully',
                'data' => $checkInOut 
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error recording check-in/out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified check-in/out.
     */
    public function show(Request $request, CheckInOut $checkInOut)
    {
        try {
            $user = $request->user();

            // Check permissions
            if ($user->role_id === 'parent') {
                $child = $checkInOut->child;
                if ($child->parent_id !== $user->id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            if ($user->role_id === 'manager') {
                $child = $checkInOut->child;
                $parent = $child->parent;
                if ($parent->etablissement_id !== $user->etablissement_id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $checkInOut->load([
                'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id', 
                'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id',
                'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email'
            ]);

            return response()->json([
                'data' => $checkInOut
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching check-in/out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified check-in/out.
     */
    public function update(Request $request, CheckInOut $checkInOut)
    {
        try {
            $user = $request->user();

            // Check permissions - only admin, manager, and associate can update check-in/outs
            if (!in_array($user->role_id, ['admin', 'manager', 'associate'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $child = $checkInOut->child;
                $parent = $child->parent;
                if ($parent->etablissement_id !== $user->etablissement_id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $validator = Validator::make($request->all(), [
                'checker_id' => 'sometimes|exists:users,id',
                'child_id' => 'sometimes|exists:children,id',
                'date' => 'sometimes|date',
                'hour' => 'sometimes|date_format:H:i',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify checker if being updated
            if ($request->has('checker_id')) {
                $checker = User::find($request->checker_id);
                if (!$checker || !in_array($checker->role_id, ['admin', 'manager', 'associate'])) {
                    return response()->json([
                        'message' => 'Invalid checker. Only staff members can perform check-in/out operations.'
                    ], 422);
                }
            }

            $checkInOut->update($request->all());
            $checkInOut->load([
                'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id', 
                'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id',
                'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email'
            ]);

            return response()->json([
                'message' => 'Check-in/out updated successfully',
                'data' => $checkInOut
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating check-in/out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified check-in/out.
     */
    public function destroy(Request $request, CheckInOut $checkInOut)
    {
        try {
            $user = $request->user();

            // Check permissions - only admin and manager can delete check-in/outs
            if (!in_array($user->role_id, ['admin', 'manager'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $child = $checkInOut->child;
                $parent = $child->parent;
                if ($parent->etablissement_id !== $user->etablissement_id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $checkInOut->delete();

            return response()->json([
                'message' => 'Check-in/out deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting check-in/out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get check-in/outs for a specific establishment (admin/manager only).
     */
    public function getByEstablishment(Request $request, $etablissementId)
    {
        try {
            $user = $request->user();
    
            // Base query
            $query = CheckInOut::whereHas('checker', function ($checkerQuery) use ($etablissementId) {
                $checkerQuery->where('etablissement_id', $etablissementId);
            })
            ->with('checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,etablissement_id,telephone,role_id', 'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id', 'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr');
            if($request->filled('type')){
                $query->where('type', $request->type);
            }
            
            // Optional: Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('checker', function($userQuery) use ($search) {
                        $userQuery->where('nom_ar', 'like', "%{$search}%")
                                  ->orWhere('nom_fr', 'like', "%{$search}%")
                                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                                  ->orWhere('prenom_fr', 'like', "%{$search}%")
                                  ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('child', function($childQuery) use ($search) {
                        $childQuery->where('nom_ar', 'like', "%{$search}%")
                                  ->orWhere('nom_fr', 'like', "%{$search}%")
                                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                                  ->orWhere('prenom_fr', 'like', "%{$search}%");
                    })->orWhereHas('child.parent', function($parentQuery) use ($search) {
                        $parentQuery->where('nom_ar', 'like', "%{$search}%")
                                    ->orWhere('nom_fr', 'like', "%{$search}%")
                                    ->orWhere('prenom_ar', 'like', "%{$search}%")
                                    ->orWhere('prenom_fr', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                    })->orWhere('date', 'like', "%{$search}%")
                      ->orWhere('hour', 'like', "%{$search}%");
                });
            }
    
            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
    
            // Pagination
            $perPage = $request->get('per_page', 10);
            $checkIns = $query->paginate($perPage);
    
            // Empty check
        
            return response()->json($checkIns);
    
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching check-in/outs for establishment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    

    /**
     * Get today's check-in/outs for a specific child.
     */
    public function getTodayForChild(Request $request, $childId)
    {
        try {
            $user = $request->user();
            $child = Child::find($childId);

            if (!$child) {
                return response()->json(['message' => 'Child not found'], 404);
            }

            // Check permissions
            if ($user->role_id === 'parent' && $child->parent_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->role_id === 'manager') {
                $parent = $child->parent;
                if ($parent->etablissement_id !== $user->etablissement_id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $todayCheckInOuts = CheckInOut::with([
                'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id'
            ])
            ->where('child_id', $childId)
            ->whereDate('date', today())
            ->orderBy('hour', 'asc')
            ->get();

            return response()->json([
                'data' => $todayCheckInOuts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching today\'s check-in/outs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle RFID-based check-in/out.
     */
    public function rfidCheckInOut(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'rfid' => 'required|string',
                'type' => 'required|integer|in:0,1',
                'child_id' => 'required|exists:children,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find user by RFID code
            $user = User::where('RFID', $request->rfid)->first();
            
            if (!$user) {
                return response()->json([
                    'message' => 'RFID code not found'
                ], 404);
            }

            // Check if user is authorized for this child
            $child = Child::find($request->child_id);
            if (!$child) {
                return response()->json([
                    'message' => 'Child not found'
                ], 404);
            }

            $isAuthorized = false;

            // Check authorization based on user role
            if ($user->role_id === 'parent') {
                // Parent can only check-in/out their own children
                $isAuthorized = Child::where('id', $request->child_id)
                    ->where('parent_id', $user->id)
                    ->exists();
            } elseif (in_array($user->role_id, ['companion'])) {
                // Staff can check-in/out any child in their establishment
                $isAuthorized = Child::where('id', $request->child_id)
                    ->whereHas('parent', function($query) use ($user) {
                        $query->where('etablissement_id', $user->etablissement_id);
                    })
                    ->exists();
            }
            
            if (!$isAuthorized) {
                return response()->json([
                    'message' => 'غير مسموح لك بتسجيل الدخول والخروج لهذا الطفل'
                ], 403);
            }

            // Check if already checked in/out today
            $isAlready = CheckInOut::where('child_id', $request->child_id)
                ->whereDate('date', today())
                ->where('type', $request->type)
                ->first();
                
            if ($isAlready) {
                return response()->json([
                    'message' => $request->type == 0 ? 'لقد قمت بتسجيل الدخول اليوم' : 'لقد قمت بتسجيل الخروج اليوم'
                ], 409);
            }

            // Return checker information for confirmation
            return response()->json([
                'message' => 'Checker found and authorized',
                'data' => [
                    'id' => $user->id,
                    'nom_ar' => $user->nom_ar,
                    'nom_fr' => $user->nom_fr,
                    'prenom_ar' => $user->prenom_ar,
                    'prenom_fr' => $user->prenom_fr,
                    'self_photo' => $user->self_photo,
                    'role_id' => $user->role_id,
                    'type' => $user->role_id === 'parent' ? 'parent' : 'staff'
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing RFID check-in/out',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get check-in/outs by establishment ID
      

    //  */
    // public function getByEstablishment(Request $request, $establishmentId)
    // {
    //     try {
    //         $query = CheckInOut::with([
    //             'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id', 
    //             'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id',
    //             'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email'
    //         ]);

    //         // Filter by establishment
    //         $parentIds = User::where('etablissement_id', $establishmentId)
    //             ->where('role_id', 'parent')
    //             ->pluck('id');
    //         $childIds = Child::whereIn('parent_id', $parentIds)->pluck('id');
    //         $query->whereIn('child_id', $childIds);

    //         // Apply filters
    //         $this->applyFilters($query, $request);

    //         // Sorting
    //         $sortBy = $request->get('sort_by', 'created_at');
    //         $sortOrder = $request->get('sort_order', 'desc');
    //         $query->orderBy($sortBy, $sortOrder);

    //         // Pagination
    //         $perPage = $request->get('per_page', 15);
    //         $checkInOuts = $query->paginate($perPage);

    //         return response()->json($checkInOuts, 200);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'message' => 'Error fetching check-in/outs by establishment',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    /**
     * Get today's check-in/outs by establishment ID
     */
    public function getTodayByEstablishment($establishmentId)
    {
        try {
            $query = CheckInOut::with([
                'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id', 
                'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id',
                'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email'
            ]);

            // Filter by establishment
            $parentIds = User::where('etablissement_id', $establishmentId)
                ->where('role_id', 'parent')
                ->pluck('id');
            $childIds = Child::whereIn('parent_id', $parentIds)->pluck('id');
            $query->whereIn('child_id', $childIds);

            // Filter by today's date
            $query->whereDate('date', now()->toDateString());

            // Order by time
            $query->orderBy('hour', 'desc');

            $checkInOuts = $query->get();

            return response()->json([
                'message' => 'Today\'s check-in/outs retrieved successfully',
                'data' => $checkInOuts
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching today\'s check-in/outs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for check-in/outs by establishment
     */
    public function getStatistics( $establishmentId)
    {
        try {
            // Get parent IDs for the establishment
            $parentIds = User::where('etablissement_id', $establishmentId)
                ->where('role_id', 'parent')
                ->pluck('id');
            $childIds = Child::whereIn('parent_id', $parentIds)->pluck('id');

            $today = now()->toDateString();

            // Today's check-ins
            $todayCheckIns = CheckInOut::whereIn('child_id', $childIds)
                ->whereDate('date', $today)
                ->where('type', 0)
                ->count();

            // Today's check-outs
            $todayCheckOuts = CheckInOut::whereIn('child_id', $childIds)
                ->whereDate('date', $today)
                ->where('type', 1)
                ->count();

            // Currently in (check-ins without corresponding check-outs today)
            $checkedInChildIds = CheckInOut::whereIn('child_id', $childIds)
                ->whereDate('date', $today)
                ->where('type', 0)
                ->pluck('child_id')
                ->unique();

            $checkedOutChildIds = CheckInOut::whereIn('child_id', $childIds)
                ->whereDate('date', $today)
                ->where('type', 1)
                ->pluck('child_id')
                ->unique();

            $currentlyIn = $checkedInChildIds->diff($checkedOutChildIds)->count();

            // Total today
            $totalToday = $todayCheckIns + $todayCheckOuts;

            return response()->json([
                'todayCheckIns' => $todayCheckIns,
                'todayCheckOuts' => $todayCheckOuts,
                'currentlyIn' => $currentlyIn,
                'totalToday' => $totalToday
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply filters to the query
     */
    private function applyFilters($query, $request)
    {
        // Date range filter
        if ($request->has('date_from') && !empty($request->date_from)) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && !empty($request->date_to)) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        // Type filter
        if ($request->has('type') && $request->type !== '') {
            $query->where('type', $request->type);
        }

        // Child name search
        if ($request->has('child_name') && !empty($request->child_name)) {
            $query->whereHas('child', function($childQuery) use ($request) {
                $childQuery->where('nom_ar', 'like', "%{$request->child_name}%")
                          ->orWhere('nom_fr', 'like', "%{$request->child_name}%")
                          ->orWhere('prenom_ar', 'like', "%{$request->child_name}%")
                          ->orWhere('prenom_fr', 'like', "%{$request->child_name}%");
            });
        }

        // Parent name search
        if ($request->has('parent_name') && !empty($request->parent_name)) {
            $query->whereHas('child.parent', function($parentQuery) use ($request) {
                $parentQuery->where('nom_ar', 'like', "%{$request->parent_name}%")
                           ->orWhere('nom_fr', 'like', "%{$request->parent_name}%")
                           ->orWhere('prenom_ar', 'like', "%{$request->parent_name}%")
                           ->orWhere('prenom_fr', 'like', "%{$request->parent_name}%");
            });
        }

        // Checker name search
        if ($request->has('checker_name') && !empty($request->checker_name)) {
            $query->whereHas('checker', function($checkerQuery) use ($request) {
                $checkerQuery->where('nom_ar', 'like', "%{$request->checker_name}%")
                            ->orWhere('nom_fr', 'like', "%{$request->checker_name}%")
                            ->orWhere('prenom_ar', 'like', "%{$request->checker_name}%")
                            ->orWhere('prenom_fr', 'like', "%{$request->checker_name}%");
            });
        }
    }

    /**
     * Get count of check-ins and check-outs by establishment
     */
    public function getCountByEstablishment(Request $request, $etablissementId)
    {
        try {
            $user = $request->user();
    
            // Base query - filter by establishment through checker
            $query = CheckInOut::whereHas('checker', function ($checkerQuery) use ($etablissementId) {
                $checkerQuery->where('etablissement_id', $etablissementId);
            });
    
            // Count check-ins (type = 0)
            $checkInCount = (clone $query)->where('type', 0)->count();
    
            // Count check-outs (type = 1)
            $checkOutCount = (clone $query)->where('type', 1)->count();
    
            return response()->json([
                'check_in' => $checkInCount,
                'check_out' => $checkOutCount,
                'total' => $checkInCount + $checkOutCount
            ]);
    
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching check-in/out counts',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getCountByDay(Request $request, $etablissementId)
    {
        try {
            
            // Get the number of days to fetch (default 7 days)
            $days = $request->get('days', 7);
            
            // Get date range - include current day only
            $today = now()->startOfDay();
            $startDate = $today->copy()->subDays($days - 1);
            
            $countsByDay = [];
            
            // Loop through each day in the range (from start date to today)
            for ($date = $startDate->copy(); $date <= $today; $date->addDay()) {
                $dateString = $date->toDateString();
                
                // Count check-ins for this date
                $checkInCount = CheckInOut::whereHas('checker', function($query) use ($etablissementId) {
                    $query->where('etablissement_id', $etablissementId);
                })
                ->where('date', $dateString)
                ->where('type', 0) // 0 = check-in
                ->count();
                
                // Count check-outs for this date
                $checkOutCount = CheckInOut::whereHas('checker', function($query) use ($etablissementId) {
                    $query->where('etablissement_id', $etablissementId);
                })
                ->where('date', $dateString)
                ->where('type', 1) // 1 = check-out
                ->count();
                
                $countsByDay[] = [
                    'date' => $dateString,
                    'count_checks_in' => $checkInCount,
                    'count_checks_out' => $checkOutCount,
                    'total' => $checkInCount + $checkOutCount
                ];
            }
            
            // Reverse the array to show newest dates first
            $countsByDay = array_reverse($countsByDay);
            
            return response()->json([
                'data' => $countsByDay,
                'total_days' => count($countsByDay)
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching check-in/out counts by day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the state of a specific check-in/out record.
     */
    public function updateState(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'state' => 'required|integer|in:0,1', // 0 = unchecked, 1 = checked
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $checkInOut = CheckInOut::find($id);
            if (!$checkInOut) {
                return response()->json([
                    'message' => 'Check-in/out record not found'
                ], 404);
            }

            $user = $request->user();

            // Check permissions - only admin, manager, and associate can update state
            if (!in_array($user->role_id, ['admin', 'manager', 'associate'])) {
                return response()->json([
                    'message' => 'Unauthorized. Only staff members can update check-in/out state.'
                ], 403);
            }

            // For managers, ensure they can only update records from their establishment
            if ($user->role_id === 'manager') {
                $child = $checkInOut->child;
                $parent = $child->parent;
                if ($parent->etablissement_id !== $user->etablissement_id) {
                    return response()->json([
                        'message' => 'Unauthorized. You can only update records from your establishment.'
                    ], 403);
                }
            }

            // Update the state
            $checkInOut->state = $request->state;
            $checkInOut->save();

            // Load relationships for response
            $checkInOut->load([
                'checker:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email,role_id', 
                'child:id,nom_ar,nom_fr,prenom_ar,prenom_fr,parent_id',
                'child.parent:id,nom_ar,nom_fr,prenom_ar,prenom_fr,email'
            ]);

            return response()->json([
                'message' => 'Check-in/out state updated successfully',
                'data' => $checkInOut
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating check-in/out state',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
