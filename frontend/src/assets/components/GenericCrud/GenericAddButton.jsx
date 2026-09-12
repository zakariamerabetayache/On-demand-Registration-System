import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCrudContext } from "../../contexts/CrudProvider";
import { useLanguage } from "../../locale/LanguageContext";

export default function GenericAddButton() {
    const { dispatch, config } = useCrudContext();
    const { translate } = useLanguage();

    const handleAdd = () => {
        dispatch({ type: "SHOW_CREATE_MODAL" });
    };

    return (
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
    )
}