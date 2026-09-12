import React from 'react';
import { Card, Result, Button, Typography, Space, Steps, Divider } from 'antd';
import { HourglassOutlined, LogoutOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../locale/LanguageContext';
import { useStateContext } from '../contexts/ContextProvider';
import axiosClient from '../../axios-client';

const { Title, Paragraph, Text } = Typography;

const WaitingPage = () => {
    const { translate } = useLanguage();
    const navigate = useNavigate();
    const { user, setToken, setUser } = useStateContext();

    const onLogout = ev => {
        ev.preventDefault();
        axiosClient.post('/logout')
            .then(() => {
                setUser({});
                setToken(null);
            });
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: "100%",
            background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)'
        }}>
            <Card
                className="waiting-card"
                bordered={false}
                style={{
                    maxWidth: 700,
                    width: '100%',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    textAlign: 'center',



                }}
            >
                <Result
                    icon={<HourglassOutlined style={{ color: '#faad14', fontSize: '64px' }} />}
                    title={
                        <Title level={2} style={{ color: '#1a3353' }}>
                            {translate('account_pending_approval')}
                        </Title>
                    }
                    subTitle={
                        <Space direction="vertical" size="middle">
                            <Paragraph style={{ fontSize: '17px', color: '#4a5568' }}>
                                {translate('waiting_approval_msg', { name: user?.nom_fr || user?.prenom_fr || '' })}
                            </Paragraph>
                            {/* <Paragraph style={{ color: '#718096' }}>
                                {translate('approval_notification_desc')}
                            </Paragraph> */}
                        </Space>
                    }
                />

                <div style={{ padding: '10px 40px', textAlign: 'left' }}>
                    <Steps
                        direction="vertical"
                        size="small"
                        current={1}
                        items={[
                            {
                                title: translate('registration_submitted'),
                                description: translate('registration_done_desc'),
                                status: 'finish',
                            },
                            {
                                title: translate('under_review'),
                                description: translate('review_desc'),
                                status: 'process',
                            },
                            {
                                title: translate('access_granted'),
                                description: translate('access_desc'),
                                status: 'wait',
                            },
                        ]}
                    />
                </div>

                <Divider style={{ margin: '24px 0' }} />

                <Space size="large">
                    <Button
                        icon={<SyncOutlined />}
                        onClick={handleRefresh}
                        size="large"
                        style={{ borderRadius: '12px' }}
                    >
                        {translate('refresh')}
                    </Button>
                    <Button
                        danger
                        icon={<LogoutOutlined />}
                        onClick={onLogout}
                        size="large"
                        style={{ borderRadius: '12px' }}
                    >
                        {translate('logout')}
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default WaitingPage;
