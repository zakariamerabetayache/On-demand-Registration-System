import { createContext, useContext, useCallback } from "react";
const CrudContext = createContext();
import { useGenericReducer } from "../hooks/useGenericReducerHook";
import ErrorHandling from "../components/ErrorHandling"
import { useStateContext } from "./ContextProvider";


export default function CrudProvider({ children, config, service }) {
    const { state, dispatch } = useGenericReducer();
    const { user } = useStateContext()
    const loadEntities = useCallback(async (idOrParams = {}, maybeParams) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true });

            let wantedId;
            let params;

            if (typeof idOrParams === 'object' && !Array.isArray(idOrParams)) {
                // Case: loadEntities(params)
                params = idOrParams;
                if (config.entityName === "user") {
                    wantedId = user?.id;
                } else {
                    wantedId = user?.etablissement_id || user?.etablissement?.id;
                }
            } else {
                // Case: loadEntities(id, params)
                wantedId = idOrParams;
                params = maybeParams || {};
            }

            const response = await service.getAll(wantedId || null, params);

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
            dispatch({ type: "SET_LOADING", payload: false });
            ErrorHandling(error);
        }
    }, [service, config.entityName]);
    let value = {
        state,
        dispatch,
        config,
        service,
        loadEntities
    }
    return (
        <CrudContext.Provider value={value}>
            {children}
        </CrudContext.Provider>
    )
}
export const useCrudContext = () => {
    const context = useContext(CrudContext);
    if (!context) {
        throw new Error('useCrudContext must be used within a CrudProvider');
    }
    return context;
};