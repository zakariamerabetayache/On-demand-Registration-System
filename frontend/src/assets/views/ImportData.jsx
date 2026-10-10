import React, { useState, useEffect } from "react";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../../axios-client";
import { Upload, Button, Progress, Select } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import ErrorHandling from "../components/hooks/ErrorHandling";

function ImportData() {
    const { user, token, setUser, setToken, notification } = useStateContext();

    useEffect(() => {
        axiosClient
            .get("/user")
            .then(({ data }) => {
                setUser(data);
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);
            });
    }, []);

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [percent, setPercent] = useState(0);
    const [route, setRoute] = useState("/importwilaya");

    const handleFileChange = (info) => {
        setFile(info.file);
    };

    const handleImport = () => {
        setLoading(true);
        const formData = new FormData();

        formData.append("excelFile", file);

        axiosClient
            .post(route, formData, {
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setPercent(percent);
                },
            })
            .then((response) => {
                setLoading(false);
                setPercent(0);
            })
            .catch((error) => {
                ErrorHandling(error);
            });

    };

    const handleRouteChange = (value) => {
        setRoute(value);
    };

    return (
        <div
            style={{
                padding: 20,
                border: "1px solid #ddd",
                borderRadius: 10,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }}
        >
            <h1 style={{ marginBottom: 20, textAlign: "center" }}>
                استيراد البيانات
            </h1>




            <Select
                value={route}
                onChange={handleRouteChange}
                style={{ width: "100%", marginBottom: 20 }}
            >   <Select.Option disabled={user.role_id != 99} value="/importwilaya">
                    استيراد الولايات
                </Select.Option>
                <Select.Option disabled={user.role_id != 99} value="/importcommune">
                    استيراد البلديات
                </Select.Option>
                <Select.Option disabled={user.role_id != 1} value={`/importstudent/${user.dou_id}/${user.residence_id}`}>
                    استيراد ملفات الطلاب
                </Select.Option>
                <Select.Option disabled={user.role_id == 99} value="/importpavillon">
                    استيراد الأجنحة
                </Select.Option>
                <Select.Option disabled={user.role_id == 99} value="/importchambre">
                    استيراد الغرف
                </Select.Option>


            </Select>
            <Upload
                beforeUpload={(file) => {
                    setFile(file);
                    return false;
                }}
                onChange={handleFileChange}
            >
                <Button
                    icon={<InboxOutlined />}
                    style={{ width: "100%", marginBottom: 20 }}
                >
                    اختر الملف
                </Button>
            </Upload>
            <Button
                type="primary"
                onClick={handleImport}
                loading={loading}
                disabled={loading}
                style={{ width: "100%" }}
            >
                {loading ? "جاري التحميل..." : "استيراد"}
            </Button>
            {loading && (
                <Progress
                    percent={percent}
                    style={{ width: "100%", marginTop: 20 }}
                />
            )}
        </div>
    );
}

export default ImportData;
