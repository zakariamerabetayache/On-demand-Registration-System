import React, { useState, useEffect } from "react";
import {
    Card,
    Form,
    Button,
    Input,
    Select,
    InputNumber,
    message,
    Spin,
    Upload,
    Divider,
} from "antd";
import { UploadOutlined, SaveOutlined } from "@ant-design/icons";
import { useStateContext } from "../contexts/ContextProvider";
import { useLanguage } from "../locale/LanguageContext";
import etablissementsService from "../services/etablissementsService";
import wilayasService from "../services/wilayasService";
import communesService from "../services/communesService";
import ErrorHandling from "../components/ErrorHandling";

const { Option } = Select;

const EtablissementInfo = () => {
    const { user } = useStateContext();
    const { translate } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [wilayas, setWilayas] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [etablissementData, setEtablissementData] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, [user]);

    const fetchInitialData = async () => {
        if (!user || (!user.etablissement_id && user.role !== 'superadmin')) return;

        // For superadmin, this page might need to behave differently or just show nothing since they are not bound to one establishment
        // Assuming for now this is for logged in managers/admins of a specific establishment
        if (!user.etablissement_id) return;

        setLoading(true);
        try {
            const etablissement = await etablissementsService.getById(
                user.etablissement_id
            );
            setEtablissementData(etablissement.data || etablissement);

            const wilayaData = await wilayasService.getAllForDropdown();
            setWilayas(wilayaData);

            // Handle raw response or resource response
            const etablissementObj = etablissement.data || etablissement;

            if (etablissementObj.wilaya_id) {
                const communeData = await communesService.getByWilaya(etablissementObj.wilaya_id);
                setCommunes(communeData);
            }

            form.setFieldsValue({
                ...etablissementObj,
                state: etablissementObj.state || 'open'
            });
        } catch (error) {
            ErrorHandling(error);
        } finally {
            setLoading(false);
        }
    };

    const onWilayaChange = async (wilayaId) => {
        form.setFieldsValue({ commune_id: null });
        if (wilayaId) {
            try {
                const data = await communesService.getByWilaya(wilayaId);
                setCommunes(data);
            } catch (error) {
                ErrorHandling(error);
            }
        } else {
            setCommunes([]);
        }

    }
    const onCommuneChange = (communeId) => {
        form.setFieldsValue({ commune_id: communeId });
    }

    const onFinish = async (values) => {
        if (!user.etablissement_id) return;
        setSubmitting(true);
        try {
            await etablissementsService.update(user.etablissement_id, values);
            message.success(translate('etablissement_updated_successfully'));
        } catch (error) {
            ErrorHandling(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || !user.etablissement_id) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                {translate('no_etablissement_assigned')}
            </div>
        )
    }

    return (
        <div className="etablissement-info-container" style={{ padding: 24 }}>
            <Card title={translate("etablissement_info")} loading={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ state: 'open' }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "24px",
                        }}
                    >
                        <Form.Item
                            name="designation_ar"
                            label={translate("designation_ar")}
                            rules={[{ required: true, message: translate("required") }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="designation_fr"
                            label={translate("designation_fr")}
                            rules={[{ required: true, message: translate("required") }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="wilaya_id"
                            label={translate("wilaya")}
                            rules={[{ required: true, message: translate("required") }]}
                        >
                            <Select
                                showSearch
                                optionFilterProp="children"
                                value={form.getFieldValue("wilaya_id")}
                                onChange={onWilayaChange}
                                clearable
                            >
                                {wilayas.map((w) => (
                                    <Option key={w.value} value={w.value}>
                                        {w.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="commune_id"
                            label={translate("commune")}
                            rules={[{ required: true, message: translate("required") }]}
                        >
                            <Select
                                onChange={onCommuneChange}
                                value={form.getFieldValue("commune_id")}
                                showSearch optionFilterProp="children"
                                clearable>
                                {communes.map((c) => (
                                    <Option key={c.value} value={c.value}>
                                        {c.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="adress"
                            label={translate("adress")}
                        >
                            <Input.TextArea rows={2} />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={translate("email")}
                            rules={[{ type: 'email', message: translate("invalid_email") }]}
                        >
                            <Input />
                        </Form.Item>
                    </div>

                    <Divider orientation="left">{translate("payment_settings")}</Divider>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "24px",
                        }}
                    >

                        <Form.Item
                            name="year"
                            label={translate("year")}
                            rules={[{ required: true }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={2000} max={2100} />
                        </Form.Item>

                        <Form.Item
                            name="state"
                            label={translate("state")}
                            rules={[{ required: true }]}
                        >
                            <Select>
                                <Option value="open">{translate("open")}</Option>
                                <Option value="close">{translate("close")}</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                            {translate("update")}
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default EtablissementInfo;
