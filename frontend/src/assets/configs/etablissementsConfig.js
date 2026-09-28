import React from "react";
import wilayasService from "../services/wilayasService";
import communesService from "../services/communesService";
import etablissementsService from "../services/etablissementsService";
import ErrorHandling from "../components/ErrorHandling";

// Etablissements CRUD Configuration
export const getEtablissementsConfig = (user, translate = (k) => k) => ({
  title: "etablissements",
  entityName: "etablissement",
  entityDisplayName: "etablissement",

  filters: [],

  // Table columns configuration
  columns: [
    {
      title: translate("designation_ar"),
      dataIndex: "designation_ar",
      key: "designation_ar",
    },
    {
      title: translate("designation_fr"),
      dataIndex: "designation_fr",
      key: "designation_fr",
    },
    {
      title: translate("wilaya"),
      dataIndex: "wilaya_designation_ar",
      key: "wilaya_designation",
    },
    {
      title: translate("commune"),
      dataIndex: "commune_designation_ar",
      key: "commune_designation",
    },
    {
      title: translate("adress"),
      dataIndex: "adress",
      key: "adress",
      render: (adress) => {
        if (!adress) return '-';
        return adress.length > 50 ? `${adress.substring(0, 50)}...` : adress;
      }
    },
    {
      title: translate("etablissement_type"),
      dataIndex: "type",
      key: "type",
    },
    {
      title: translate("email"),
      dataIndex: "email",
      key: "email",
      render: (email) => email || '-',
    },
    {
      title: translate("logo"),
      dataIndex: "logo",
      key: "logo",
      render: (logo) => {
        if (!logo) return '-';
        return React.createElement('img', {
          src: `${import.meta.env.VITE_API_BASE_URL}/storage/${logo}`,
          alt: "Logo",
          style: { width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }
        });
      }
    },
    {
      title: translate("verification"),
      dataIndex: "verificationby",
      key: "verificationby",
      render: (val) => val === true ? translate("yes") : translate("no"),
    },
    {
      title: translate("change_token"),
      dataIndex: "change_token",
      key: "change_token",
      render: (val) => val === true ? translate("yes") : translate("no"),
    },
    {
      title: translate("validation_authority"),
      dataIndex: "validation_by",
      key: "validation_by",
      render: (val) => val === 'wilayi' ? translate("wilaya_allowed") : translate("watani_only"),
    },
    {
      title: translate("app_name"),
      dataIndex: "app_name",
      key: "app_name",
      render: (val) => val || '-',
    },
    {
      title: translate("primary_color"),
      dataIndex: "primary_color",
      key: "primary_color",
      render: (val) => val ? React.createElement('div', {
        style: { width: 20, height: 20, background: val, borderRadius: '50%' }
      }) : '-',
    },
  ],

  // Form fields configuration
  fields: [
    {
      key: "designation_ar",
      label: "designation_ar",
      type: "text",
      rules: [
        { required: true, message: "please_enter_designation_ar" },
        { max: 255, message: "max_255_characters_allowed" }
      ],
    },
    {
      key: "designation_fr",
      label: "designation_fr",
      type: "text",
      rules: [
        { required: true, message: "please_enter_designation_fr" },
        { max: 255, message: "max_255_characters_allowed" }
      ],
    },

    {
      key: "logo",
      label: "logo",
      type: "file",
      accept: "image/*",
      rules: [],
    },
    {
      key: "app_name",
      label: "app_name",
      type: "text",
      rules: [{ max: 255, message: "max_255_characters_allowed" }],
    },
    {
      key: "type",
      label: "type",
      type: "select",
      options: [
        { value: "association", label: "association" },
        { value: "party", label: "party" },
      ],
      rules: [{ required: true, message: "please_select_etablissement_type" }],
    },
    {
      key: "hero_title",
      label: "hero_title",
      type: "text",
      rules: [{ max: 255, message: "max_255_characters_allowed" }],
    },
    {
      key: "hero_description",
      label: "hero_description",
      type: "textarea",
      rules: [],
    },
    {
      key: "primary_color",
      label: "primary_color",
      type: "color", // Note: The generic CRUD may need support for this type, or we use "text" type as fallback.
      rules: [{ max: 7, message: "max_7_characters_allowed" }],
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
      key: "adress",
      label: "adress",
      type: "text",
      rules: [
        { required: true, message: "please_enter_adress" },
        { max: 255, message: "max_255_characters_allowed" }
      ],
    },
    {
      key: "email",
      label: "email",
      type: "email",
      rules: [
        { type: 'email', message: 'invalid_email_format' },
        { max: 255, message: 'max_255_characters_allowed' }
      ],
    },
    {
      key: "verificationby",
      label: "identity_verification",
      type: "switch",
      show: (content) => user?.role_id === "national_admin" || user?.role_id === "admin",
    },
    {
      key: "change_token",
      label: "change_token",
      type: "switch",
      show: (content) => user?.role_id === "national_admin" || user?.role_id === "admin",
    },
    {
      key: "validation_by",
      label: "validation_authority",
      type: "select",
      options: [
        { value: "watani", label: "watani_only" },
        { value: "wilayi", label: "wilaya_allowed" },
      ],
      show: (content) => user?.role_id === "national_admin" || user?.role_id === "admin",
    },
  ],

  // View modal fields configuration
  viewFields: [
    { key: "designation_ar", label: "designation_ar" },
    { key: "designation_fr", label: "designation_fr" },
    { key: "wilaya_designation_ar", label: "wilaya" },
    { key: "commune_designation_ar", label: "commune" },
    { key: "adress", label: "adress" },
    { key: "email", label: "email" },
    { key: "verificationby", label: "identity_verification", type: "boolean" },
    { key: "change_token", label: "change_token", type: "boolean" },
    { key: "validation_by", label: "validation_authority" },
    { key: "app_name", label: "app_name" },
    { key: "hero_title", label: "hero_title" },
    { key: "hero_description", label: "hero_description" },
    { key: "primary_color", label: "primary_color" },
  ],

  // Actions configuration
  actions: {
    create: true,
    edit: true,
    delete: true,
    view: true,
  },
});

export default getEtablissementsConfig;
