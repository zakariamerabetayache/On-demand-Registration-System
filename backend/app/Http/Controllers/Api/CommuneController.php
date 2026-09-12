<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommuneRequest;
use App\Http\Requests\UpdateCommuneRequest;
use App\Http\Resources\CommuneResource;
use App\Models\Commune;
use Illuminate\Http\Request;

class CommuneController extends Controller
{
    /**
     * Get communes by wilaya ID (for dropdown/filtering)
     */
    public function getcommunes($request)
    {
        $communes = Commune::whereHas('wilaya', function ($query) use ($request) {
            $query->where('id', $request);
        })->with('wilaya')->get();
        
        return CommuneResource::collection($communes);
    }

    /**
     * Display a listing of communes with pagination and filtering.
     */
    public function index(Request $request)
    {
        $query = Commune::query()->with('wilaya');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('designation_ar', 'like', "%{$search}%")
                  ->orWhere('designation_fr', 'like', "%{$search}%")
                  ->orWhere('postalc', 'like', "%{$search}%")
                  ->orWhereHas('wilaya', function ($wilayaQuery) use ($search) {
                      $wilayaQuery->where('designation_ar', 'like', "%{$search}%")
                                 ->orWhere('designation_fr', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by wilaya
        if ($request->has('wilaya_id') && !empty($request->wilaya_id)) {
            $query->where('wilaya_id', $request->wilaya_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100);
        $communes = $query->paginate($perPage);

        return CommuneResource::collection($communes);
    }

    /**
     * Store a newly created commune.
     */
    public function store(StoreCommuneRequest $request)
    {
        $data = $request->validated();
        $commune = Commune::create($data);

        return response()->json([
            'message' => 'Commune created successfully',
            'commune' => new CommuneResource($commune),
        ], 201);
    }

    /**
     * Display the specified commune.
     */
    public function show($id)
    {
        $commune = Commune::with('wilaya')->findOrFail($id);
        return new CommuneResource($commune);
    }

    /**
     * Update the specified commune.
     */
    public function update(UpdateCommuneRequest $request, $id)
    {
        $commune = Commune::findOrFail($id);
        $data = $request->validated();
        $commune->update($data);

        return response()->json([
            'message' => 'Commune updated successfully',
            'commune' => new CommuneResource($commune),
        ], 200);
    }

    /**
     * Remove the specified commune.
     */
    public function destroy($id)
    {
        $commune = Commune::findOrFail($id);
        $commune->delete();

        return response()->json([
            'message' => 'Commune deleted successfully',
        ], 200);
    }

    /**
     * Bulk delete communes.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:communes,id',
        ]);

        $deletedCount = Commune::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => "{$deletedCount} communes deleted successfully",
        ], 200);
    }

    /**
     * Get communes count for statistics.
     */
    public function getCount(Request $request)
    {
        $query = Commune::query();

        // Get total count
        $total = $query->count();

        // Get counts by wilaya
        $wilayaQuery = clone $query;
        $wilayaCounts = $wilayaQuery->selectRaw('wilaya_id, count(*) as count')
            ->groupBy('wilaya_id')
            ->pluck('count', 'wilaya_id')
            ->toArray();

        $counts = [
            'all' => $total,
            'by_wilaya' => $wilayaCounts,
        ];

        return response()->json($counts, 200);
    }
}
