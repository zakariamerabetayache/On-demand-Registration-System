import React, { useState } from "react";
import { Button, Modal, Switch, Tag, Card, Avatar, Divider, Space, message } from "antd";
import { UserOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axiosClient from "../../axios-client";
import { useLanguage } from "../locale/LanguageContext";
import ErrorHandling from "../components/ErrorHandling";
import moment from "moment";


export default function CheckParent({ record }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState(record?.state || 0);
  const { translate } = useLanguage();

  const handleShow = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleStateChange = async (checked) => {
    console.log("checked", checked);
    setLoading(true);
    try {
      const newState = checked ? 1 : 0;
      await axiosClient.put(`/parents/${record.id}/state`, {
        state: newState
      });

      setCurrentState(newState);
      message.success(
        checked
          ? translate("parent_activated_successfully") || "Parent activated successfully"
          : translate("parent_deactivated_successfully") || "Parent deactivated successfully"
      );
    } catch (error) {
      ErrorHandling(error);
      message.error(
        translate("error_updating_parent_state") || "Error updating parent state"
      );
    } finally {
      setLoading(false);
    }
  };

  const getSexLabel = (sex) => {
    if (sex === 0) return translate("male") || "ذكر";
    if (sex === 1) return translate("female") || "أنثى";
    return translate("not_specified") || "غير محدد";
  };

  if (!record) {
    return (
      <Button size="small" disabled>
        {translate("check") || "Check"}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="primary"
        size="small"
        icon={<EyeOutlined />}
        onClick={handleShow}
        style={{
          borderRadius: '6px',
          fontSize: '12px'
        }}
      >
        {translate("check") || "Check"}
      </Button>

      <Modal
        title={
          <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "600" }}>
            <UserOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
            {translate("parent_details") || "تفاصيل الولي"}
          </div>
        }
        open={visible}
        footer={null}
        onCancel={handleCancel}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ padding: "24px" }}
      >
        <Card
          bordered={false}
          style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            borderRadius: "12px",
            marginBottom: "20px"
          }}
        >
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            {/* Image Section */}
            <div style={{ flex: "0 0 400px" }}>
              <Card
                cover={
                  record.identity_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.identity_image}`}
                      alt="Parent Identity"
                      style={{
                        width: "100%",
                        height: "250px",
                        objectFit: "cover",
                        borderRadius: "8px 8px 0 0"
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "250px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "8px 8px 0 0"
                      }}
                    >
                      <Avatar size={80} icon={<UserOutlined />} />
                    </div>
                  )
                }
                style={{ borderRadius: "8px", overflow: "hidden" }}
              />
              <Card
                cover={
                  record.self_photo ? (
                    <div>
                      <img

                        src={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.self_photo}`}
                        alt="Parent Identity"
                        style={{
                          margin: "auto",
                          width: "250px",
                          objectFit: "cover",
                          borderRadius: "8px 8px 0 0"
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "250px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "8px 8px 0 0"
                      }}
                    >
                      <Avatar size={80} icon={<UserOutlined />} />
                    </div>
                  )
                }
                style={{ borderRadius: "8px", overflow: "hidden" }}
              />
              <div style={{ display: 'none', width: "100%", height: "250px", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
                <Avatar size={80} icon={<UserOutlined />} />
              </div>
            </div>

            {/* Info Section */}
            <div style={{ flex: 1 }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {/* Names */}
                <Card size="small" style={{ borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#1890ff" }}>{translate("arabic_name") || "الاسم العربي"}:</p>
                      <p style={{ margin: 0, fontSize: "16px" }}>{record.nom_ar || translate("not_specified") || "غير محدد"}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#1890ff" }}>{translate("latin_name") || "الاسم اللاتيني"}:</p>
                      <p style={{ margin: 0, fontSize: "16px" }}>{record.nom_fr || translate("not_specified") || "غير محدد"}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#1890ff" }}>{translate("arabic_surname") || "اللقب العربي"}:</p>
                      <p style={{ margin: 0, fontSize: "16px" }}>{record.prenom_ar || translate("not_specified") || "غير محدد"}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#1890ff" }}>{translate("latin_surname") || "اللقب اللاتيني"}:</p>
                      <p style={{ margin: 0, fontSize: "16px" }}>{record.prenom_fr || translate("not_specified") || "غير محدد"}</p>
                    </div>
                  </div>
                </Card>

                {/* Personal Info */}
                <Card size="small" style={{ borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("email_address") || "البريد الإلكتروني"}:</p>
                      <p style={{ margin: 0, fontSize: "14px" }}>{record.email || translate("not_specified") || "غير محدد"}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("phone_number") || "رقم الهاتف"}:</p>
                      <p style={{ margin: 0, fontSize: "14px" }}>{record.telephone || translate("not_specified") || "غير محدد"}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("national_id") || "رقم التعريف الوطني"}:</p>
                      <p style={{ margin: 0, fontSize: "14px" }}>{record.nin || translate("not_specified") || "غير محدد"}</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("gender") || "الجنس"}:</p>
                      <Tag color={record.sex === 0 ? "blue" : "pink"}>
                        {getSexLabel(record.sex)}
                      </Tag>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("birth_date") || "تاريخ الميلاد"}:</p>
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        {record.date_nais
                          ? moment(record.date_nais).format("YYYY-MM-DD") // you can change the format if you want
                          : translate("not_specified") || "غير محدد"}
                      </p>                    </div>
                    <div>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("certificate_number") || "رقم شهادة التعريف"}:</p>
                      <p style={{ margin: 0, fontSize: "14px" }}>{record.nb_crt || translate("not_specified") || "غير محدد"}</p>
                    </div>
                  </div>
                </Card>
              </Space>
            </div>
          </div>
        </Card>

        <Divider />

        {/* State Management Section */}
        <Card
          style={{
            background: currentState === 1 ? "#f6ffed" : "#fff2f0",
            border: `1px solid ${currentState === 1 ? "#b7eb8f" : "#ffccc7"}`,
            borderRadius: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                {currentState === 1 ? (
                  <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
                ) : (
                  <CloseCircleOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />
                )}
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  {translate("account_status") || "حالة الحساب"}: {" "}
                  <Tag color={currentState === 1 ? "success" : "error"} style={{ fontSize: "14px" }}>
                    {currentState === 1 ? (translate("active") || "نشط") : (translate("inactive") || "غير نشط")}
                  </Tag>
                </span>
              </div>
              <p style={{
                margin: 0,
                color: currentState === 1 ? "#52c41a" : "#ff4d4f",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                {currentState === 1
                  ? (translate("account_activated_message") || "تم تفعيل الحساب - يمكن للولي الوصول إلى النظام")
                  : (translate("account_deactivated_message") || "الحساب غير مفعل - يحتاج إلى موافقة الإدارة")
                }
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                {translate("activate_deactivate") || "تفعيل/إلغاء تفعيل"}:
              </span>
              <Switch
                checked={currentState === 1}
                onChange={handleStateChange}
                loading={loading}
                checkedChildren={translate("active") || "نشط"}
                unCheckedChildren={translate("inactive") || "غير نشط"}
                style={{ minWidth: "60px" }}
              />
            </div>
          </div>
        </Card>
      </Modal>
    </>
  );
}