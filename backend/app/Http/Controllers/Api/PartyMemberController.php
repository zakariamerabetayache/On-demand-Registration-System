<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Etablissement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PartyMemberController extends Controller
{
    /**
     * Register a new party member (public endpoint).
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_ar' => 'required|string|max:255',
            'nom_fr' => 'required|string|max:255',
            'prenom_ar' => 'required|string|max:255',
            'prenom_fr' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'telephone' => 'required|string|max:20',
            'date_nais' => 'required|date',
            'sex' => 'required|integer|in:0,1',
            'nb_crt' => 'required|string|max:5',
            'nin' => 'required|string|size:18|unique:users,nin',
            'adress' => 'required|string',
            'function' => 'required|string',
            'wilaya_id' => 'required|exists:wilayas,id',
            'commune_id' => 'required|exists:communes,id',
            'wilaya_res_id' => 'required|exists:wilayas,id',
            'commune_res_id' => 'required|exists:communes,id',
            'referral_token' => 'required|string',
            'referral_family_name' => 'required|string',
            'identity_image' => 'nullable|image|max:5120',
            'self_photo' => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Check if referral exists and get establishment
        $referrer = User::with('etablissement')
            ->where('personal_token', $data['referral_token'])
            ->where('prenom_ar', $data['referral_family_name'])
            ->first();

        if (!$referrer) {
            return response()->json([
                'success' => false,
                'errors' => ['referral_token' => ['لا يوجد عضو يحمل هذا الرمز و الاسم ']]
            ], 422);
        }

        $referrerId = $referrer->id;
        $etablissementId = $referrer->etablissement_id;
        $etablissement = $referrer->etablissement;

        // Check if etablissement requires verification
        $requiresVerification = false;
        if ($etablissement && $etablissement->verificationby == 1) {
            $requiresVerification = true;
            // Validate required upload fields
            if (!$request->hasFile('identity_image') || !$request->hasFile('self_photo')) {
                return response()->json([
                    'success' => false,
                    'errors' => ['identity_image' => [' يجب عليك إدخال الصورة الشخصية وصورة بطاقة التعريف الوطنية ']]
                ], 422);
            }
        }

        // If the referrer's establishment has change_token enabled, change it now
        if ($etablissement && $etablissement->change_token) {
            $referrer->personal_token = strval(random_int(10000000, 99999999));
            $referrer->save();
        }

        // Handle file uploads
        $identityPath = null;
        $selfPhotoPath = null;

        if ($request->hasFile('identity_image')) {
            $identityPath = $request->file('identity_image')->store('identity_images', 'public');
        }

        if ($request->hasFile('self_photo')) {
            $selfPhotoPath = $request->file('self_photo')->store('self_photos', 'public');
        }

        

        // Create user
        $user = User::create([
            'nom_ar' => $data['nom_ar'],
            'nom_fr' => $data['nom_fr'],
            'prenom_ar' => $data['prenom_ar'],
            'prenom_fr' => $data['prenom_fr'],
            'referral_token' => $data['referral_token'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'telephone' => $data['telephone'],
            'date_nais' => $data['date_nais'],
            'sex' => $data['sex'],
            'nb_crt' => $data['nb_crt'],
            'nin' => $data['nin'],
            'adress' => $data['adress'],
            'wilaya_id' => $data['wilaya_id'],
            'function' => $data['function'],
            'commune_id' => $data['commune_id'],
            'wilaya_res_id' => $data['wilaya_res_id'],
            'commune_res_id' => $data['commune_res_id'],
            'etablissement_id' => $etablissementId,
            'role_id' => User::ROLE_PARTY_MEMBER,
            'state' => $etablissement->verificationby == 1 ? "in_waiting" : "joined",
            'app_id' => 2,
            'identity_image' => $identityPath,
            'self_photo' => $selfPhotoPath,
            'referral_id' => $referrerId,
            'personal_token' => strval(random_int(10000000, 99999999)),

        ]);

        $token = $user->createToken('party-member-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Please wait for approval.',
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Get party members list (for admin views).
     */
    public function index(Request $request, $etablissement_id )
    {
        $currentUser = $request->user();

        $query = User::with(['etablissement', 'wilaya', 'commune', 'referrer'])->withCount('referrals')
            ->where('etablissement_id',$etablissement_id )
            ->where('role_id', User::ROLE_PARTY_MEMBER);

        if ($currentUser && $currentUser->isWilayaAdmin()) {
            $query->where('wilaya_id', $currentUser->wilaya_id);
        }

        // Filter by state
        if ($request->has('state') && $request->state !== '') {
            $query->where('state', $request->state);
        }

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom_ar', 'like', "%{$search}%")
                  ->orWhere('nom_fr', 'like', "%{$search}%")
                  ->orWhere('prenom_ar', 'like', "%{$search}%")
                  ->orWhere('prenom_fr', 'like', "%{$search}%")
                  ->orWhere('nin', 'like', "%{$search}%");
            });
        }

        // Filter by Wilaya
        if ($request->has('wilaya_id') && !empty($request->wilaya_id)) {
            $query->where('wilaya_id', $request->wilaya_id);
        }

        // Filter by Commune
        if ($request->has('commune_id') && !empty($request->commune_id)) {
            $query->where('commune_id', $request->commune_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 10);
        $members = $query->paginate($perPage);

        return UserResource::collection($members);
    }

    public function getStats(Request $request){
     try{
            $currentUser = $request->user();
            
           
            
            

            $etablissement_id = $currentUser->etablissement_id; 

             $query = User::where('role_id', User::ROLE_PARTY_MEMBER)
             ->where('etablissement_id', $etablissement_id)
             ->where('state','joined');

            if ($currentUser->isWilayaAdmin()) {
                $query->where('wilaya_id', $currentUser->wilaya_id);
            }

            $members = $query->get();
            
            $unique_wilayas = [];
            $unique_communes = [];
            $count_males = 0;
            $count_females = 0; 

            foreach ($members as $member){
                if ($member->wilaya_id) {
                    $unique_wilayas[$member->wilaya_id] = true;
                }
                if ($member->commune_id) {
                    $unique_communes[$member->commune_id] = true;
                }
                
                if ($member->sex === 0) {
                    $count_males++;
                }
                if ($member->sex === 1) {
                     $count_females++; 
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Stats retrieved successfully.',
                'data' => [
                    'count_males' => $count_males,
                    'count_females' => $count_females,
                    'count_wilayas' => count($unique_wilayas),
                    'count_communes' => count($unique_communes),
                ],
            ], 200);

         } catch(\Exception $e){
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve stats.',
                'error' => $e->getMessage(),
            ], 500);
         }         
    }

    /**
     * Approve/Reject a party member.
     */
    public function updateState(Request $request, $id)
    {
        $request->validate([
            'state' => 'required|string|in:in_waiting,joined,inactive',
        ]);

        $currentUser = $request->user();
        $member = User::findOrFail($id);

        // Verify member is a party member
        if ($member->role_id !== User::ROLE_PARTY_MEMBER) {
            return response()->json([
                'message' => 'User is not a party member'
            ], 400);
        }

        // Check if wilaya_admin can approve
        if ($currentUser->isWilayaAdmin()) {
            // Wilaya admin can only approve in their wilaya
            if ($member->wilaya_id !== $currentUser->wilaya_id) {
                return response()->json([
                    'message' => 'You can only manage members in your wilaya'
                ], 403);
            }

            // Check if etablissement allows wilaya validation
            if ($member->etablissement && $member->etablissement->validation_by !== 'wilayi') {
                return response()->json([
                    'message' => 'This establishment requires national validation'
                ], 403);
            }
        }

        $member->state = $request->state;
        $member->save();

        return response()->json([
            'message' => 'Member state updated successfully',
            'user' => new UserResource($member),
        ]);
    }

    /**
     * Get member details with verification info.
     */
    public function show($id)
    {
        $member = User::with(['etablissement', 'wilaya', 'commune', 'wilayaRes', 'communeRes', 'referrer'])
            ->findOrFail($id);

        return new UserResource($member);
    }

    /**
     * Regenerate personal token.
     */
    public function regenerateToken(Request $request, $id)
    {
        $currentUser = $request->user();
        $member = User::findOrFail($id);

        // Only the member themselves or admins can regenerate token
        if ($currentUser->id !== $member->id && !$currentUser->isNationalAdmin() && !$currentUser->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $member->personal_token = Str::random(10);
        $member->save();

        return response()->json([
            'message' => 'Token regenerated successfully',
            'personal_token' => $member->personal_token,
        ]);
    }

    /**
     * Get referral stats for a member.
     */
    public function getReferralStats($id)
    {
        $member = User::withCount('referrals')->findOrFail($id);

        return response()->json([
            'member_id' => $member->id,
            'personal_token' => $member->personal_token,
            'referrals_count' => $member->referrals_count,
        ]);
    }

    /**
     * Get top referrers.
     */
    public function getTopReferrers(Request $request)
    {
        $limit = $request->get('limit', 10);

        $topReferrers = User::withCount('referrals')
            ->where('role_id', User::ROLE_PARTY_MEMBER)
            ->having('referrals_count', '>', 0)
            ->orderBy('referrals_count', 'desc')
            ->limit($limit)
            ->get(['id', 'nom_ar', 'nom_fr', 'prenom_ar', 'prenom_fr', 'personal_token']);

        return response()->json([
            'data' => $topReferrers,
        ]);
    }
}
