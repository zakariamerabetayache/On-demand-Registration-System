import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { TeamOutlined, HeartOutlined, SafetyOutlined, BookOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const ServicesSection = ({ translate, isRTL }) => {
  const services = [
    {
      icon: <TeamOutlined style={{ fontSize: '36px', color: '#2c5282' }} />,
      title: translate('family_support') || 'دعم الأسرة',
      description: translate('family_support_desc') || 'برامج دعم الأسرة والاستشارات الأسرية.'
    },
    {
      icon: <HeartOutlined style={{ fontSize: '36px', color: '#2c5282' }} />,
      title: translate('child_welfare') || 'رعاية الأطفال',
      description: translate('child_welfare_desc') || 'حماية ورعاية الأطفال المحتاجين.'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '36px', color: '#2c5282' }} />,
      title: translate('elderly_care') || 'رعاية المسنين',
      description: translate('elderly_care_desc') || 'خدمات متكاملة لكبار السن.'
    },
    {
      icon: <BookOutlined style={{ fontSize: '36px', color: '#2c5282' }} />,
      title: translate('education') || 'البرامج التعليمية',
      description: translate('education_desc') || 'برامج تعليمية وتدريبية متنوعة.'
    }
  ];

  return (
    <section id="services" className="services-section" style={{ 
      padding: '80px 0',
      backgroundColor: '#f8fafc',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ color: '#2c5282', marginBottom: '16px' }}>
            {translate('our_services') || 'خدماتنا'}
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#4a5568' }}>
            {translate('services_description') || 'نقدم مجموعة متكاملة من الخدمات الاجتماعية لدعم المجتمع'}
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          {services.map((service, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card 
                hoverable 
                style={{ 
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <div style={{ marginBottom: '16px' }}>{service.icon}</div>
                <Title level={4} style={{ marginBottom: '12px' }}>{service.title}</Title>
                <Paragraph style={{ color: '#718096' }}>{service.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default ServicesSection;
