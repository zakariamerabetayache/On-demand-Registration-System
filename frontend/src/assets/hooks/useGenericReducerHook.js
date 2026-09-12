import { useState, useReducer } from "react";

const genericReducer = (state, action) => {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_DELETE":
            return { ...state, loading: action.payload, entities: state.entities.filter((entity) => entity.id != action.payload) };
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
            return { ...state, formErrors: action.payload, loading: false };
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
                formData: {},
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

export const useGenericReducer = () => {
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
        filters: {},
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
    return { state, dispatch };
};

