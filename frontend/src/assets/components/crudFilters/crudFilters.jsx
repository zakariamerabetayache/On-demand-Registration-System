import React, { useState, useEffect } from "react";
import { Select, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useLanguage } from "../../locale/LanguageContext";
import { useCrudContext } from "../../contexts/CrudProvider";

export default function CrudFilters() {
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState({});
  const { translate } = useLanguage();
  const { state, dispatch, config, loadEntities } = useCrudContext();
  const handleFilterChange = async (key, value) => {
    try {
      let relatedField = config.filters.find((f) => f.relation === key);
      console.log("relatedField", JSON.stringify(relatedField));
      console.log("relatedFiel value d", value);
      if (relatedField) {
        let responce = await relatedField.loadOptions(value);
        setDynamicOptions((prev) => ({
          ...prev,
          [relatedField.key]: responce,
        }));
      }

      const newFilters = { ...state.filters, [key]: value };
      dispatch({ type: "SET_FILTERS", payload: newFilters });
      await loadEntities({
        page: 1,
        limit: state.pagination?.pageSize || 10,
        ...newFilters,
      });


    } catch (error) {
      ErrorHandling(error);
    }
  };
  const handleReset = async () => {
    try {
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


  // Early return if no filters configured
  if (!config?.filters || config?.filters?.length === 0) {
    return;
  }

  const loadFilterOptions = async () => {
    for (const filter of config.filters) {
      if (filter.loadOptions && !dynamicOptions[filter.key] && !filter.relation) {
        setLoadingOptions((prev) => ({ ...prev, [filter.key]: true }));
        try {
          const options = await filter.loadOptions();
          console.log("filter" + JSON.stringify(filter))
          setDynamicOptions((prev) => ({
            ...prev,
            [filter.key]: options,
          }));
        } catch (error) {
          console.error(
            `Error loading filter options for ${filter.key}:`,
            error
          );
          setDynamicOptions((prev) => ({
            ...prev,
            [filter.key]: [],
          }));
        } finally {
          setLoadingOptions((prev) => ({ ...prev, [filter.key]: false }));
        }
      }
    }
  };
  useEffect(() => {
    loadFilterOptions(null);
  }, [config.filters]);

  return (
    <div
      style={{
        width: "100%",
        padding: "6px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "end",
        gap: "16px",
        backgroundColor: "#fafafa",
        borderRadius: "6px",
        marginBottom: "6px",
      }}
    >
      {config?.filters?.map((filter, index) => (
        <div key={filter.key || index} style={{ minWidth: "200px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}
          >
            {translate(filter.label)}
          </label>

          <Select
            style={{ width: "100%" }}
            placeholder={
              loadingOptions[filter.key]
                ? "Loading..."
                : translate(`${config.selectText || "Select"} ${filter.label}`)
            }
            options={
              dynamicOptions[filter.key] ||
              filter.options?.map((option) => ({
                value: option.value,
                label: translate(option.label),
              })) ||
              []
            }
            value={state.filters[filter.key] || undefined}
            onChange={(value) => handleFilterChange(filter.key, value)}
            loading={loadingOptions[filter.key]}
            allowClear
          />
        </div>
      ))}
      <Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleReset}
          title={translate(config.resetTitle || "Reset Filters")}
        >
          {translate(config.resetText || "Reset")}
        </Button>
      </Space>
    </div>
  );
}
