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
import Swal from "sweetalert2";

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
        case "ADD_SUB_ENTITY_TO_TABLE":
            return {
                ...state,
                subEntities: [...state.subEntities, action.payload],
                createSubEntityModalVisible: false,
                subformData: {},
                subformErrors: {},
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
        case "DELETE_IN_SUB_TABLE":
            return { ...state, subEntities: state.subEntities.filter(item => item.id !== action.payload.id) }
        case "SET_FORM_DATA":
            return { ...state, formData: action.payload };

        case "SET_SUB_FORM_DATA":
            return { ...state, subformData: action.payload };
        case "CLEAR_FIELD_ERROR":
            const { [action.payload]: __, ...remainingErrors } = state.formErrors;
            return { ...state, formErrors: remainingErrors };
        case "CLEAR_SUBFIELD_ERROR":
            const { [action.payload]: _, ...remainingSubErrors } = state.subformErrors;
            return { ...state, subformErrors: remainingSubErrors };
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
        case "SET_SUBFORM_ERRORS":
            return { ...state, subformErrors: action.payload };
        case "CLEAR_FORM_ERROR":
            const updatedErrors = { ...state.formErrors };
            delete updatedErrors[action.payload];
            return { ...state, formErrors: updatedErrors };
        case "CLEAR_SUBFORM_ERROR":
            const updatedSubErrors = { ...state.subformErrors };
            delete updatedSubErrors[action.payload];
            return { ...state, subformErrors: updatedSubErrors };
        case "CLEAR_FORM":
            return { ...state, formData: {}, formErrors: {} };
        case "SHOW_CREATE_MODAL":
            return {
                ...state,
                modalVisible: true,
                editingEntity: null,
                formData: {},
                formErrors: {},
            };
        case "SHOW_EDIT_MODAL":
            return {
                ...state,
                modalVisible: true,
                editingEntity: action.payload.entity,
                formData: action.payload.entity,
                subEntities: action.payload.entity[action.payload.config.subEntityDisplayName] || [],
                formErrors: {},
                subformErrors: {},
            };
        case "HIDE_MODAL":
            return {
                ...state,
                modalVisible: false,
                editingEntity: null,
                formData: {},
                formErrors: {},
                subformData: {},
                subformErrors: {},
                subEntities: [],
            };
        case "ADD_SUB_ENTITY_TO_TABLE":
            return {
                ...state,
                subEntities: [...state.subEntities, action.payload],
                createSubEntityModalVisible: false,
                subformData: {},
                subformErrors: {},
            };
        case "SHOW_VIEW_MODAL":
            return {
                ...state,
                viewModalVisible: true,
                viewingEntity: action.payload,
            };
        case "HIDE_VIEW_MODAL":
            return { ...state, viewModalVisible: false, viewingEntity: null };
        case "SHOW_CREATE_SUB_ENTITY_MODAL":
            return {
                ...state,
                createSubEntityModalVisible: true,
            };
        case "HIDE_CREATE_SUB_ENTITY_MODAL":
            return { ...state, createSubEntityModalVisible: false };
        case "SHOW_SUB_ENTITIES_MODAL":
            return {
                ...state,
                subEntitiesModalVisible: true,
                selectedEntityForSubView: action.payload,
            };
        case "HIDE_SUB_ENTITIES_MODAL":
            return {
                ...state,
                subEntitiesModalVisible: false,
                selectedEntityForSubView: null,
            };
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

const ComplexGenericCrudd = ({ config, service, initialFilters = {} }) => {
    const { translate } = useLanguage();

    // State for dynamic select options
    const [dynamicOptions, setDynamicOptions] = useState({});

    // All state management now centralized in useReducer
    const [state, dispatch] = useReducer(genericReducer, {
        entities: [],
        subEntities: [],
        loading: false,
        searchLoading: false,
        modalVisible: false,
        editingEntity: null,
        editingSubEntity: null,
        viewModalVisible: false,
        viewingEntity: null,
        formData: {},
        formErrors: {},
        subformData: {},
        subformErrors: {},
        filters: initialFilters, // Initialize with initialFilters
        searchValue: "",
        createSubEntityModalVisible: false,
        subEntitiesModalVisible: false,
        selectedEntityForSubView: null,
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0,
        },
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

            console.log(" state.entities[lines]", JSON.stringify(state.entities["lines"]));
            console.log("entities", JSON.stringify(entities));
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

    // Load dynamic options for sub-entity fields when modal opens
    useEffect(() => {
        if (state.createSubEntityModalVisible && config.subEntityFields) {
            // Load options for all sub-entity fields that have loadOptions
            config.subEntityFields.forEach(async (field) => {
                if (field.loadOptions && field.type === 'select') {
                    console.log(`Loading options for sub-entity field: ${field.key}`);
                    try {
                        const options = await field.loadOptions();
                        console.log(`Loaded ${options.length} options for ${field.key}:`, options);
                        setDynamicOptions((prev) => ({
                            ...prev,
                            [field.key]: options,
                        }));
                    } catch (error) {
                        console.error(`Error loading options for ${field.key}:`, error);
                        setDynamicOptions((prev) => ({
                            ...prev,
                            [field.key]: [],
                        }));
                    }
                }
            });
        }
    }, [state.createSubEntityModalVisible, config.subEntityFields]);

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

        try {
            // Validate form
            if (!validateForm()) {
                return;
            }

            // Validate sub-entities if they exist and are required
            if (config.hasSubEntity && state.subEntities.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: translate('warning'),
                    text: `${translate('please_add_at_least_one')} ${translate(config.subEntityDisplayName || 'item')}`,
                    confirmButtonText: translate('ok')
                });
                return;
            }

            let response;

            // Separate file fields from regular form data
            const formData = { ...state.formData };
            const fileFields = {};

            // Identify file fields based on config
            config.fields.forEach(field => {
                if ((field.type === 'file' || field.type === 'img' || field.type === 'image') && formData[field.key]) {
                    fileFields[field.key] = formData[field.key];
                    delete formData[field.key]; // Remove from regular form data
                }
            });

            if (state.editingEntity) {
                // Update existing entity
                let subdata = state.subEntities;
                let mainEntityData = { ...config.silencevalues, ...formData };

                // Backend expects nested structure: { bonne_de_livraison: {...}, ligne_de_livraison: [...] }
                let storeData = {
                    [config.entityTitle]: mainEntityData,
                    [config.subEntityTitle]: subdata
                };
                response = await service.update(state.editingEntity.id, storeData);
                dispatch({ type: "SET_UPLOADING", payload: true });
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

                // Update the entity in the state
                dispatch({ type: "UPDATE_ENTITY", payload: response.data || response });

                message.success({
                    content: `${config.entityDisplayName} updated successfully`,
                    duration: 3,
                });
            } else {
                // Prepare data structure for backend with nested structure
                let subdata = state.subEntities;
                let mainEntityData = { ...config.silencevalues, ...formData };

                // Backend expects nested structure: { bonne_de_livraison: {...}, ligne_de_livraison: [...] }
                let storeData = {
                    [config.entityTitle]: mainEntityData,
                    [config.subEntityTitle]: subdata
                };

                console.log("storeData", JSON.stringify(storeData));
                response = await service.create(storeData);

                // Add the new entity to the state
                dispatch({ type: "ADD_ENTITY", payload: response.data || response });

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: translate('success'),
                    text: `${translate(config.entityDisplayName)} ${translate('created_successfully')}`,
                    showConfirmButton: false,
                    timer: 2000
                });
            }

            // Reload entities to reflect changes (optional, since we're updating state directly)
            await loadEntities({
                page: state.pagination?.current || 1,
                limit: state.pagination?.pageSize || 10,
                ...(state.filters || {}), // Preserve any existing filters
            });

            // Close modal and reset form only after successful operation
            handleCancel();

            return response;
        } catch (error) {
            console.error('Submit error:', error);

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
            Swal.fire({
                icon: 'error',
                title: translate('error'),
                text: error.response?.data?.message ||
                    `${translate('failed_to')} ${state.editingEntity ? translate('update') : translate('create')} ${translate(config.entityDisplayName)}`,
                confirmButtonText: translate('ok')
            });

            ErrorHandling(error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
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
    function handleSubDelete(record) {

        dispatch({ type: "SET_LOADING", payload: true });
        console.log("action.payload", JSON.stringify(record))


        dispatch({ type: "DELETE_IN_SUB_TABLE", payload: record })
        dispatch({ type: "SET_LOADING", payload: false });
    }

    // Handle modal actions
    const handleAdd = () => {
        // Form state is automatically reset in the reducer
        dispatch({ type: "SHOW_CREATE_MODAL" });
    };

    // Validate sub-entity form data
    const validateSubEntityForm = () => {
        const errors = {};

        if (!config.subEntityFields) return true;

        config.subEntityFields.forEach((field) => {
            const fieldKey = field.key;
            const value = state.subformData[fieldKey];

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

                    // Pattern validation
                    if (rule.pattern && value && !rule.pattern.test(value)) {
                        errors[fieldKey] = rule.message || `${field.label} is invalid`;
                        break;
                    }

                    // Min validation for numbers
                    if (rule.min && value && parseFloat(value) < rule.min) {
                        errors[fieldKey] =
                            rule.message ||
                            `${field.label} must be at least ${rule.min}`;
                        break;
                    }

                    // Max validation for numbers
                    if (rule.max && value && parseFloat(value) > rule.max) {
                        errors[fieldKey] =
                            rule.message ||
                            `${field.label} must be at most ${rule.max}`;
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

        // Update sub-form errors in state
        dispatch({ type: "SET_SUBFORM_ERRORS", payload: errors });

        return Object.keys(errors).length === 0;
    };

    function handleAddSubEntityToTable() {
        // Validate sub-entity form before adding
        if (!validateSubEntityForm()) {
            return;
        }
        console.log("state.subformData", state.subformData)

        // Merge silence values with form data
        let baseData = {
            ...config.subEntitySilenceValues,
            ...state.subformData
        };


        dispatch({ type: "ADD_SUB_ENTITY_TO_TABLE", payload: baseData });


        // // Show success message
        // message.success({
        //   content: `${translate(config.subEntityDisplayName || 'Item')} ${translate('added_successfully')}`,
        //   duration: 2,
        // });

        // Close the sub entity modal after adding
        dispatch({ type: "HIDE_CREATE_SUB_ENTITY_MODAL" });
    }

    const handleOpenSubModal = () => {
        dispatch({ type: "SHOW_CREATE_SUB_ENTITY_MODAL" });
    };

    const handleEdit = (entity) => {
        dispatch({ type: "SHOW_EDIT_MODAL", payload: { entity, config } });
    };

    const handleView = (entity) => {
        dispatch({ type: "SHOW_VIEW_MODAL", payload: entity });
    };

    const handleShowSubEntities = (entity) => {
        console.log("entity from showSubEntitiesModal", entity)
        dispatch({ type: "SHOW_SUB_ENTITIES_MODAL", payload: entity });
    };

    const handleHideSubEntities = () => {
        dispatch({ type: "HIDE_SUB_ENTITIES_MODAL" });
    };

    // Make the function globally available for the config
    React.useEffect(() => {
        window.showSubEntitiesModal = handleShowSubEntities;
        return () => {
            delete window.showSubEntitiesModal;
        };
    }, []);

    const handleCancel = () => {
        // Form state is automatically reset in the reducer
        dispatch({ type: "HIDE_MODAL" });
    };

    // Handle form field changes
    const handleFieldChange = (fieldKey, value, isSubEntity = false) => {
        if (isSubEntity) {
            dispatch({
                type: "SET_SUB_FORM_DATA",
                payload: {
                    ...state.subformData,
                    [fieldKey]: value,
                },
            });
        } else {
            dispatch({
                type: "SET_FORM_DATA",
                payload: {
                    ...state.formData,
                    [fieldKey]: value,
                },
            });
        }

        if (isSubEntity) {

            if (fieldKey === "password_confirmation") {
                if (state.formData.password !== value) {
                    dispatch({
                        type: "SET_SUBFORM_ERRORS",
                        payload: {
                            password_confirmation: "Passwords do not match",
                        },
                    });
                } else {
                    dispatch({
                        type: "CLEAR_SUBFIELD_ERROR",
                        payload: "password_confirmation",
                    });
                }
            }

        } else {

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
        }





        console.log("formdata", JSON.stringify(state.formData));
        console.log("subformdata", JSON.stringify(state.subformData));
        if (isSubEntity) {
            config.subEntityFields.forEach((field) => {
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
        } else {
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
        }
    };

    // Load dynamic options for select fields
    const loadDynamicOptions = async (field, fieldKey, relationValue) => {
        if (field.loadOptions) {
            try {
                const options = await field.loadOptions(relationValue);
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
            }
        }
    };

    // Load dynamic options when modal opens
    useEffect(() => {

        if (state.modalVisible) {
            config.fields.forEach((sfield) => {
                if (sfield.loadOptions) {
                    // Get the relation value from form data if it exists
                    const relationValue = sfield.relation
                        ? state.formData[sfield.relation]
                        : null;

                    loadDynamicOptions(sfield, sfield.key, relationValue);
                }
            });
        }

    }, [state.modalVisible, state.formData]);

    // Render form field based on type
    const renderFormField = (field, fieldKey, isSubEntity = false) => {
        const fieldValue = isSubEntity ? (state.subformData?.[fieldKey] || '') : (state.formData?.[fieldKey] || '');
        const fieldError = isSubEntity ? (state.subformErrors?.[fieldKey]) : (state.formErrors?.[fieldKey]);

        const handleFieldChangeWrapper = (value) => {
            // Clear error when user starts typing
            if (fieldError && isSubEntity) {
                dispatch({
                    type: "CLEAR_SUBFIELD_ERROR",
                    payload: fieldKey,
                });
            }
            else if (fieldError && !isSubEntity) {
                dispatch({
                    type: "CLEAR_FIELD_ERROR",
                    payload: fieldKey,
                });
            }
            handleFieldChange(fieldKey, value, isSubEntity);
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
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    );

                case "switch":
                    return (
                        <Switch checked={fieldValue} onChange={handleFieldChangeWrapper} />
                    );

                case "file":
                case "img":
                case "image":
                    // Only allow file uploads during update, not create
                    if (!state.editingEntity) {
                        return (
                            <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                                <Typography.Text type="secondary">
                                    {translate("logo_available_after_creation")}
                                </Typography.Text>
                            </div>
                        );
                    }

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
    const buildColumns = (issubEntityColumns = false) => {
        const columnsstart = issubEntityColumns ? config.subEntityColumns : config.columns;
        const columns = columnsstart.map((col) => {
            // Create a new column object with translated title
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
                            loadEntities, // Pass the refresh function
                            ...(issubEntityColumns
                                ? {
                                    handleSubDelete,
                                }
                                : {
                                    handleView,
                                    handleEdit,
                                    handleDelete,
                                }),
                        }),
                };
            }


            return translatedCol;
        });

        // Add actions column with translations
        columns.push({
            title: translate("actions"),
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    {issubEntityColumns ? (<Popconfirm
                        title={`${translate("are_you_sure_delete")} ${translate(
                            config.subEntityDisplayName
                        )}?`}
                        onConfirm={() => handleSubDelete(record)}
                        okText={translate("yes")}
                        cancelText={translate("no")}
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                            title={translate("delete")}
                        />
                    </Popconfirm>) : (
                        <>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => handleView(record)}
                                size="small"
                                title={translate("view")}
                            />
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                                size="small"
                                title={translate("edit")}
                            />
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
                        </>)}
                </Space>
            ),
        });

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
                    />
                </div>
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
                columns={buildColumns(false)}
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
                width={1100}
                placement="right"
                maskClosable={false}
                destroyOnClose={true}
                styles={{
                    header: {
                        borderBottom: "1px solid #fff",
                        paddingBottom: "16px",
                        marginBottom: "0",
                        backgroundColor: "#fff",
                    },
                    body: {
                        padding: "10px",
                        backgroundColor: "#fff",
                    },
                }}
                footer={
                    <div
                        style={{
                            textAlign: "right",
                            borderTop: "1px solid #fff",
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                        </div>
                    </form>
                </div>
                <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between" }}>
                    <Button type="primary" onClick={handleOpenSubModal}>
                        {translate("add")} {translate(config.subEntityDisplayName || "Item")}
                    </Button>
                    <Table
                        dataSource={state.subEntities}
                        columns={buildColumns(true)}
                        rowKey="id"
                        loading={state.loading}
                        onChange={handleTableChange}
                        scroll={{ x: "max-content" }}
                        style={{ width: "80%" }}

                    />
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
                                        { StatusPill, getStatusConfig }
                                    )
                                    : state.viewingEntity[field.key]}
                            </p>
                        ))}
                    </div>
                )}
            </Modal>

            <Modal
                title={`${translate(config.entityDisplayName)} ${translate("details")}`}
                open={state.createSubEntityModalVisible}
                width={800}
                zIndex={1050}
                onCancel={() => dispatch({ type: "HIDE_CREATE_SUB_ENTITY_MODAL" })}
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
                                onClick={handleAddSubEntityToTable}
                                loading={state.loading}
                                icon={state.subEditingEntity ? <EditOutlined /> : <PlusOutlined />}
                                style={{ minWidth: "100px" }}
                            >
                                {state.subEditingEntity
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

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {config?.subEntityFields?.map((field, index) => (
                            <div
                                key={field.key}
                                style={{
                                    marginBottom:
                                        index === config.subEntityFields.length - 1 ? "0" : "20px",
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
                                    {renderFormField(field, field.key, true)}
                                    {state.subformErrors[field.key] && (
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
                                            {translate(state.subformErrors[field.key])}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


            </Modal>

            {/* Sub-Entities Modal */}
            <Modal
                title={translate(config.subEntityTitle)}
                open={state.subEntitiesModalVisible}
                onCancel={handleHideSubEntities}
                width={1000}
                zIndex={1060}
                footer={[
                    <Button key="close" onClick={handleHideSubEntities}>
                        {translate("close")}
                    </Button>,
                ]}
            >
                {state.selectedEntityForSubView && (
                    <div>


                        <Table
                            dataSource={state.selectedEntityForSubView[config.subEntityDisplayName]}
                            columns={buildColumns(true)}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                            locale={{
                                emptyText: translate('no_sub_entities_found') || 'Aucune ligne trouvée'
                            }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ComplexGenericCrudd;
