import React from "react";
import communesService from "../services/communesService";
import wilayasService from "../services/wilayasService";
import ErrorHandling from "../components/ErrorHandling";

// Communes CRUD Configuration
export const communesConfig = {
  title: "communes",
  entityName: "commune",
  entityDisplayName: "commune",

  // Filter by wilaya
  filters: [
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
    },
  ],

  // Table columns configuration
  columns: [
    {
      title: "designation_ar",
      dataIndex: "designation_ar",
      key: "designation_ar",
    },
    {
      title: "designation_fr",
      dataIndex: "designation_fr",
      key: "designation_fr",
    },
    {
      title: "wilaya_designation_ar",
      dataIndex: "wilaya_designation_ar",
      key: "wilaya_designation_ar",
    },
    {
      title: "wilaya_designation_fr",
      dataIndex: "wilaya_designation_fr",
      key: "wilaya_designation_fr",
    },
    {
      title: "postalc",
      dataIndex: "postalc",
      key: "postalc",
    },
  ],

  // Form fields configuration
  fields: [
    {
      key: "designation_ar",
      label: "designation_ar",
      type: "text",
      rules: [{ required: true, message: "please_enter_designation_ar" }],
    },
    {
      key: "designation_fr",
      label: "designation_fr",
      type: "text",
      rules: [{ required: true, message: "please_enter_designation_fr" }],
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
      key: "postalc",
      label: "postalc",
      type: "number",
      rules: [{ required: true, message: "please_enter_postalc" }],
    },
  ],

  // View fields configuration (for view modal)
  viewFields: [
    { key: "designation_ar", label: "designation_ar" },
    { key: "designation_fr", label: "designation_fr" },
    { key: "wilaya_designation_ar", label: "wilaya_designation_ar" },
    { key: "wilaya_designation_fr", label: "wilaya_designation_fr" },
    { key: "postalc", label: "postalc" },
  ],

  // Actions configuration
  actions: {
    create: true,
    edit: true,
    delete: true,
    view: true,
  },

  // Simple color status for communes (no complex filtering needed)
  
};
