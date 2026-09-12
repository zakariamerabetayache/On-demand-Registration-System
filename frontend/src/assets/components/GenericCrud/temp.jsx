import React, { useReducer, useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Popconfirm,
  Drawer,
  Upload,
  Checkbox,
  Switch,
  Typography,
  Progress,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import StatusPill from "../StatusPill";
import { getStatusConfig } from "../../utils/statusUtils";
import { useLanguage } from "../../locale/LanguageContext";
import useDebounce from "../../hooks/useDebounce";
import Search from "../Search/Search";
const { TextArea } = Input;
const { Option } = Select;
import moment from "moment";

import CrudFilters from "../crudFilters/crudFilters";
import ColorStatus from "../ColorStatus/ColorStatus";
import ErrorHandling from "../ErrorHandling";
import { useStateContext } from "../../contexts/ContextProvider";

// Generic reducer for any entity
const genericReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SEARCH_LOADING":
      return { ...state, searchLoading: action.payload };
    case "SET_ENTITIES":
      return {
        ...state,
        entities: action.payload,
        loading: false,
        searchLoading: false,
      };
    case "SET_PAGINATION":
      return { ...state, pagination: action.payload };
    case "SET_SEARCH":
      return { ...state, searchValue: action.payload };
    case "ADD_ENTITY":
      return {
        ...state,
        entities: [action.payload, ...state.entities],
        modalVisible: false,
        formData: {},
        formErrors: {},
      };
    case "UPDATE_ENTITY":
      return {
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === action.payload.id ? action.payload : entity
        ),
        modalVisible: false,
        editingEntity: null,
        formData: {},
        formErrors: {},
      };
    case "DELETE_ENTITY":
      return {
        ...state,
        entities: state.entities.filter(
          (entity) => entity.id !== action.payload
        ),
        // Update pagination total if available
        pagination: state.pagination
          ? {
            ...state.pagination,
            total: Math.max(0, (state.pagination.total || 0) - 1),
          }
          : null,
      };
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload };
    case "CLEAR_FIELD_ERROR":
      const { [action.payload]: _, ...remainingErrors } = state.formErrors;
      return { ...state, formErrors: remainingErrors };
    case "UPDATE_FORM_FIELD":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value,
        },
      };
    case "SET_FORM_ERRORS":
      return { ...state, formErrors: action.payload };
    case "CLEAR_FORM_ERROR":
      const updatedErrors = { ...state.formErrors };
      delete updatedErrors[action.payload];
      return { ...state, formErrors: updatedErrors };
    case "CLEAR_FORM":
      return { ...state, formData: {}, formErrors: {} };
    case "SHOW_CREATE_MODAL":
      return {
        ...state,
        modalVisible: true,
        editingEntity: null,
        formData: action.payload || {},
        formErrors: {},
      };
    case "SHOW_EDIT_MODAL":
      return {
        ...state,
        modalVisible: true,
        editingEntity: action.payload,
        formData: action.payload,
        formErrors: {},
      };
    case "HIDE_MODAL":
      return {
        ...state,
        modalVisible: false,
        editingEntity: null,
        formData: {},
        formErrors: {},
      };
    case "SHOW_VIEW_MODAL":
      return {
        ...state,
        viewModalVisible: true,
        viewingEntity: action.payload,
      };
    case "HIDE_VIEW_MODAL":
      return { ...state, viewModalVisible: false, viewingEntity: null };
    case "ONFILTER":
      return { ...state, entities: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "CLEAR_FILTERS":
      return { ...state, filters: {} };
    case "SET_SEARCH":
      return {
        ...state,
        filters: { ...state.filters, search: action.payload },
        searchLoading: true,
        search: action.payload,
      };
    case "SET_UPLOADING":
      return { ...state, uploading: action.payload };
    case "SET_UPLOAD_PROGRESS":
      return { ...state, uploadProgress: action.payload };
    case "RESET_UPLOAD_PROGRESS":
      return { ...state, uploading: false, uploadProgress: 0 };
    default:
      return state;
  }
};

