<?php

namespace App\Policies;

use App\Models\FileSubmission;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FileSubmissionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, FileSubmission $fileSubmission): bool
    {
        if (!$user) {
            return false;
        }
        // Users can view their own files, admins/managers can view all
        return $user->isAdmin() || $user->role_id === 'manager' || $user->id === $fileSubmission->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Any authenticated user can create a file
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FileSubmission $fileSubmission): bool
    {
        if (!$user) {
            return false;
        }
        // Users can update their own pending files, admins can update any
        if ($user->isAdmin() || $user->role_id === 'manager') {
            return true;
        }
        
        return $user->id === $fileSubmission->user_id && 
               $fileSubmission->state['value'] === FileSubmission::STATE_PENDING;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, FileSubmission $fileSubmission): bool
    {
        if (!$user) {
            return false;
        }
        // Users can delete their own pending files, admins can delete any
        if ($user->isAdmin() || $user->role_id === 'manager') {
            return true;
        }
        
        return $user->id === $fileSubmission->user_id && 
               $fileSubmission->state['value'] === FileSubmission::STATE_PENDING;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, FileSubmission $fileSubmission): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, FileSubmission $fileSubmission): bool
    {
        return $user->isAdmin();
    }
}
