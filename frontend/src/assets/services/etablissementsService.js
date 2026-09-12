import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";

const etablissementsService = {
    getAll: async (params = {}) => {
        try {
            const response = await axiosClient.get('/etablissements', { params });
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await axiosClient.get(`/etablissements/${id}`);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            const response = await axiosClient.post('/etablissements', data);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const response = await axiosClient.put(`/etablissements/${id}`, data);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },
    async getAllForDropdown() {
        try {
            const response = await axiosClient.get("/etablissements", {
                params: {
                    per_page: 100,
                    page: 1,
                },
            });

            // Transform to dropdown format
            if (response.data && response.data.data) {
                const dropdownOptions = response?.data?.data.map((etablissement) => ({
                    value: etablissement.id,
                    label: `${etablissement.designation_fr || etablissement.designation_ar
                        }`,
                    designation_ar: etablissement.designation_ar,
                    designation_fr: etablissement.designation_fr,
                    wilaya_id: etablissement.wilaya_id,
                    commune_id: etablissement.commune_id,
                }));
                return dropdownOptions;
            }
            ErrorHandling(response.data);
            return [];
        } catch (error) {
            ErrorHandling(error);
            return [];
        }
    },

    delete: async (id) => {
        try {
            const response = await axiosClient.delete(`/etablissements/${id}`);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    updateParameters: async (id, data) => {
        try {
            const response = await axiosClient.put(`/etablissements/${id}/parameters`, data);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    getCount: async () => {
        try {
            const response = await axiosClient.get('/etablissements/count');
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    bulkDelete: async (ids) => {
        try {
            const response = await axiosClient.post('/etablissements/bulk-delete', { ids });
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    /**
  * Upload logo for etablissement
  * @param {number} id - Etablissement ID
  * @param {File} logoFile - Logo file to upload
  * @param {Object} options - Upload options including progress callback
  * @returns {Promise<Object>} Upload response
  */
    async uploadLogo(id, logoFile, options = {}) {
        try {
            const formData = new FormData();
            formData.append('logo', logoFile);

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            // Add progress callback if provided
            if (options.onUploadProgress) {
                config.onUploadProgress = options.onUploadProgress;
            }

            const response = await axiosClient.post(
                `/etablissements/${id}/upload-logo`,
                formData,
                config
            );
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    /**
     * Delete logo for etablissement
     * @param {number} id - Etablissement ID
     * @returns {Promise<Object>} Delete response
     */
    async deleteLogo(id) {
        try {
            const response = await axiosClient.delete(
                `/etablissements/${id}/delete-logo`
            );
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },
};

export default etablissementsService;
