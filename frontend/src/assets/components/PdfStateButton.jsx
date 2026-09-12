import React from "react";
import { Select } from "antd";

const PdfStateButton = ({ currentState = 0, onChange, disabled = false }) => {
    const pdfStateOptions = [
        { value: 0, label: "لم يتم رفع ملف", color: "#d9d9d9" },
        { value: 1, label: "تم رفع ملف", color: "#1890ff" },
        { value: 2, label: "تم قبول الملف", color: "#52c41a" },
    ];

    const handleChange = (value) => {
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <Select
            value={currentState}
            onChange={handleChange}
            disabled={disabled}
            style={{ width: 150 }}
            size="small"
        >
            {pdfStateOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: option.color,
                                marginLeft: 8,
                            }}
                        />
                        {option.label}
                    </div>
                </Select.Option>
            ))}
        </Select>
    );
};

export default PdfStateButton;
