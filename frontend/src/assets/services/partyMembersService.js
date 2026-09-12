import axiosClient from "../../axios-client";
import ErrorHandling from "../components/ErrorHandling";

const partyMembersService = {
    getAll: async (etablissement_id, params = {}) => {
        try {
            const response = await axiosClient.get(`/party-members-list/${etablissement_id}`, { params });
            console.log("response from members", JSON.stringify(response))

            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await axiosClient.get(`/party-members/${id}`);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    updateState: async (id, state) => {
        try {
            const response = await axiosClient.put(`/party-members/${id}/state`, { state });
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    regenerateToken: async (id) => {
        try {
            const response = await axiosClient.post(`/party-members/${id}/regenerate-token`);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    getReferralStats: async (id) => {
        try {
            const response = await axiosClient.get(`/party-members/${id}/referral-stats`);
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },
    getCount: async () => {
        try {
            const response = await axiosClient.get(`/party-members/count`);
            console.log("response from members count", JSON.stringify(response))
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },

    getTopReferrers: async (limit = 10) => {
        try {
            const response = await axiosClient.get("/party-members/top-referrers", { params: { limit } });
            return response.data;
        } catch (error) {
            ErrorHandling(error);
            throw error;
        }
    },
};

export default partyMembersService;
