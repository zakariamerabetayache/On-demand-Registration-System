import React, { useMemo } from "react";
import {
    Table,
    Button,
    Space,
    Popconfirm,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import moment from "moment";
import StatusPill from "../StatusPill";
import { getStatusConfig } from "../../utils/statusUtils";

import { useCrudContext } from "../../contexts/CrudProvider";
import { useLanguage } from "../../locale/LanguageContext";
import ErrorHandling from "../ErrorHandling";

export default function GenericTable() {
    const { state, dispatch, config, loadEntities, service } = useCrudContext();
    const { translate } = useLanguage();

    const handleEdit = (entity) => {
        let selectedEntity = state.entities.find((e) => e.id === entity.id);
        if (!selectedEntity) {
            ErrorHandling("Entity not found");
            return;
        }
        dispatch({ type: "SHOW_EDIT_MODAL", payload: selectedEntity });
    };

    const handleView = (entity) => {
        dispatch({ type: "SHOW_VIEW_MODAL", payload: entity });
    };

    const handleDelete = async (id) => {
        try {
            dispatch({ type: "SET_DELETE", payload: id });
            await service.delete(id);
        } catch (error) {
            ErrorHandling(error)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    const columns = useMemo(() => {
        const cols = config.columns.map((col) => {
            if (col.dataindex === "date") {
                return {
                    ...col,
                    title: translate(col.title),
                    render: (text) => moment(text).format("YYYY-MM-DD"),
                };
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
                            handleRefresh: loadEntities,
                        }),
                };
            }
            return translatedCol;
        });

        if (config?.actions?.view || config?.actions?.edit || config?.actions?.delete) {
            cols.push({
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
        return cols;
    }, [config, translate, loadEntities]);

    const dataSource = useMemo(() => {
        return state.entities.map((entity) => ({
            ...entity,
            type: entity.type ? translate(entity.type) : undefined,
            sex: entity.sex ? translate(entity.sex) : undefined,
            how_benefit: entity.how_benefit ? translate(entity.how_benefit) : undefined,
        }));
    }, [state.entities, translate]);

    const handleTableChange = async (pagination, filters, sorter) => {
        try {
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                ...state.filters,
            };
            if (sorter && sorter.order) {
                params.sortBy = sorter.field;
                params.sortOrder = sorter.order === "ascend" ? "ASC" : "DESC";
            }
            await loadEntities(params);
        } catch (error) {
            ErrorHandling(error);
        }
    };

    return (
        <div style={{ minHeight: "400px" }}>
            <Table
                dataSource={dataSource}
                columns={columns}
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
        </div>
    );
}