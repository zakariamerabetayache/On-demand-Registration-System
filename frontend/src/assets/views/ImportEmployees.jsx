import React, { useState, useEffect } from "react";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../../axios-client";
import { Upload, Button, Progress, Card, Alert, Typography, Space, message } from "antd";
import { UploadOutlined, FileExcelOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useLanguage } from "../locale/LanguageContext";

const { Title, Text, Paragraph } = Typography;

function ImportEmployees() {
    const { user } = useStateContext();
    const { translate, isRTL } = useLanguage();

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [percent, setPercent] = useState(0);
    const [result, setResult] = useState(null);

    useEffect(() => {
        axiosClient.get("/user").catch((error) => {
            console.error("Error fetching user data:", error);
        });
    }, []);

    const handleFileChange = (info) => {
        if (info.file) {
            setFile(info.file);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            message.error(translate('please_select_file'));
            return;
        }

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("excelFile", file);
        formData.append("etablissement_id", user.etablissement_id);

        try {
            const response = await axiosClient.post("/import-employees", formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setPercent(percentCompleted);
                },
            });

            setResult({
                success: true,
                message: response.data.message,
                importedCount: response.data.imported_count,
                errors: response.data.errors || []
            });

            message.success(response.data.message);
            setFile(null);
        } catch (error) {
            const errorMessage = error.response?.data?.message || translate('import_error');
            setResult({
                success: false,
                message: errorMessage,
                errors: []
            });
            message.error(errorMessage);
        } finally {
            setLoading(false);
            setPercent(0);
        }
    };

    const uploadProps = {
        beforeUpload: (file) => {
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                || file.type === 'application/vnd.ms-excel'
                || file.name.endsWith('.xlsx')
                || file.name.endsWith('.xls')
                || file.name.endsWith('.csv');

            if (!isExcel) {
                message.error(translate('excel_files_only'));
                return Upload.LIST_IGNORE;
            }

            setFile(file);
            return false;
        },
        onChange: handleFileChange,
        maxCount: 1,
        accept: ".xlsx,.xls,.csv",
        showUploadList: false
    };

    return (
        <div style={{ padding: "24px", direction: isRTL ? 'rtl' : 'ltr' }}>
            <Card
                style={{
                    maxWidth: 700,
                    margin: "0 auto",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                            {translate('import_employees')}
                        </Title>
                        <Paragraph type="secondary">
                            {translate('import_employees_description')}
                        </Paragraph>
                    </div>

                    <Alert
                        message={translate('import_instructions_title')}
                        description={
                            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                <li>{translate('import_instruction_1')}</li>
                                <li>{translate('import_instruction_2')}</li>
                                <li>{translate('import_instruction_3')}</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                    />

                    <Upload.Dragger {...uploadProps} style={{ padding: '20px' }}>
                        <p className="ant-upload-drag-icon">
                            <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                        </p>
                        <p className="ant-upload-text">
                            {file ? file.name : translate('click_or_drag_file')}
                        </p>
                        <p className="ant-upload-hint">
                            {translate('supported_formats')}: .xlsx, .xls, .csv
                        </p>
                    </Upload.Dragger>

                    {file && (
                        <Alert
                            message={translate('selected_file')}
                            description={file.name}
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                        />
                    )}

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleImport}
                        loading={loading}
                        disabled={!file || loading}
                        block
                        icon={<UploadOutlined />}
                        style={{ height: 48, fontSize: 16 }}
                    >
                        {loading ? translate('importing') : translate('start_import')}
                    </Button>

                    {loading && (
                        <Progress
                            percent={percent}
                            status="active"
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                    )}

                    {result && (
                        <Alert
                            message={result.success ? translate('import_success') : translate('import_failed')}
                            description={
                                <div>
                                    <p>{result.message}</p>
                                    {result.importedCount !== undefined && (
                                        <p><strong>{translate('imported_count')}:</strong> {result.importedCount}</p>
                                    )}
                                    {result.errors.length > 0 && (
                                        <div>
                                            <strong>{translate('errors')}:</strong>
                                            <ul style={{ maxHeight: 150, overflow: 'auto' }}>
                                                {result.errors.map((err, idx) => (
                                                    <li key={idx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            }
                            type={result.success ? "success" : "error"}
                            showIcon
                        />
                    )}
                </Space>
            </Card>
        </div>
    );
}

export default ImportEmployees;
