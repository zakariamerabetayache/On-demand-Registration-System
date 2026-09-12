import React from "react";
import partyMembersService from "../services/partyMembersService";
import wilayasService from "../services/wilayasService";
import communesService from "../services/communesService";
import CheckPartyMember from "../components/CheckPartyMember";
import ErrorHandling from "../components/ErrorHandling";

// Party Members CRUD Configuration
export const getPartyMembersConfig = (user) => ({
    title: "party_members",
    entityName: "party_member",
    entityDisplayName: "party_member",

    filters: [
        {
            key: "state",
            label: "state",
            type: "select",
            options: [
                { value: "in_waiting", label: "in_waiting" },
                { value: "joined", label: "joined" },
                // { value: "inactive", label: "inactive" },
            ],
        },
        user?.role_id == "national_admin" && {
            key: "wilaya_id",
            label: "wilaya",
            type: "select",
            loadOptions: async () => {
                try {
                    const wilayas = await wilayasService.getAllForDropdown();
                    return wilayas;
                } catch (error) {
                    ErrorHandling(error);
                    return [];
                }
            },
        },
        user?.role_id == "national_admin" &&
        {
            key: "commune_id",
            label: "commune",
            type: "select",
            relation: "wilaya_id",
            loadOptions: async (wilayaId) => {
                if (!wilayaId) return [];
                try {
                    const communes = await communesService.getByWilaya(wilayaId);
                    return communes;
                } catch (error) {
                    ErrorHandling(error);
                    return [];
                }
            },
            rules: [{ required: true, message: "please_select_commune" }],
        },

    ].filter(Boolean),

    // Table columns configuration
    columns: [
        {
            title: "last_name",
            dataIndex: "nom_ar",
            key: "full_last_name",
            render: (text, record) => {
                return React.createElement('div', { style: { lineHeight: '1.2' } }, [
                    React.createElement('div', {
                        key: 'ar',
                        style: { fontWeight: '500', color: '#1f2937' }
                    }, record.nom_ar || '-'),
                    React.createElement('div', {
                        key: 'fr',
                        style: { fontSize: '12px', color: '#6b7280', marginTop: '2px' }
                    }, record.nom_fr || '-')
                ]);
            },
        },
        {
            title: "first_name",
            dataIndex: "prenom_ar",
            key: "full_first_name",
            render: (text, record) => {
                return React.createElement('div', { style: { lineHeight: '1.2' } }, [
                    React.createElement('div', {
                        key: 'ar',
                        style: { fontWeight: '500', color: '#1f2937' }
                    }, record.prenom_ar || '-'),
                    React.createElement('div', {
                        key: 'fr',
                        style: { fontSize: '12px', color: '#6b7280', marginTop: '2px' }
                    }, record.prenom_fr || '-')
                ]);
            },
        },
        {
            title: "phone",
            dataIndex: "telephone",
            key: "telephone",
        },
        {
            title: "nin",
            dataIndex: "nin",
            key: "nin",
        },
        {
            title: "state",
            dataIndex: "state",
            key: "state",
            render: (status, record, helpers) => {
                const { StatusPill, getStatusConfig } = helpers;
                const config = getStatusConfig(status, "party_member");
                return React.createElement(StatusPill, config);
            },
        },
        ((user?.etablissement?.verificationby == 1 && user?.role_id == "national_admin") || (user?.etablissement?.verificationby == 1 && user?.role_id == "wilaya_admin" && user?.etablissement?.validation_by == "wilayi")) && {
            title: "check_member",
            dataIndex: "check_member",
            key: "check_member",
            render: (text, record, helpers) => {
                const { handleRefresh } = helpers;
                return React.createElement(CheckPartyMember, { record, onUpdate: handleRefresh });
            },
        },
        {
            title: "referrals_count",
            dataIndex: "referrals_count",
            key: "referrals_count",
        },
    ].filter(Boolean),

    // Form fields configuration (view only, no create/edit for party members from admin)
    fields: [],

    // View fields configuration
    viewFields: [
        { key: "nom_ar", label: "nom_ar" },
        { key: "nom_fr", label: "nom_fr" },
        { key: "prenom_ar", label: "prenom_ar" },
        { key: "prenom_fr", label: "prenom_fr" },
        { key: "email", label: "email" },
        { key: "telephone", label: "phone" },
        { key: "nin", label: "nin" },
        { key: "function", label: "function" },
        { key: "adress", label: "address" },
        { key: "personal_token", label: "personal_token" },
        {
            key: "wilaya_designation_ar",
            label: "wilaya"
        },
        {
            key: "commune_designation_ar",
            label: "commune"
        },
        {
            key: "state",
            label: "state",
            render: (status, record, helpers) => {
                const { StatusPill, getStatusConfig } = helpers;
                const config = getStatusConfig(status, "party_member");
                return React.createElement(StatusPill, config);
            },
        },
    ],

    colorStatus: {
        statusOptions: [

            {
                filter: "count_wilayas",
                label: "count_wilayas",
                initialColor: "#722ed1",
                hoverColor: "#531dab",
                no_clicking: true,
                no_percentage_count: true,
            },
            {
                filter: "count_communes",
                label: "count_communes",
                initialColor: "#faad14",
                hoverColor: "#d48806",
                no_clicking: true,
                no_percentage_count: true,
            },
            {
                filter: "count_males",
                label: "count_males",
                initialColor: "#1890ff",
                hoverColor: "#1880cc",
                no_clicking: true,
                no_percentage_count: true,
            },
            {
                filter: "count_females",
                label: "count_females",
                initialColor: "#eb2f96",
                hoverColor: "#c41d7f",
                no_clicking: true,
                no_percentage_count: true,
            },
        ],
        loadCount: async () => {
            try {
                const response = await partyMembersService.getCount();
                return response.data;
            } catch (error) {
                ErrorHandling(error);
                return {};
            }
        },
    },

    // Actions configuration
    actions: {
        create: false,
        edit: false,
        delete: true,
        view: true,
    },
});
