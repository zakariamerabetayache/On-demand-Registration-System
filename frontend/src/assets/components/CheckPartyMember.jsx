import React, { useState } from "react";
import { Button, Modal, Switch, Tag, Card, Avatar, Divider, Space, message } from "antd";
import { UserOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import partyMembersService from "../services/partyMembersService";
import { useLanguage } from "../locale/LanguageContext";
import { useStateContext } from "../contexts/ContextProvider";
import ErrorHandling from "../components/ErrorHandling";
import moment from "moment";

export default function CheckPartyMember({ record, onUpdate }) {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentState, setCurrentState] = useState(record?.state || 'in_waiting');
    const { translate } = useLanguage();
    const { user } = useStateContext();

    const canValidate = () => {
        if (!user || !record?.etablissement) return false;
        if (user.role_id === 'admin' || user.role_id === 'national_admin') return true;

        // Wilaya admin can only validate if allowed by establishment settings
        if (user.role_id === 'wilaya_admin') {
            return record.etablissement.validation_by === 'wilayi';
        }

        return false;
    };
    const showImages = record?.identity_image || record?.self_photo;

    const handleShow = () => {
        setVisible(true);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    const handleStateChange = async (checked) => {
        setLoading(true);
        try {
            const newState = checked ? 'joined' : 'in_waiting';
            await partyMembersService.updateState(record.id, newState);

            setCurrentState(newState);
            message.success(
                checked
                    ? translate("member_activated_successfully") || "Member activated successfully"
                    : translate("member_deactivated_successfully") || "Member deactivated successfully"
            );

            if (onUpdate) onUpdate();
        } catch (error) {
            ErrorHandling(error);
            message.error(
                translate("error_updating_member_state") || "Error updating member state"
            );
        } finally {
            setLoading(false);
        }
    };

    const getSexLabel = (sex) => {
        if (sex === 0) { return translate("male") || "ذكر"; }
        if (sex === 1) return translate("female") || "أنثى";
        return translate("not_specified") || "غير محدد";
    };

    const getStateColor = (state) => {
        switch (state) {
            case 'joined': return 'success';
            case 'in_waiting': return 'warning';
            case 'inactive': return 'error';
            default: return 'default';
        }
    };

    const getStateLabel = (state) => {
        switch (state) {
            case 'joined': return translate("joined") || "عضو نشط";
            case 'in_waiting': return translate("in_waiting") || "في الانتظار";
            case 'inactive': return translate("inactive") || "غير نشط";
            default: return state;
        }
    };

    if (!record) {
        return (
            <Button size="small" disabled>
                {translate("check_member") || "Check Member"}
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
                {translate("check_member") || "فحص العضو"}
            </Button>

            <Modal
                title={
                    <div style={{ textAlign: "center", fontSize: "18px", fontWeight: "600" }}>
                        <UserOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
                        {translate("member_details") || "تفاصيل العضو"}
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
                        {/* Image Section - Only shown if enabled in parameters */}
                        {showImages && (
                            <div style={{ flex: "0 0 400px" }}>
                                <Card
                                    cover={
                                        record.identity_image ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.identity_image.replace('public/', '')}`}
                                                alt="Identity Card"
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
                                    style={{ borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}
                                >
                                    <Card.Meta title={translate("identity_card")} />
                                </Card>
                                <Card
                                    cover={
                                        record.self_photo ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.self_photo.replace('public/', '')}`}
                                                alt="Personal Photo"
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
                                >
                                    <Card.Meta title={translate("personal_photo") || "صورة شخصية"} />
                                </Card>
                            </div>
                        )}

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
                                            <Tag color={record.sex == 0 ? "blue" : "pink"}>
                                                {getSexLabel(record.sex)}
                                            </Tag>
                                        </div>
                                        <div>
                                            <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("birth_date") || "تاريخ الميلاد"}:</p>
                                            <p style={{ margin: 0, fontSize: "14px" }}>
                                                {record.date_nais
                                                    ? moment(record.date_nais).format("YYYY-MM-DD")
                                                    : translate("not_specified") || "غير محدد"}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#52c41a" }}>{translate("function") || "الوظيفة"}:</p>
                                            <p style={{ margin: 0, fontSize: "14px" }}>{record.function || translate("not_specified") || "غير محدد"}</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Referral Info */}
                                {record.referrer && (
                                    <Card size="small" style={{ borderRadius: "8px", background: "#f0f5ff" }}>
                                        <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#722ed1" }}>
                                            {translate("referred_by") || "تمت الإحالة بواسطة"}:
                                        </p>
                                        <p style={{ margin: 0, fontSize: "14px" }}>
                                            {record.referrer.nom_ar} {record.referrer.prenom_ar}
                                        </p>
                                    </Card>
                                )}
                            </Space>
                        </div>
                    </div>
                </Card>

                <Divider />

                {/* State Management Section */}
                <Card
                    style={{
                        background: currentState === 'joined' ? "#f6ffed" : "#fffbe6",
                        border: `1px solid ${currentState === 'joined' ? "#b7eb8f" : "#ffe58f"}`,
                        borderRadius: "12px"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                {currentState === 'joined' ? (
                                    <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
                                ) : (
                                    <CloseCircleOutlined style={{ fontSize: "24px", color: "#faad14" }} />
                                )}
                                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                                    {translate("membership_status")}: {" "}
                                    <Tag color={getStateColor(currentState)} style={{ fontSize: "14px" }}>
                                        {getStateLabel(currentState)}
                                    </Tag>
                                </span>
                            </div>
                            <p style={{
                                margin: 0,
                                color: currentState === 'joined' ? "#52c41a" : "#faad14",
                                fontSize: "14px",
                                fontWeight: "500"
                            }}>
                                {currentState === 'joined'
                                    ? (translate("member_activated_message") || "تم تفعيل العضوية - يمكن للعضو الوصول إلى النظام")
                                    : (translate("member_waiting_message") || "العضوية في الانتظار - تحتاج إلى موافقة الإدارة")
                                }
                            </p>
                            {!canValidate() && (
                                <p style={{ margin: "4px 0 0 0", color: "#ff4d4f", fontSize: "12px", fontWeight: "500" }}>
                                    <CloseCircleOutlined style={{ marginRight: "4px" }} />
                                    {translate("national_validation_required") || "يتطلب تفعيل من مستوى المدير الوطني"}
                                </p>
                            )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>
                                {translate("approve_member") || "الموافقة على العضو"}:
                            </span>
                            <Switch
                                checked={currentState === 'joined'}
                                onChange={handleStateChange}
                                loading={loading}
                                disabled={!canValidate()}
                                checkedChildren={translate("approved") || "موافق"}
                                unCheckedChildren={translate("pending") || "معلق"}
                                style={{ minWidth: "70px" }}
                            />
                        </div>
                    </div>
                </Card>
            </Modal>
        </>
    );
}
