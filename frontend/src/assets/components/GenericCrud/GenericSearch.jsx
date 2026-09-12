
import { Input } from "antd";
import { SearchOutlined, LoadingOutlined } from "@ant-design/icons";
import { useLanguage } from "../../locale/LanguageContext";

export default function GenericSearch() {
    return (
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
    )
}



// Simple search input with loading state
export default function Search({
    value = "",
    onChange,
    onSearch,
    loading = false,
    placeholder = "Search..."
}) {
    const { translate } = useLanguage();


    return (
        <div className="search-container">
            <Input.Search
                placeholder={translate(placeholder) || "Search..."}
                value={value}
                onChange={onChange}
                onSearch={onSearch}
                loading={loading}
                allowClear
                enterButton
                suffix={loading ? <LoadingOutlined /> : <SearchOutlined />}
                style={{ width: 300 }}
            />
            <style>{`
        .search-container {
          transition: all 0.3s;
        }
        .search-container :global(.ant-input) {
          transition: all 0.3s;
        }
        .search-container :global(.ant-input:focus) {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      `}</style>
        </div>
    );
}
