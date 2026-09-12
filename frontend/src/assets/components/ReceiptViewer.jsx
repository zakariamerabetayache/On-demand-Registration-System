import React from "react";
import { Button, Tag, Space } from "antd";
import { FileTextOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useLanguage } from "../locale/LanguageContext";

const ReceiptViewer = ({ record }) => {
  const { translate } = useLanguage();

  if (!record.price_receipt) {
    return (
      <Tag icon={<CloseCircleOutlined />} color="default">
        {translate("no_receipt") || "No Receipt"}
      </Tag>
    );
  }

  const receiptUrl = `${import.meta.env.VITE_API_BASE_URL}/storage/${record.price_receipt}`;
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(record.price_receipt);
  const isPdf = /\.pdf$/i.test(record.price_receipt);

  return (
    <Space direction="vertical" size="small">
      <Tag icon={<CheckCircleOutlined />} color="success">
        {translate("receipt_uploaded") || "Receipt Uploaded"}
      </Tag>
      
      <Space.Compact>
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {translate("view") || "View"}
        </Button>
        
        <Button
          size="small"
          icon={<FileTextOutlined />}
          href={receiptUrl}
          download
        >
          {translate("download") || "Download"}
        </Button>
      </Space.Compact>
      
      <div style={{ fontSize: "11px", color: "#666" }}>
        {isImage && (translate("image_file") || "Image")}
        {isPdf && (translate("pdf_file") || "PDF")}
      </div>
    </Space>
  );
};

export default ReceiptViewer;
