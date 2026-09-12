import React, { useReducer, useEffect, useState, useCallback } from "react";
import {
    Button,
    Input,
    InputNumber,
    Select,
    Space,
    message,
    Drawer,
    Upload,
    Switch,
    Typography,
    Progress,
    Checkbox,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useCrudContext } from "../../contexts/CrudProvider";
import { useLanguage } from "../../locale/LanguageContext";
const { TextArea } = Input;
const { Option } = Select;
import ErrorHandling from "../ErrorHandling";
import { useStateContext } from "../../contexts/ContextProvider";
const GenericDrawer = () => {
    const { state, dispatch, config, loadEntities, service } = useCrudContext();
    const { translate } = useLanguage();
    const [dynamicOptions, setDynamicOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState(new Set());
    const [optionsCache, setOptionsCache] = useState({});


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
    const handleCancel = () => {
        dispatch({ type: "HIDE_MODAL" });
    };
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
                        state?.editingEntity === null
                    ) {
                        errors[fieldKey] = rule.message || `${field.label} is required`;
                        break;
                    }
                    if (
                        rule.requiredupdate &&
                        (value === undefined || value === null || value === "") &&
                        state?.editingEntity
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

            // Identify file fields that need separate upload
            config.fields.forEach(field => {
                if ((field.type === 'file' || field.type === 'img' || field.type === 'image' || field.type === 'photo') && formData[field.key]) {
                    const methodName = `upload${field.key.charAt(0).toUpperCase() + field.key.slice(1)}`;
                    if (service[methodName]) {
                        fileFields[field.key] = formData[field.key];
                        delete formData[field.key]; // Only remove if we'll upload it separately
                    }
                }
            });

            let entityId;

            if (state.editingEntity) {

                console.log('formData:', JSON.stringify(formData));
                console.log('state.editingEntity:', JSON.stringify(state.editingEntity));

                entityId = state.editingEntity.id;
                response = await service.update(entityId, formData);

            } else {
                response = await service.create({
                    ...config.silencevalues,
                    ...formData,
                });

                // Extract entity ID from response
                entityId = response?.id ||
                    response?.[config.entityName]?.id ||
                    response?.data?.id ||
                    response?.data?.[config.entityName]?.id;

                message.success({
                    content: `${config.entityDisplayName} created successfully`,
                    duration: 3,
                });
            }


            if (entityId && Object.keys(fileFields).length > 0) {
                dispatch({ type: "SET_UPLOADING", payload: true });
                dispatch({ type: "SET_UPLOAD_PROGRESS", payload: 0 });

                for (const [fieldKey, file] of Object.entries(fileFields)) {
                    if (file instanceof File) {
                        try {
                            // Construct method name: uploadLogo, uploadImage, etc.
                            const methodName = `upload${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}`;

                            if (service[methodName]) {
                                await service[methodName](entityId, file, {
                                    onUploadProgress: (progressEvent) => {
                                        const percent = Math.round(
                                            (progressEvent.loaded * 100) / progressEvent.total
                                        );
                                        dispatch({ type: "SET_UPLOAD_PROGRESS", payload: percent });
                                    },
                                });
                            }
                        } catch (fileError) {
                            console.error(`Failed to upload ${fieldKey}:`, fileError);
                            message.warning(`${config.entityDisplayName} saved but ${fieldKey} upload failed`);
                        }
                    }
                }

                dispatch({ type: "RESET_UPLOAD_PROGRESS" });
            }
            dispatch({ type: "HIDE_MODAL" });




            // Reload entities to reflect changes
            await loadEntities({
                page: state.pagination?.current || 1,
                limit: state.pagination?.pageSize || 10,
                ...(state.filters || {}), // Preserve any existing filters
            });

            return response;
        } catch (error) {
            ErrorHandling(error);
        }
    };
    const renderFormField = (field, fieldKey) => {
        const fieldValue = state.formData[fieldKey];
        // console.log('Field value fieldValue:', fieldValue);
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
    }, [state.modalVisible]);
    return (
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
            width={config.styles?.drawer_width || "450px"}
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
                <form style={{ ...(config.styles?.drawer_width && { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }) }} onSubmit={handleSubmit}>
                    {config.fields.map((field, index) => {
                        if (field.depends && !state.formData[field.depends]) {
                            return null;
                        }
                        if (field.depends && state.formData[field.depends]) {
                            if (!field.dependsIn?.includes(state.formData[field.depends])) {
                                return null;
                            }
                        }

                        return (
                            <div
                                key={field.key}
                                style={{
                                    marginBottom:
                                        index === config.fields.length - 1 ? "0" : "20px"
                                }}
                            >
                                <div>
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
                            </div>
                        )
                    }
                    )}


                </form>
            </div >
        </Drawer >
    )
}
export default GenericDrawer;
