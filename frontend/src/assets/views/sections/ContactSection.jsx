import React from 'react';
import { Button, Card, Col, Form, Input, Row, Typography, message } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ContactSection = ({ translate, isRTL, onInquire, onDonate }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Form values:', values);
    message.success(translate('message_sent') || 'تم إرسال رسالتك بنجاح!');
    form.resetFields();
  };

  const contactInfo = [
    {
      icon: <MailOutlined style={{ fontSize: '24px', color: '#2c5282' }} />,
      title: 'البريد الإلكتروني',
      value: 'info@socialservices.com'
    },
    {
      icon: <PhoneOutlined style={{ fontSize: '24px', color: '#2c5282' }} />,
      title: 'هاتف',
      value: '+123 456 7890'
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: '24px', color: '#2c5282' }} />,
      title: 'العنوان',
      value: 'شارع الخدمات الاجتماعية، الرياض، المملكة العربية السعودية'
    }
  ];

  return (
    <section id="contact" className="contact-section" style={{ 
      padding: '80px 0',
      backgroundColor: '#fff',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ color: '#2c5282', marginBottom: '16px' }}>
            {translate('contact_us') || 'اتصل بنا'}
          </Title>
          <Text style={{ fontSize: '16px', color: '#4a5568', display: 'block' }}>
            {translate('contact_description') || 'نحن هنا للإجابة على استفساراتك وتلقي ملاحظاتك'}
          </Text>
        </div>

        <Row gutter={[48, 48]}>
          <Col xs={24} md={12}>
            <Card 
              style={{ 
                height: '100%',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Title level={3} style={{ color: '#2c5282', marginBottom: '24px' }}>
                {translate('send_us_message') || 'أرسل لنا رسالة'}
              </Title>
              
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: translate('name_required') || 'الرجاء إدخال الاسم' }]}
                      label={translate('name') || 'الاسم'}
                    >
                      <Input placeholder={translate('enter_name') || 'أدخل اسمك'} size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: translate('email_required') || 'الرجاء إدخال البريد الإلكتروني' },
                        { type: 'email', message: translate('invalid_email') || 'بريد إلكتروني غير صالح' }
                      ]}
                      label={translate('email') || 'البريد الإلكتروني'}
                    >
                      <Input placeholder="example@domain.com" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="subject"
                  label={translate('subject') || 'الموضوع'}
                  rules={[{ required: true, message: translate('subject_required') || 'الرجاء إدخال الموضوع' }]}
                >
                  <Input placeholder={translate('subject_placeholder') || 'عنوان الرسالة'} size="large" />
                </Form.Item>
                
                <Form.Item
                  name="message"
                  label={translate('message') || 'الرسالة'}
                  rules={[{ required: true, message: translate('message_required') || 'الرجاء إدخال الرسالة' }]}
                >
                  <TextArea 
                    rows={6} 
                    placeholder={translate('message_placeholder') || 'اكتب رسالتك هنا...'}
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
                
                <div style={{ textAlign: 'left' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large"
                    icon={<SendOutlined />}
                    style={{ minWidth: '200px' }}
                  >
                    {translate('send_message') || 'إرسال الرسالة'}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={3} style={{ color: '#2c5282', marginBottom: '24px' }}>
                {translate('contact_info') || 'معلومات التواصل'}
              </Title>
              <Text style={{ fontSize: '16px', color: '#4a5568', display: 'block', marginBottom: '24px' }}>
                {translate('contact_info_description') || 'يسعدنا تواصلكم معنا عبر القنوات التالية:'}
              </Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {contactInfo.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ebf8ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: '4px' }}>{item.title}</Text>
                      <Text style={{ color: '#4a5568' }}>{item.value}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <Title level={4} style={{ color: '#2c5282', marginBottom: '16px' }}>
                {translate('support_us') || 'ادعمنا'}
              </Title>
              <Text style={{ display: 'block', marginBottom: '16px', color: '#4a5568' }}>
                {translate('support_description') || 'يمكنك دعم أنشطتنا وبرامجنا من خلال التبرع'}
              </Text>
              <Button 
                type="primary" 
                size="large" 
                onClick={onDonate}
                style={{ backgroundColor: '#38a169', borderColor: '#38a169' }}
              >
                {translate('donate_now') || 'تبرع الآن'}
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default ContactSection;
