import axios from "axios";
import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";

/**
 *
 * @param {Error} error
 * @param {string} context
 * @throws {Error}
 */

// Users service for API calls
const usersService = {
  /**
   * Get all users with pagination and filters
   * @param {Object} params - Query parameters for filtering, sorting, and pagination
   * @returns {Promise<Object>} - The response data with users and pagination info
   */
  async getAll( id, params = {}) {
    try {
      
      // Map frontend params to Laravel params
      const laravelParams = {
        page: params.page || 1,
        per_page: params.limit || 10,
        search: params.search || "",
        sort_by: params.sortBy || "id",
        sort_order: params.sortOrder || "desc",
        role_id: params.role_id,
        app_id: params.app_id,
        user_id: params.user_id,
        parent_id: params.parent_id,
      };

      // Remove empty params
      Object.keys(laravelParams).forEach((key) => {
        if (laravelParams[key] === "" || laravelParams[key] === undefined) {
          delete laravelParams[key];
        }
      });

      const config = {
        params: laravelParams,
        // Cancel previous request if a new one is made
        cancelToken: new axios.CancelToken((c) => (this.cancelToken = c)),
      };

      const response = await axiosClient.get(`/users/${id}`, config);


      // Transform Laravel paginated response to expected format
      const transformedResponse = {
        data: response.data.data, // Laravel puts entities in data.data
        pagination: {
          current: response.data.current_page,
          pageSize: response.data.per_page,
          total: response.data.total,
          totalPages: response.data.last_page,
        },
      };
      
      return transformedResponse;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Cancel the current users request
   */
  cancelRequest() {
    if (this.cancelToken) {
      this.cancelToken();
    }
  },

  /**
   * Get all users for dropdown (simplified format)
   */
  async getAllForDropdown() {
    try {
      const response = await axiosClient.get("/users", {
        params: {
          per_page: 100,
          page: 1,
        },
      });

      // Transform to dropdown format
      if (response.data && response.data.data) {
        const dropdownOptions = response.data.data.map((user) => ({
          value: user.id,
          label:
            `${user.nom_fr || user.nom_ar || ""} ${
              user.prenom_fr || user.prenom_ar || ""
            }`.trim() || user.email,
          email: user.email,
          role_id: user.role_id,
        }));
        return dropdownOptions;
      }
      return [];
    } catch (error) {
      ErrorHandling(error);
      return [];
    }
  },

  /**
   * Get user by ID
   * @param {number|string} id - The user ID
   * @returns {Promise<Object>} - The user data
   */
  async getById(id) {
    try {
      const response = await axiosClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - The user data to create
   * @returns {Promise<Object>} - The created user data
   */
  async create(userData) {
    try {
      const response = await axiosClient.post("/users", userData);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Update an existing user
   * @param {number|string} id - The user ID
   * @param {Object} userData - The updated user data
   * @returns {Promise<Object>} - The updated user data
   */
  async update(id, userData) {
    try {
      const response = await axiosClient.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Delete a user
   * @param {number|string} id - The user ID to delete
   * @returns {Promise<Object>} - The deletion result
   */
  async delete(id) {
    try {
      const response = await axiosClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Get user statistics
   * @returns {Promise<Object>} - The user statistics
   */
  async getCount(etablissement_id, params = {}) {
    try {
      const response = await axiosClient.get(`/users/count/${etablissement_id}`, { params });
      return response.data;
    } catch (error) {
      ErrorHandling(error);
      return {};
    }
  },

  /**
   * Bulk delete users
   * @param {Array<number|string>} ids - Array of user IDs to delete
   * @returns {Promise<Object>} - The bulk deletion result
   */
  async bulkDelete(ids) {
    try {
      const response = await axiosClient.post("/users/bulk-delete", { ids });
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },
};

export default usersService;
