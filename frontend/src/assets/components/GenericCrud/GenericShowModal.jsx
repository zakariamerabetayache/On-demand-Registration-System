import React from "react";
import { Modal, Button } from "antd";
import { useLanguage } from "../../locale/LanguageContext";
import StatusPill from "../StatusPill";
import { getStatusConfig } from "../../utils/statusUtils";
import { useCrudContext } from "../../contexts/CrudProvider";
const GenericShowModal = () => {
    const { translate } = useLanguage();
    const { state, dispatch, config } = useCrudContext();
    return (

        <Modal
            title={`${translate("details_of")} ${translate(config.entityDisplayName)}`}
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
    );
};

export default GenericShowModal;