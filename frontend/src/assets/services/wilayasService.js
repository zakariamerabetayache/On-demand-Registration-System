import axios from "axios";
import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";

/**
 *
 * @param {Error} error
 * @param {string} context
 * @throws {Error}
 */

// Wilayas service for API calls
const wilayasService = {
  /**
   * Get all wilayas with pagination and filters
   * @param {Object} params - Query parameters for filtering, sorting, and pagination
   * @returns {Promise<Object>} - The response data with wilayas and pagination info
   */
  async getAll(etablissement_id = null, params = {}) {
    // For wilayas, we ignore etablissement_id since they are global data
    // If only one parameter is passed, treat it as params
    if (typeof etablissement_id === 'object' && params === null) {
      params = etablissement_id;
    }
    try {
      // Map frontend params to Laravel params
      const laravelParams = {
        page: params.page || 1,
        per_page: params.limit || 10,
        search: params.search || "",
        sort_by: params.sortBy || "id",
        sort_order: params.sortOrder || "desc",
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

      const response = await axiosClient.get("/wilayas", config);

      // Transform Laravel paginated response to expected format
      const transformedResponse = {
        data: response?.data?.data, // Laravel puts entities in data.data
        pagination: {
          current: response?.meta?.current_page,
          pageSize: response?.meta?.per_page,
          total: response?.meta?.total,
          totalPages: response?.meta?.last_page,
        },
      };

      return transformedResponse;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Cancel the current wilayas request
   */
  cancelRequest() {
    if (this.cancelToken) {
      this.cancelToken();
    }
  },

  /**
   * Get all wilayas for dropdown (simplified format)
   */
  async getAllForDropdown() {
    try {
      const response = await axiosClient.get("/wilayas", {
        params: {
          per_page: 100,
          page: 1,
        },
      });

      // Transform to dropdown format
      if (response.data && response.data.data) {
        const dropdownOptions = response.data.data.map((wilaya) => ({
          value: wilaya.id,
          label: `${wilaya.designation_ar} - ${wilaya.designation_fr}`,
          designation_ar: wilaya.designation_ar,
          designation_fr: wilaya.designation_fr,
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
   * Get wilaya by ID
   * @param {number|string} id - The wilaya ID
   * @returns {Promise<Object>} - The wilaya data
   */
  async getById(id) {
    try {
      const response = await axiosClient.get(`/wilayas/${id}`);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Create a new wilaya
   * @param {Object} wilayaData - The wilaya data to create
   * @returns {Promise<Object>} - The created wilaya data
   */
  async create(wilayaData) {
    try {
      const response = await axiosClient.post("/wilayas", wilayaData);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Update an existing wilaya
   * @param {number|string} id - The wilaya ID
   * @param {Object} wilayaData - The updated wilaya data
   * @returns {Promise<Object>} - The updated wilaya data
   */
  async update(id, wilayaData) {
    try {
      const response = await axiosClient.put(`/wilayas/${id}`, wilayaData);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Delete a wilaya
   * @param {number|string} id - The wilaya ID to delete
   * @returns {Promise<Object>} - The deletion result
   */
  async delete(id) {
    try {
      const response = await axiosClient.delete(`/wilayas/${id}`);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Get wilaya statistics
   * @returns {Promise<Object>} - The wilaya statistics
   */
  async getCount(params = {}) {
    try {
      const response = await axiosClient.get("/wilayas/count", { params });
      return response.data;
    } catch (error) {
      ErrorHandling(error);
      return {};
    }
  },

  /**
   * Bulk delete wilayas
   * @param {Array<number|string>} ids - Array of wilaya IDs to delete
   * @returns {Promise<Object>} - The bulk deletion result
   */
  async bulkDelete(ids) {
    try {
      const response = await axiosClient.post("/wilayas/bulk-delete", { ids });
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },
};

export default wilayasService;
