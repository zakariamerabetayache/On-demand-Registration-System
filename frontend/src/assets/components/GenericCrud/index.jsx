import React, { useReducer, useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../locale/LanguageContext";
import useDebounce from "../../hooks/useDebounce";
import Search from "../Search/Search";
import CrudFilters from "../crudFilters/crudFilters";
import ColorStatus from "../ColorStatus/ColorStatus";
import ErrorHandling from "../ErrorHandling";
import GenericShowModal from "./GenericShowModal";
import GenericAddButton from "./GenericAddButton";
import GenericTable from "./GenericTable";
import GenericDrawer from "./GenericDrawer";
import { useCrudContext } from "../../contexts/CrudProvider";
const GenericCrud = ({ initialFilters = {} }) => {
  const { translate } = useLanguage();
  const { state, dispatch, config, service, loadEntities } = useCrudContext();
  const debouncedSearchValue = useDebounce(state.searchValue || "", 500);
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
        {config?.actions && config?.actions.create && (
          <GenericAddButton />
        )}
      </div>


      <CrudFilters />

      {config?.colorStatus && (
        <ColorStatus
          config={config.colorStatus}
          onButtonClick={onButtonClick}
          dispatch={dispatch}
        />
      )}
      <GenericDrawer />
      <GenericTable />
      <GenericShowModal />
    </div>
  );
};

export default GenericCrud;
