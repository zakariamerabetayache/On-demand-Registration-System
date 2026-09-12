import React from "react";
import etablissementsService from "../services/etablissementsService";
import ErrorHandling from "../components/ErrorHandling";
import wilayasService from "../services/wilayasService";
import communesService from "../services/communesService";

// Users CRUD Configuration
export const getUsersConfig = (user) => ({
  title: "users",
  entityName: "user",
  entityDisplayName: "user",

  filters: [

  ],

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
      title: "wilaya",
      dataIndex: "wilaya_designation_ar",
      key: "wilaya_designation",
    },
    {
      title: "commune",
      dataIndex: "commune_designation_ar",
      key: "commune_designation",
    },
    {
      title: "email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "role",
      dataIndex: "role_id",
      key: "role_id",
      render: (status, record, helpers) => {
        const { StatusPill, getStatusConfig } = helpers;
        const config = getStatusConfig(status, "user");
        return React.createElement(StatusPill, config);
      },
    },
  ],

  // Form fields configuration
  fields: [
    {
      key: "nom_ar",
      label: "nom_ar",
      type: "text",
      rules: [{ required: true, message: "please_enter_nom_ar" }],
    },
    {
      key: "nom_fr",
      label: "nom_fr",
      type: "text",
      rules: [{ required: true, message: "please_enter_nom_fr" }],
    },
    {
      key: "prenom_ar",
      label: "prenom_ar",
      type: "text",
      rules: [{ required: true, message: "please_enter_prenom_ar" }],
    },
    {
      key: "prenom_fr",
      label: "prenom_fr",
      type: "text",
      rules: [{ required: true, message: "please_enter_prenom_fr" }],
    },
    {
      key: "role_id",
      label: "role",
      type: "select",
      options: [
        user?.role_id === "admin" && { value: "national_admin", label: "National Admin" },
        user?.role_id === "national_admin" && { value: "wilaya_admin", label: "Wilaya Admin" },
      ].filter(Boolean),
      rules: [{ required: true, message: "please_select_role" }],
    },

    user?.role_id === "admin" && {
      key: "etablissement_id",
      label: "etablissement",
      type: "select",
      loadOptions: async () => {
        try {
          const etablissements = await etablissementsService.getAllForDropdown();
          console.log("etablissements from the " + JSON.stringify(etablissements))
          return etablissements;
        } catch (error) {
          ErrorHandling(error);
          return [];
        }
      },
      rules: [{ required: false, message: "please_select_etablissement" }],
    },

    {
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
      rules: [{ required: true, message: "please_select_wilaya" }],
    },
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
    {
      key: "email",
      label: "email",
      type: "text",
      rules: [
        { required: true, message: "please_enter_email" },
        { type: "email", message: "please_enter_valid_email" },
      ],
    },
    {
      key: "password",
      label: "password",
      type: "password",
      rules: [
        {
          requiredcreate: true,
          requiredupdate: false,
          message: "please_enter_password",
        },
        { min: 6, message: "password_min_6_characters" },
      ],
    },
    {
      key: "password_confirmation",
      label: "password_confirmation",
      type: "password",
      rules: [
        {
          requiredcreate: true,
          requiredupdate: false,
          message: "please_enter_password_confirmation",
        },
        { min: 6, message: "password_min_6_characters" },
      ],
    },
  ].filter(Boolean),

  silencevalues: {
    etablissement_id: user?.role_id === "admin" ? null : user?.etablissement_id,
  },
  // View fields configuration (for view modal)
  viewFields: [
    { key: "nom_ar", label: "nom_ar" },
    { key: "nom_fr", label: "nom_fr" },
    { key: "prenom_ar", label: "prenom_ar" },
    { key: "prenom_fr", label: "prenom_fr" },
    {
      key: "wilaya_designation_ar",
      label: "wilaya",
    },
    {
      key: "commune_designation_ar",
      label: "commune",
    },
    { key: "email", label: "email" },
    { key: "etablissement_designation", label: "etablissement" },

    {
      key: "role_id",
      label: "role",
      render: (status, record, helpers) => {
        const { StatusPill, getStatusConfig } = helpers;
        const config = getStatusConfig(status, "user");
        return React.createElement(StatusPill, config);
      },
    },
  ].filter(Boolean),

  // Actions configuration
  actions: {
    create: true,
    edit: true,
    delete: true,
    view: true,
  },

  // Color status configuration for statistics
  // colorStatus: {
  //   statusOptions: [
  //     user?.role_id === "admin" && {
  //       filter: "role_id",
  //       label: "manager",
  //       initialColor: "#faad14",
  //       hoverColor: "#d48806",
  //     },

  //     user?.role_id === "manager" && {
  //       filter: "role_id",
  //       label: "employee",
  //       initialColor: "#1890ff",
  //       hoverColor: "#1880cc",
  //     },
  //     //  user?.role_id !== "admin" && {
  //     //     filter: "role_id",
  //     //     label: "all",
  //     //     initialColor: "#722ed1",
  //     //     hoverColor: "#531dab",
  //     //   },
  //   ].filter(Boolean),
  //   loadCount: async (etablissement_id) => {
  //     try {
  //       const response = await usersService.getCount(etablissement_id);
  //       return response || {};
  //     } catch (error) {
  //       ErrorHandling(error);
  //       return {};
  //     }
  //   },
  // },
})
