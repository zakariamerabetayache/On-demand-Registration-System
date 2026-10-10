import React, { useEffect, useState } from "react";
import {
    Form,
    Card,
    Switch,
    message,
    Spin,
    Typography,
    Space,
    Row,
    Col,
    Badge,
    Input,
    ColorPicker,
    Button,
    Divider,
} from "antd";
import {
    SettingOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import etablissementsService from "../services/etablissementsService";
import { useStateContext } from "../contexts/ContextProvider";
import { useLanguage } from "../locale/LanguageContext";
import ErrorHandling from "../components/ErrorHandling";
import Swal from "sweetalert2";

const { Title, Text } = Typography;

const EtablissementParameters = () => {
    const [form] = Form.useForm();
    const [whiteLabelForm] = Form.useForm();
    const { translate } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [whiteLabelUpdating, setWhiteLabelUpdating] = useState(false);
    const [updatingFields, setUpdatingFields] = useState({});
    const [etablissement, setEtablissement] = useState(null);
    const { user, setUser } = useStateContext();
    console.log

    useEffect(() => {
        fetchEtablissement();
    }, []);

    const fetchEtablissement = async () => {
        try {
            if (!user?.etablissement?.id) {
                console.warn("User has no etablissement_id in context");
                // Do not return early yet, maybe we can find it elsewhere or show a better error
                // message.error(translate("no_establishment_associated"));
                // setLoading(false);
                // return;
            }

            const id = user?.etablissement?.id;
            if (!id) {
                setLoading(false);
                return;
            }

            const response = await etablissementsService.getById(id);
            // Laravel Resources wrap data in a 'data' key
            const data = response.data || response;
            setEtablissement(data);

            // set form values based on API response (force boolean for switches)
            form.setFieldsValue({
                verificationby: !!data.verificationby,
                change_token: !!data.change_token,
                validation_by: data.validation_by === "wilayi",
            });
            whiteLabelForm.setFieldsValue({
                app_name: data.app_name,
                hero_title: data.hero_title,
                hero_description: data.hero_description,
                primary_color: data.primary_color,
            });
        } catch (error) {
            console.error("Error fetching etablissement:", error);
            ErrorHandling(error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Generic handler to update a single parameter field
     */
    const updateParameter = async (fieldName, checked) => {
        // Debug: Show that function was called





        // Try to get ID from user context OR from the already loaded etablissement state
        // We check etablissement?.id because we unwrapped it in fetchEtablissement
        const etablissementId = user?.etablissement?.id || etablissement?.id;

        if (!etablissementId) {
            console.error("❌ Still no etablissement ID found", {
                user: user,
                etablissement: etablissement
            });

            await Swal.fire({
                icon: 'error',
                title: 'ID Missing',
                text: `Could not find Establishment ID. (User Context: ${user?.etablissement?.id}, State: ${etablissement?.id})`
            });
            return;
        }

        try {
            // First, get the latest data to make sure we don't overwrite other things if needed
            // though the updateParameters call on backend is specific enough now.
            setUpdatingFields((prev) => ({ ...prev, [fieldName]: true }));

            // Determine the value to send to API
            let valueToUpdate = checked;

            if (fieldName === "validation_by") {
                valueToUpdate = checked ? "wilayi" : "watani";
            }

            const parameterData = { [fieldName]: valueToUpdate };

            const updateResponse = await etablissementsService.updateParameters(etablissementId, parameterData);
            const updatedEtab = updateResponse.etablissement || updateResponse.data || updateResponse;

            // Update local etablissement state to keep it in sync with what server returned
            setEtablissement(updatedEtab);

            // Trigger form update as well to be sure UI reflects server state
            form.setFieldsValue({
                verificationby: !!updatedEtab.verificationby,
                change_token: !!updatedEtab.change_token,
                validation_by: updatedEtab.validation_by === "wilayi",
            });

            setUser({
                ...user,
                etablissement: updatedEtab,
            });

            message.success({
                content: translate("parameter_updated"),
                key: fieldName,
                duration: 2,
            });
        } catch (error) {
            ErrorHandling(error);

            // Debug: Show error
            await Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: `Failed to update ${fieldName}: ${error.message}`,
            });

            // Revert UI to previous state stored in etablissement
            if (etablissement) {
                let revertValue;
                if (fieldName === "validation_by") {
                    revertValue = etablissement.validation_by === "wilayi";
                } else {
                    revertValue = !!etablissement[fieldName];
                }

                form.setFieldsValue({ [fieldName]: revertValue });
            }
        } finally {
            setUpdatingFields((prev) => ({ ...prev, [fieldName]: false }));
        }
    };

    const handleWhiteLabelFinish = async (values) => {
        // Convert antd ColorPicker object to pure hex string
        if (values.primary_color && typeof values.primary_color === 'object' && values.primary_color.toHexString) {
            values.primary_color = values.primary_color.toHexString();
        }

        const etablissementId = user?.etablissement?.id || etablissement?.id;
        if (!etablissementId) {
            message.error("ID Missing");
            return;
        }

        setWhiteLabelUpdating(true);
        try {
            const updateResponse = await etablissementsService.updateParameters(etablissementId, values);
            const updatedEtab = updateResponse.etablissement || updateResponse.data || updateResponse;

            setEtablissement(updatedEtab);
            setUser({
                ...user,
                etablissement: updatedEtab,
            });
            message.success(translate("white_label_updated") || "White label configuration updated successfully!");
        } catch (error) {
            ErrorHandling(error);
        } finally {
            setWhiteLabelUpdating(false);
        }
    };

    const ParameterItem = ({
        icon,
        title,
        desc,
        name,
        iconColor,
        bgColor,
        checkedChildren,
        unCheckedChildren,
        onChange,
    }) => (
        <div
            style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#fff",
                transition: "all 0.3s ease",
                border: "1px solid #f0f0f0",
                marginBottom: "16px",
                position: "relative",
                overflow: "hidden",
            }}
            className="parameter-item-hover"
        >
            <Row align="middle" gutter={24}>
                <Col>
                    <div
                        style={{
                            background: bgColor,
                            padding: "12px",
                            borderRadius: "12px",
                            color: iconColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 10px ${bgColor}80`,
                        }}
                    >
                        {React.cloneElement(icon, { style: { fontSize: "24px" } })}
                    </div>
                </Col>
                <Col flex="1">
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "17px", color: "#1a1a1a" }}>
                            {title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                            {desc}
                        </Text>
                    </Space>
                </Col>
                <Col>
                    <Form.Item name={name} valuePropName="checked" style={{ margin: 0 }}>
                        <Switch
                            size="large"
                            loading={updatingFields[name]}
                            checkedChildren={checkedChildren}
                            unCheckedChildren={unCheckedChildren}
                            onChange={(checked) => {
                                if (onChange && typeof onChange === 'function') {
                                    onChange(name, checked);
                                } else {
                                    console.error('❌ onChange is not a function!', onChange);
                                }
                            }}
                            style={{
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                minWidth: checkedChildren ? "80px" : "auto",
                            }}
                        />
                    </Form.Item>
                </Col>
            </Row>
            {updatingFields[name] && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "#1890ff",
                        animation: "loading-bar 1.5s infinite linear",
                    }}
                />
            )}
        </div>
    );

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" tip={translate("loading_parameters")} />
            </div>
        );
    }

    return (
        <div style={{ padding: "20px 24px", maxWidth: "900px", margin: "0 auto" }}>
            <style>
                {`
                    @keyframes loading-bar {
                        0% { left: -100%; width: 100%; }
                        100% { left: 100%; width: 100%; }
                    }
                    .parameter-item-hover:hover {
                        border-color: #1890ff !important;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        transform: translateY(-2px);
                    }
                `}
            </style>

            <div style={{ marginBottom: "40px", textAlign: "center" }}>
                <Badge count={<SettingOutlined style={{ color: "#1890ff", fontSize: "24px" }} />} offset={[10, 10]}>
                    <div
                        style={{
                            background: "#e6f7ff",
                            width: "80px",
                            height: "80px",
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px",
                        }}
                    >
                        <SettingOutlined style={{ fontSize: "40px", color: "#1890ff" }} />
                    </div>
                </Badge>
                <Title level={2} style={{ marginBottom: "8px", fontWeight: 700 }}>
                    {translate("establishment_parameters")}
                </Title>
                <Text type="secondary" style={{ fontSize: "16px" }}>
                    {translate("manage_establishment_settings_desc")}
                </Text>
            </div>

            <Card
                bordered={false}
                style={{
                    borderRadius: "24px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    background: "#fcfcfc",
                    padding: "12px",
                }}
            >
                <Form form={form} layout="vertical">
                    <ParameterItem
                        name="verificationby"
                        icon={<SafetyCertificateOutlined />}
                        iconColor="#1890ff"
                        bgColor="#e6f7ff"
                        title={translate("identity_verification")}
                        desc={translate("identity_verification_desc")}
                        checkedChildren={translate("active")}
                        unCheckedChildren={translate("inactive")}
                        onChange={updateParameter}
                    />

                    <ParameterItem
                        name="change_token"
                        icon={<ReloadOutlined />}
                        iconColor="#faad14"
                        bgColor="#fff7e6"
                        title={translate("change_token")}
                        desc={translate("change_token_desc")}
                        checkedChildren={translate("yes")}
                        unCheckedChildren={translate("no")}
                        onChange={updateParameter}
                    />

                    <ParameterItem
                        name="validation_by"
                        icon={<TeamOutlined />}
                        iconColor="#52c41a"
                        bgColor="#f6ffed"
                        title={translate("validation_authority")}
                        desc={translate("validation_authority_desc")}
                        checkedChildren={translate("wilaya_allowed")}
                        unCheckedChildren={translate("watani_only")}
                        onChange={updateParameter}
                    />
                </Form>

                <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <Space size="small" style={{ color: "#8c8c8c" }}>
                        <CheckCircleOutlined />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            {translate("changes_saved_automatically")}
                        </Text>
                    </Space>
                </div>
            </Card>

            <Card
                bordered={false}
                style={{
                    borderRadius: "24px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    background: "#fcfcfc",
                    padding: "12px",
                    marginTop: "24px"
                }}
            >
                <div>
                    <Title level={4} style={{ marginBottom: 16 }}>{translate('landing_page_config') || 'Landing Page Configuration'}</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        {translate('landing_page_config_desc') || 'Customize the white-label components for the main public landing page.'}
                    </Text>

                    <Form form={whiteLabelForm} layout="vertical" onFinish={handleWhiteLabelFinish}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="app_name" label={translate('app_name') || 'Application Name'}>
                                    <Input size="large" placeholder={translate('enter_app_name') || 'E.g. TrackLife portal'} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="primary_color" label={translate('primary_color') || 'Primary Color'}>
                                    <ColorPicker size="large" showText />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="hero_title" label={translate('hero_title') || 'Hero Title'}>
                                    <Input size="large" placeholder={translate('enter_hero_title') || 'Welcome to...'} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="hero_description" label={translate('hero_description') || 'Hero Description'}>
                                    <Input.TextArea size="large" rows={3} placeholder={translate('enter_hero_description') || 'Join our powerful community...'} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Button type="primary" htmlType="submit" size="large" loading={whiteLabelUpdating}>
                                {translate('save_changes') || 'Save Changes'}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Card>
        </div>
    );
};

export default EtablissementParameters;