const GenericCruddd = ({ config, service, initialFilters = {} }) => {
  const { translate } = useLanguage();

  // State for dynamic select options
  const [dynamicOptions, setDynamicOptions] = useState({});

  // Cache for loaded options to prevent duplicate API calls
  const [optionsCache, setOptionsCache] = useState({});

  // Loading state for dynamic options to prevent multiple simultaneous requests
  const [loadingOptions, setLoadingOptions] = useState(new Set());

  // All state management now centralized in useReducer
  const [state, dispatch] = useReducer(genericReducer, {
    entities: [],
    loading: false,
    searchLoading: false,
    modalVisible: false,
    editingEntity: null,
    viewModalVisible: false,
    viewingEntity: null,
    formData: {},
    formErrors: {},
    filters: initialFilters, // Initialize with initialFilters
    searchValue: "",
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    // Upload progress state
    uploading: false,
    uploadProgress: 0,
  });
  const { user } = useStateContext();
  const loadEntities = useCallback(async (params = {}) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      let wantedIdInParams;
      if (config.entityName === "user") {
        wantedIdInParams = user?.id;
      }
      else {
        wantedIdInParams = user?.etablissement_id;
      }
      const response = await service.getAll(wantedIdInParams || null, params);

      // Handle both array and paginated responses
      const entities = response.data ? response.data : response;
      const pagination = response.pagination;

      dispatch({
        type: "SET_ENTITIES",
        payload: Array.isArray(entities) ? entities : [],
      });

      // If there's pagination data, store it
      if (pagination) {
        dispatch({
          type: "SET_PAGINATION",
          payload: pagination,
        });
      }
    } catch (error) {
      message.error(`Failed to load ${config.entityName}`);
      dispatch({ type: "SET_LOADING", payload: false });
      ErrorHandling(error);
    }
  }, [service, config.entityName]);
  // Load entities on component mount with initial filters
  useEffect(() => {
    const loadInitialEntities = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        let wantedId;
        if (config.entityName === "user") {
          wantedId = user?.id;
        }
        else {
          wantedId = user?.etablissement_id;
        }
        const response = await service.getAll(
          wantedId || null,
          {
            page: 1,
            limit: 10,
            ...initialFilters,
          });

        // Handle both array and paginated responses
        const entities = response.data ? response.data : response;
        const pagination = response.pagination;

        dispatch({
          type: "SET_ENTITIES",
          payload: Array.isArray(entities) ? entities : [],
        });

        // If there's pagination data, store it
        if (pagination) {
          dispatch({
            type: "SET_PAGINATION",
            payload: pagination,
          });
        }
      } catch (error) {
        message.error(`Failed to load ${config.entityName}`);
        dispatch({ type: "SET_LOADING", payload: false });
        ErrorHandling(error);
      }
    };

    loadInitialEntities();
  }, [service, config.entityName]); // Only re-run when service or entityName change

  // Use the useDebounce hook for search value
  const debouncedSearchValue = useDebounce(state.searchValue || "", 500);

  // Effect to trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue !== undefined) {
      loadEntities({
        page: 1,
        limit: state.pagination?.pageSize || 10,
        search: debouncedSearchValue,
        ...state.filters,
      }).finally(() => {
        dispatch({ type: "SET_SEARCH_LOADING", payload: false });
      });
    }
  }, [debouncedSearchValue, state.pagination?.pageSize, state.filters]);

  // Handle filter changes
  const handleFilterChange = async (filters) => {
    try {
      // Update filter state
      dispatch({ type: "SET_FILTERS", payload: filters });

      // Load entities with new filters
      await loadEntities({
        page: 1,
        limit: state.pagination?.pageSize || 10,
        ...filters,
      });


    } catch (error) {
      ErrorHandling(error);
    }
  };

  // Handle filter reset
  const handleFilterReset = async () => {
    try {
      // Clear filter state
      dispatch({ type: "CLEAR_FILTERS" });

      // Load entities without filters
      await loadEntities({
        page: 1,
        limit: state.pagination?.pageSize || 10,
      });
    } catch (error) {
      ErrorHandling(error);
    }
  };

  // Handle table pagination/sorting changes
  const handleTableChange = async (pagination, filters, sorter) => {
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...state.filters, // Preserve current filters
      };

      // Add sorting if available
      if (sorter && sorter.order) {
        params.sortBy = sorter.field;
        params.sortOrder = sorter.order === "ascend" ? "ASC" : "DESC";
      }

      await loadEntities(params);
    } catch (error) {
      ErrorHandling(error);
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    config.fields.forEach((field) => {
      const fieldKey = field.key;
      const value = state.formData[fieldKey];

      // Skip validation for disabled fields
      if (field.disabled) return;

      // Check required fields
      if (field.rules) {
        for (const rule of field.rules) {
          // Required validation
          if (
            rule.required &&
            (value === undefined || value === null || value === "")
          ) {
            errors[fieldKey] = rule.message || `${field.label} is required`;
            break;
          }
          if (
            rule.requiredcreate &&
            (value === undefined || value === null || value === "") &&
            state.editingEntity === null
          ) {
            errors[fieldKey] = rule.message || `${field.label} is required`;
            break;
          }
          if (
            rule.requiredupdate &&
            (value === undefined || value === null || value === "") &&
            state.editingEntity
          ) {
            errors[fieldKey] = rule.message || `${field.label} is required`;
            break;
          }

          // Pattern validation
          if (rule.pattern && value && !rule.pattern.test(value)) {
            errors[fieldKey] = rule.message || `${field.label} is invalid`;
            break;
          }

          // Min length validation
          if (rule.min && value && value.length < rule.min) {
            errors[fieldKey] =
              rule.message ||
              `${field.label} must be at least ${rule.min} characters`;
            break;
          }

          // Max length validation
          if (rule.max && value && value.length > rule.max) {
            errors[fieldKey] =
              rule.message ||
              `${field.label} must be at most ${rule.max} characters`;
            break;
          }

          // Custom validation function
          if (rule.validator) {
            const result = rule.validator(rule, value);
            if (result !== true) {
              errors[fieldKey] = result || `${field.label} is invalid`;
              break;
            }
          }
        }
      }
    });

    // Update form errors in state
    dispatch({ type: "SET_FORM_ERRORS", payload: errors });

    // Scroll to the first error field
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return Object.keys(errors).length === 0;
  };

  // Handle create/update
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set loading state
    dispatch({ type: "SET_LOADING", payload: true });

    // Validate form
    if (!validateForm()) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    try {
      let response;

      // Separate file fields from regular form data
      const formData = { ...state.formData };
      const fileFields = {};
      console.log("form from generic crud " + JSON.stringify(formData))

      // Identify file fields based on config
      config.fields.forEach(field => {
        if ((field.type === 'file' || field.type === 'img' || field.type === 'image' || field.type === 'photo') && formData[field.key]) {
          fileFields[field.key] = formData[field.key];
          // Only remove from regular form data if there's a specific upload handler below (like for 'logo')
          // Or if we're not handling it in the service's create/update via FormData
          if (field.key === 'logo' && service.uploadLogo) {
            delete formData[field.key];
          }
        }
      });

      if (state.editingEntity) {
        // Update existing entity
        response = await service.update(state.editingEntity.id, formData);

        // Handle file uploads after entity update
        if (Object.keys(fileFields).length > 0) {
          dispatch({ type: "SET_UPLOADING", payload: true });
          dispatch({ type: "SET_UPLOAD_PROGRESS", payload: 0 });

          for (const [fieldKey, file] of Object.entries(fileFields)) {
            if (file instanceof File) {
              try {
                // For logo field, use the uploadLogo method with progress tracking
                if (fieldKey === 'logo' && service.uploadLogo) {
                  const uploadResponse = await service.uploadLogo(state.editingEntity.id, file, {
                    onUploadProgress: (progressEvent) => {
                      const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                      );
                      dispatch({ type: "SET_UPLOAD_PROGRESS", payload: percent });
                    },
                  });
                }
                // Add more file upload handlers here for other file fields
              } catch (fileError) {
                console.error(`Failed to upload ${fieldKey}:`, fileError);
                message.warning(`${config.entityDisplayName} updated but ${fieldKey} upload failed`);
              }
            }
          }

          dispatch({ type: "RESET_UPLOAD_PROGRESS" });
        }

        message.success({
          content: `${config.entityDisplayName} updated successfully`,
          duration: 3,
        });
      } else {

        console.log("formData", JSON.stringify(formData));
        console.log("config.silencevalues", JSON.stringify(config.silencevalues));
        response = await service.create({
          ...config.silencevalues,
          ...formData,
        });



        message.success({
          content: `${config.entityDisplayName} created successfully`,
          duration: 3,
        });
      }

      // Reset form and close modal
      handleCancel();

      // Reload entities to reflect changes
      await loadEntities({
        page: state.pagination?.current || 1,
        limit: state.pagination?.pageSize || 10,
        ...(state.filters || {}), // Preserve any existing filters
      });

      return response;
    } catch (error) {
      console.error("Operation failed:", error);

      // Handle validation errors from the server
      if (error.response?.data?.errors) {
        const serverErrors = {};
        Object.entries(error.response.data.errors).forEach(
          ([field, messages]) => {
            serverErrors[field] = Array.isArray(messages)
              ? messages[0]
              : messages;
          }
        );
        dispatch({ type: "SET_FORM_ERRORS", payload: serverErrors });
      }

      // Show error message
      message.error({
        content:
          error.response?.data?.message ||
          `Failed to ${state.editingEntity ? "update" : "create"} ${config.entityDisplayName
          }`,
        duration: 5,
      });
      ErrorHandling(error);
      throw error;
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (id) => {
    try {
      // Set loading state
      dispatch({ type: "SET_LOADING", payload: true });

      // Call delete API
      await service.delete(id);

      // Update state to remove the deleted entity
      dispatch({ type: "DELETE_ENTITY", payload: id });

      // Show success message
      message.success({
        content: `${translate(config.entityDisplayName)} ${translate(
          "deleted_successfully"
        )}`,
        duration: 3,
      });

      // Note: No need to reload data since DELETE_ENTITY action already updated the state
    } catch (error) {
      console.error("Delete failed:", error);
      message.error({
        content:
          error.response?.data?.message ||
          `${translate("failed_to_delete")} ${translate(
            config.entityDisplayName
          )}`,
        duration: 5,
      });
      // Don't re-throw the error to prevent unhandled promise rejection
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Handle modal actions
  const handleAdd = () => {
    // Form state is automatically reset in the reducer
    dispatch({
      type: "SHOW_CREATE_MODAL",
      payload: config.defaultFormValues || {}
    });
  };

  const handleEdit = (entity) => {
    // Form state is automatically set in the reducer
    dispatch({ type: "SHOW_EDIT_MODAL", payload: entity });
  };

  const handleView = (entity) => {
    dispatch({ type: "SHOW_VIEW_MODAL", payload: entity });
  };

  const handleCancel = () => {
    // Form state is automatically reset in the reducer
    dispatch({ type: "HIDE_MODAL" });
  };

  // Handle form field changes
  const handleFieldChange = (fieldKey, value) => {
    dispatch({
      type: "SET_FORM_DATA",
      payload: {
        ...state.formData,
        [fieldKey]: value,
      },
    });

    // Handle password confirmation validation
    if (fieldKey === "password_confirmation") {
      if (state.formData.password !== value) {
        dispatch({
          type: "SET_FORM_ERRORS",
          payload: {
            password_confirmation: "Passwords do not match",
          },
        });
      } else {
        dispatch({
          type: "CLEAR_FIELD_ERROR",
          payload: "password_confirmation",
        });
      }
    }

    // Handle dependent dropdowns
    config.fields.forEach((field) => {
      if (field.relation === fieldKey) {
        // Clear the dependent field value
        dispatch({
          type: "UPDATE_FORM_FIELD",
          payload: {
            field: field.key,
            value: undefined, // Clear dependent field
          },
        });

        // Clear the cached options for the dependent field
        setDynamicOptions((prev) => ({
          ...prev,
          [field.key]: [],
        }));

        // Reload options for the dependent field if value is provided
        if (value && field.loadOptions) {
          loadDynamicOptions(field, field.key, value);
        }
      }
    });
  };

  // Load dynamic options for select fields with caching and loading protection
  const loadDynamicOptions = async (field, fieldKey, relationValue) => {
    if (field.loadOptions) {
      // Create cache key based on field and relation value
      const cacheKey = `${fieldKey}_${relationValue || 'null'}`;

      // Check if already loading this field
      if (loadingOptions.has(cacheKey)) {
        return; // Prevent multiple simultaneous requests
      }

      // Check cache first
      if (optionsCache[cacheKey]) {
        setDynamicOptions((prev) => ({
          ...prev,
          [fieldKey]: optionsCache[cacheKey],
        }));
        return;
      }

      // Mark as loading
      setLoadingOptions((prev) => new Set([...prev, cacheKey]));

      try {
        const options = await field.loadOptions(relationValue);

        // Cache the result
        setOptionsCache((prev) => ({
          ...prev,
          [cacheKey]: options,
        }));

        setDynamicOptions((prev) => ({
          ...prev,
          [fieldKey]: options,
        }));
      } catch (error) {
        console.error(`Error loading options for ${fieldKey}:`, error);
        setDynamicOptions((prev) => ({
          ...prev,
          [fieldKey]: [],
        }));
      } finally {
        // Remove from loading set
        setLoadingOptions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
      }
    }
  };

  // Load dynamic options when modal opens - FIXED: Removed state.formData dependency
  useEffect(() => {
    if (state.modalVisible) {
      config.fields.forEach((field) => {
        if (field.loadOptions) {
          // Get the relation value from form data if it exists
          const relationValue = field.relation
            ? state.formData[field.relation]
            : null;

          loadDynamicOptions(field, field.key, relationValue);
        }
      });
    }
  }, [state.modalVisible]); // ← FIXED: Only depend on modalVisible, not formData

  // Render form field based on type
  const renderFormField = (field, fieldKey) => {
    const fieldValue = state.formData[fieldKey];
    console.log('Field value fieldValue:', fieldValue);
    const fieldError = state.formErrors[fieldKey];

    const handleFieldChangeWrapper = (value) => {
      // Clear error when user starts typing
      if (fieldError) {
        dispatch({
          type: "CLEAR_FIELD_ERROR",
          payload: fieldKey,
        });
      }
      console.log('Field change:', fieldKey, value);
      handleFieldChange(fieldKey, value);
    };

    const commonProps = {
      placeholder: field.placeholder || `Enter ${field.label}`,
      value: fieldValue,
      onChange: (e) => {
        const value = e?.target ? e.target.value : e;
        handleFieldChangeWrapper(value);
      },
      disabled: state.loading,
      status: fieldError ? "error" : "",
    };

    const renderField = () => {
      switch (field.type) {
        case "textarea":
          return <TextArea rows={4} {...commonProps} />;

        case "number":
          return (
            <InputNumber
              min={field.min}
              max={field.max}
              step={field.step}
              style={{ width: "100%" }}
              {...commonProps}
              onChange={handleFieldChangeWrapper}
            />
          );

        case "select":
          // Use dynamic options if available, otherwise use static options
          const options = dynamicOptions[fieldKey] || field.options || [];
          const isLoading = field.loadOptions && !dynamicOptions[fieldKey];

          return (
            <Select
              {...commonProps}
              onChange={handleFieldChangeWrapper}
              allowClear
              loading={isLoading}
              style={{ width: "100%" }}
              placeholder={isLoading ? "Loading..." : commonProps.placeholder}
            >
              {options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {translate(option.label)}
                </Option>
              ))}
            </Select>
          );

        case "switch":
          return (
            <Switch checked={fieldValue} onChange={handleFieldChangeWrapper} />
          );

        case "checkbox":
          return (
            <Checkbox
              checked={fieldValue}
              onChange={(e) => handleFieldChangeWrapper(e.target.checked)}
            />
          );

        case "file":
        case "img":
        case "image":
        case "photo":
          // Allow file uploads during create and update
          const isCreating = !state.editingEntity;

          return (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Typography.Title level={4}>
                {translate(field.label || "upload_image")}
              </Typography.Title>
              <Upload.Dragger
                accept={field.accept || "image/*"}
                beforeUpload={(file) => {
                  // Validate file type
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error(translate('file_must_be_image'));
                    return false;
                  }

                  // Validate file size (2MB)
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error(translate('image_must_smaller_than_2mb'));
                    return false;
                  }

                  // Store the file in form data for later processing
                  handleFieldChangeWrapper(file);
                  return false; // Prevent automatic upload
                }}
                showUploadList={false}
                style={{ marginTop: "20px" }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined
                    style={{ fontSize: "48px", color: "#1890ff" }}
                  />
                </p>
                <p className="ant-upload-text">
                  {translate("drag_or_click_to_upload")}
                </p>
                <p className="ant-upload-hint">
                  {translate("image_upload_hint")}
                </p>
              </Upload.Dragger>
              {fieldValue && (
                <div style={{ marginTop: "10px", color: "#52c41a" }}>
                  {translate("file_selected")}: {fieldValue.name || fieldValue}
                </div>
              )}
              {state.uploading && (
                <div style={{ marginTop: "20px", padding: "0 20px" }}>
                  <Progress
                    percent={state.uploadProgress}
                    status={state.uploadProgress === 100 ? "success" : "active"}
                    strokeColor={{
                      from: "#108ee9",
                      to: "#87d068",
                    }}
                    style={{ width: "100%" }}
                  />
                  <div style={{ textAlign: "center", marginTop: "8px", color: "#666" }}>
                    {state.uploadProgress < 100
                      ? translate("uploading_progress")
                      : translate("upload_complete")
                    }
                  </div>
                </div>
              )}
            </div>
          );

        default:
          return <Input {...commonProps} type={field.type} />;
      }
    };

    return renderField();
  };

  // Build table columns from config
  const buildColumns = () => {
    const columns = config.columns.map((col) => {
      // Create a new column object with translated title
      if (col.dataindex === "date") {
        const translatedCol = {
          ...col,
          title: translate(col.title),
          render: (text, record) => {
            return moment(text).format("YYYY-MM-DD");
          },
        };
        return translatedCol;
      }
      const translatedCol = {
        ...col,
        title: translate(col.title),
      };

      if (col.render) {
        return {
          ...translatedCol,
          render: (value, record) =>
            col.render(value, record, {
              StatusPill,
              getStatusConfig,
              Space,
              Button,
              EditOutlined,
              DeleteOutlined,
              EyeOutlined,
              handleView,
              handleEdit,
              handleDelete,
              translate,
              currentLanguage: state.currentLanguage || localStorage.getItem('selectedLanguage') || 'ar',
              isRTL: (state.currentLanguage || localStorage.getItem('selectedLanguage')) === 'ar',
            }),
        };
      }
      return translatedCol;
    });

    // Add actions column with translations
    if (config?.actions?.view || config?.actions?.edit || config?.actions?.delete) {
      columns.push({
        title: translate("actions"),
        key: "actions",
        width: 150,
        render: (_, record) => (
          <Space>
            {config?.actions?.view && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
                size="small"
                title={translate("view")}
              />
            )}
            {config?.actions?.edit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
                title={translate("edit")}
              />
            )}
            {config?.actions?.delete && (
              <Popconfirm
                title={`${translate("are_you_sure_delete")} ${translate(
                  config.entityDisplayName
                )}?`}
                onConfirm={() => handleDelete(record.id)}
                okText={translate("yes")}
                cancelText={translate("no")}
              >
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  title={translate("delete")}
                />
              </Popconfirm>
            )}
          </Space>
        ),
      });
    }

    return columns;
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    dispatch({ type: "SET_SEARCH", payload: value });



    // Set loading state for search
    dispatch({ type: "SET_SEARCH_LOADING", payload: true });

    // If empty, trigger search immediately
    if (!value) {
      loadEntities({
        page: 1,
        limit: state.pagination?.pageSize || 10,
        ...state.filters,
        search: "",
      });
    }
    // Otherwise, the debounced search will be triggered by useEffect when debouncedSearchValue changes
  };

  // Handle search button click or Enter key
  const handleSearchSubmit = (value) => {
    loadEntities({
      page: 1,
      limit: state.pagination?.pageSize || 10,
      ...state.filters,
      search: value,
    });
  };
  async function onButtonClick(filter, status) {
    if (status === "all") {
      dispatch({ type: "CLEAR_FILTERS" });
    } else {
      dispatch({ type: "SET_FILTERS", payload: { [filter]: status } });
      await loadEntities({
        page: 1,
        limit: state.pagination?.pageSize || 10,
        ...state.filters,
      });
    }

  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1> {translate(config.title)}</h1>
      </div>
      <div
        style={{
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div
          style={{ display: "flex", gap: "12px", flex: 1, maxWidth: "500px" }}
        >
          <Search
            value={state.searchValue || ""}
            onChange={handleSearchChange}
            onSearch={handleSearchSubmit}
            loading={state.searchLoading}
            placeholder={translate(config?.filters?.find(f => f.type === 'search')?.placeholder || 'search')}
          />
        </div>
        {config?.actions && config?.actions.create && (

          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size="middle"
            >
              {translate("add")} {translate(config.entityDisplayName || "Item")}
            </Button>
          </div>
        )}
      </div>

      {config?.filters && (
        <CrudFilters
          config={config}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      )}
      {config?.colorStatus && (
        <ColorStatus
          config={config.colorStatus}
          onButtonClick={onButtonClick}
          dispatch={dispatch}
        />
      )}

      <Table
        dataSource={state.entities}
        columns={buildColumns()}
        rowKey="id"
        loading={state.loading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        pagination={{
          current: state.pagination?.current || 1,
          pageSize: state.pagination?.pageSize || 10,
          total: state.pagination?.total || 0,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} ${translate("of")} ${total} ${translate(
              "items"
            )}`,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
      />

      {/* Create/Edit Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {state.editingEntity ? (
              <EditOutlined style={{ color: "#1890ff" }} />
            ) : (
              <PlusOutlined style={{ color: "#52c41a" }} />
            )}
            <span style={{ fontSize: "16px", fontWeight: "600" }}>
              {state.editingEntity
                ? `${translate("edit")} ${translate(config.entityDisplayName)}`
                : `${translate("add")} ${translate(config.entityDisplayName)}`}
            </span>
          </div>
        }
        open={state.modalVisible}
        onClose={handleCancel}
        width={450}
        placement="right"
        maskClosable={false}
        destroyOnClose={true}
        styles={{
          header: {
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: "16px",
            marginBottom: "0",
          },
          body: {
            padding: "10px",
            backgroundColor: "#fafafa",
          },
        }}
        footer={
          <div
            style={{
              textAlign: "right",
              borderTop: "1px solid #f0f0f0",
              padding: "16px 24px",
              backgroundColor: "#fff",
            }}
          >
            <Space>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={state.loading}
                icon={state.editingEntity ? <EditOutlined /> : <PlusOutlined />}
                style={{ minWidth: "100px" }}
              >
                {state.editingEntity
                  ? translate("update")
                  : translate("create")}
              </Button>
            </Space>
          </div>
        }
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {config.fields.map((field, index) => (
              <div
                key={field.key}
                style={{
                  marginBottom:
                    index === config.fields.length - 1 ? "0" : "20px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#262626",
                  }}
                >
                  {translate(field.label)}
                  {field.rules?.some((rule) => rule.required) && (
                    <span style={{ color: "#ff4d4f", marginLeft: "4px" }}>
                      *
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  {renderFormField(field, field.key)}
                  {state.formErrors[field.key] && (
                    <div
                      style={{
                        color: "#ff4d4f",
                        fontSize: "12px",
                        marginTop: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>⚠️</span>
                      {translate(state.formErrors[field.key])}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </form>
        </div>
      </Drawer>

      {/* View Modal */}
      <Modal
        title={`${translate(config.entityDisplayName)} ${translate("details")}`}
        open={state.viewModalVisible}
        onCancel={() => dispatch({ type: "HIDE_VIEW_MODAL" })}
        footer={[
          <Button
            key="close"
            onClick={() => dispatch({ type: "HIDE_VIEW_MODAL" })}
          >
            {translate("close")}
          </Button>,
        ]}
      >
        {state.viewingEntity && (
          <div>
            {config.viewFields.map((field) => (
              <p key={field.key}>
                <strong>{translate(field.label)}:</strong>{" "}
                {field.render
                  ? field.render(
                    state.viewingEntity[field.key],
                    state.viewingEntity,
                    {
                      StatusPill,
                      getStatusConfig,
                      translate,
                      currentLanguage: localStorage.getItem('selectedLanguage') || 'ar',
                      isRTL: localStorage.getItem('selectedLanguage') === 'ar'
                    }
                  )
                  : state.viewingEntity[field.key]}
              </p>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GenericCruddd;
