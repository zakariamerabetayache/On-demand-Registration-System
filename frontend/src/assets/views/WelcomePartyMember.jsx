import React from 'react';
import { Card, Result, Button, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../locale/LanguageContext';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Paragraph, Text } = Typography;

const WelcomePartyMember = () => {
    const { translate } = useLanguage();
    const navigate = useNavigate();
    const { user } = useStateContext();

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <Card
                className="welcome-card"
                bordered={false}
                style={{
                    maxWidth: 800,
                    width: '100%',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    overflow: 'hidden'
                }}
            >
                <Result
                    status="success"
                    title={
                        <Title level={2} style={{ color: '#1a3353', marginBottom: 0 }}>
                            {translate('welcome_to_the_party') || 'Welcome to the Party!'}
                        </Title>
                    }
                    subTitle={
                        <Space direction="vertical" size="middle" style={{ marginTop: '16px' }}>
                            <Paragraph style={{ fontSize: '18px', color: '#4a5568' }}>
                                {translate('registration_complete_msg') || `Congratulations ${user?.nom_fr} ${user?.prenom_fr}, your registration is now complete.`}
                            </Paragraph>
                            <Paragraph style={{ fontSize: '16px', color: '#718096' }}>
                                {translate('party_member_welcome_desc') || "Thank you for joining our movement. We are honored to have you as a dedicated member. Together, we can make a difference and build a better future."}
                            </Paragraph>
                        </Space>
                    }
                // extra={[
                //     <Button
                //         type="primary"
                //         key="dashboard"
                //         size="large"
                //         icon={<HomeOutlined />}
                //         onClick={() => navigate('/')}
                //         style={{
                //             borderRadius: '12px',
                //             height: '50px',
                //             padding: '0 40px',
                //             fontSize: '16px',
                //             fontWeight: '600',
                //             background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                //             border: 'none'
                //         }}
                //     >
                //         {translate('go_to_dashboard') || 'Go to Dashboard'}
                //     </Button>
                // ]}
                />
                <div style={{ marginTop: '20px' }}>
                    <Text strong>{translate('your_personal_token') + " : " || 'الرمز الخاص : '}</Text>
                    <Tag color="blue" style={{ marginLeft: '10px', fontSize: '14px', padding: '5px 10px' }}>
                        {user?.personal_token}
                    </Tag>
                </div>

            </Card>
        </div>
    );
};

export default WelcomePartyMember;
