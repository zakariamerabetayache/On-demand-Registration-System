import axios from "axios";
import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";

/**
 *
 * @param {Error} error
 * @param {string} context
 * @throws {Error}
 */

// Communes service for API calls
const communesService = {
  /**
   * Get all communes with pagination and filters
   * @param {Object} params - Query parameters for filtering, sorting, and pagination
   * @returns {Promise<Object>} - The response data with communes and pagination info
   */
  async getAll(etablissement_id = null, params = {}) {
    // For communes, we ignore etablissement_id since they are global data
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
        wilaya_id: params.wilaya_id,
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

      const response = await axiosClient.get("/communes", config);

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
      ErrorHandling(`Failed to load communes` + error + "getAll");
    }
  },

  /**
   * Cancel the current communes request
   */
  cancelRequest() {
    if (this.cancelToken) {
      this.cancelToken();
    }
  },

  /**
   * Get all communes for dropdown (simplified format)
   */
  async getAllForDropdown() {
    try {
      const response = await axiosClient.get("/communes", {
        params: {
          per_page: 100,
          page: 1,
        },
      });

      // Transform to dropdown format
      if (response.data && response.data.data) {
        const dropdownOptions = response.data.data.map((commune) => ({
          value: commune.id,
          label: `${commune.designation_ar} (${commune.wilaya_designation_fr || ""
            })`,
          wilaya_id: commune.wilaya_id,
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
   * Get communes by wilaya ID for dropdown
   * @param {number|string} wilayaId - The wilaya ID
   * @returns {Promise<Array>} - The communes dropdown options
   */
  async getByWilaya(wilayaId) {
    try {
      if (!wilayaId) {
        return [];
      }
      const response = await axiosClient.get(`/communesw/${wilayaId}`);

      // Transform to dropdown format
      if (response.data && Array.isArray(response.data.data)) {
        const dropdownOptions = response.data.data.map((commune) => ({
          value: commune.id,
          label: `${commune.designation_ar} - ${commune.designation_fr}`,
          wilaya_id: commune.wilaya_id,
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
   * Get commune by ID
   * @param {number|string} id - The commune ID
   * @returns {Promise<Object>} - The commune data
   */
  async getById(id) {
    try {
      const response = await axiosClient.get(`/communes/${id}`);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Create a new commune
   * @param {Object} communeData - The commune data to create
   * @returns {Promise<Object>} - The created commune data
   */
  async create(communeData) {
    try {
      const response = await axiosClient.post("/communes", communeData);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Update an existing commune
   * @param {number|string} id - The commune ID
   * @param {Object} communeData - The updated commune data
   * @returns {Promise<Object>} - The updated commune data
   */
  async update(id, communeData) {
    try {
      const response = await axiosClient.put(`/communes/${id}`, communeData);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Delete a commune
   * @param {number|string} id - The commune ID to delete
   * @returns {Promise<Object>} - The deletion result
   */
  async delete(id) {
    try {
      const response = await axiosClient.delete(`/communes/${id}`);
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },

  /**
   * Bulk delete communes
   * @param {Array<number|string>} ids - Array of commune IDs to delete
   * @returns {Promise<Object>} - The bulk deletion result
   */
  async bulkDelete(ids) {
    try {
      const response = await axiosClient.post("/communes/bulk-delete", { ids });
      return response.data;
    } catch (error) {
      ErrorHandling(error);
    }
  },
};

export default communesService;
