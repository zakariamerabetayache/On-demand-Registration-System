import React from "react";
import wilayasService from "../services/wilayasService";
import ErrorHandling from "../components/ErrorHandling";

// Wilayas CRUD Configuration
export const wilayasConfig = {
  title: "wilayas",
  entityName: "wilaya",
  entityDisplayName: "wilaya",

  filters: [],

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
      title: "postalw",
      dataIndex: "postalw",
      key: "postalw",
    },
    {
      title: "communes_count",
      dataIndex: "communes_count",
      key: "communes_count",
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
      key: "postalw",
      label: "postalw",
      type: "number",
      rules: [{ required: true, message: "please_enter_postalw" }],
    },
  ],

  // View fields configuration (for view modal)
  viewFields: [
    { key: "designation_ar", label: "designation_ar" },
    { key: "designation_fr", label: "designation_fr" },
    { key: "postalw", label: "postalw" },
    { key: "communes_count", label: "communes_count" },
  ],

  // Actions configuration
  actions: {
    create: true,
    edit: true,
    delete: true,
    view: true,
  },

  // Color status configuration for statistics (simple for wilayas)

  
};
