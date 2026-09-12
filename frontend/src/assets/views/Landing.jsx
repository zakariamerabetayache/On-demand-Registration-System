import React, { useEffect, useState } from 'react';
import { Typography, Button, Card, Row, Col, ConfigProvider } from 'antd';
import {
  TeamOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  UserOutlined,
  GlobalOutlined,
  FlagOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useLanguage } from "../locale/LanguageContext";
import { useNavigate } from 'react-router-dom';
import PrencipalLogo from "../img/prencipalLogo.png";
import etablissementsService from '../services/etablissementsService';

const { Title, Text, Paragraph } = Typography;

const Landing = () => {
  const { translate, isRTL, currentLanguage, changeLanguage } = useLanguage();
  const navigate = useNavigate();

  const [etablissement, setEtablissement] = useState(null);
  const [loading, setLoading] = useState(true);

  const getEtablissement = async () => {
    try {
      const response = await etablissementsService.getAll();
      const first = response?.data?.[0] || null;
      setEtablissement(first);
      if (first) localStorage.setItem('etablissement', JSON.stringify(first));
    } catch (error) {
      console.error('Landing: could not load etablissement', error);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('etablissement');
    if (cached) setLoading(false); // show UI immediately from cache
    getEtablissement();            // always refresh in background
  }, []);

  const handleGetStarted = (mode) => {
    const currentAppmode = localStorage.getItem("appmode");
    if (currentAppmode !== mode.toString()) {
      localStorage.setItem("appmode", mode);
    }
    navigate("/mainlayout");
  };

  const handleJoinParty = () => {
    navigate("/party-signup");
  };

  const cardData = [
    {
      key: 0,
      title: translate('general_data') || 'General Data',
      subtitle: translate('administration') || 'Administration',
      icon: <GlobalOutlined style={{ fontSize: 32 }} />,
      color: '#0284c7',
      bgColor: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(2, 132, 199, 0.1) 100%)',
      description: translate('admin_card_desc') || 'Manage national data, establishments, and system users'
    },
    {
      key: 1,
      title: translate('party_management') || 'Party Management',
      subtitle: translate('national_wilaya_admin') || 'National & Wilaya Admin',
      icon: <TeamOutlined style={{ fontSize: 32 }} />,
      color: '#1F6F3A',
      bgColor: 'linear-gradient(135deg, rgba(31, 111, 58, 0.05) 0%, rgba(31, 111, 58, 0.1) 100%)',
      description: translate('party_admin_desc') || 'Approve new members and manage party operations'
    },
    {
      key: 2,
      title: translate('member_portal') || 'Member Portal',
      subtitle: translate('party_members') || 'Party Members',
      icon: <FlagOutlined style={{ fontSize: 32 }} />,
      color: '#C81D18',
      bgColor: 'linear-gradient(135deg, rgba(200, 29, 24, 0.05) 0%, rgba(200, 29, 24, 0.1) 100%)',
      description: translate('member_portal_desc') || 'Access your member dashboard and invite others'
    }
  ];

  const features = [
    { icon: <CheckCircleOutlined />, text: translate('secure_registration') || 'Secure Registration' },
    { icon: <SafetyCertificateOutlined />, text: translate('verified_members') || 'Verified Members' },
    { icon: <TeamOutlined />, text: translate('strong_community') || 'Strong Community' }
  ];

  if (loading || !etablissement) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #ffffff 0%, #cfe9ff 50%, #87c9ff 100%)',
        overflow: 'hidden'
      }}>
        <style>{`
          @keyframes spin-ring {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '32px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#fca5a5',
            borderRightColor: '#C81D18',
            animation: 'spin-ring 1s linear infinite'
          }} />
          <div style={{
            position: 'absolute', inset: '8px', borderRadius: '50%',
            background: 'rgba(200,29,24,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={PrencipalLogo} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontFamily: "'Cairo', sans-serif",
          fontSize: '16px',
          animation: 'fade-in-up 0.6s ease forwards',
          margin: 0
        }}>
          {translate('loading') || 'جاري التحميل...'}
        </p>
      </div>
    );
  }

  const primaryColor = etablissement?.primary_color || '#0284c7';
  const appName =
    etablissement?.app_name ||
    translate('party_name') || 'Registration Platform';

  const heroTitle =
    etablissement?.hero_title ||
    translate('welcome_to_party') || 'Welcome to your Registration Platform';

  const heroDescription =
    etablissement?.hero_description ||
    translate('party_hero_description') || 'Manage your registrations, collect data, and organize users easily and professionally from one place.';
  const logoUrl = etablissement?.logo
    ? `${import.meta.env.VITE_API_BASE_URL}/storage/${etablissement.logo}`
    : PrencipalLogo;
  const primary_color = etablissement?.primary_color || '#0284c7';


  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: primaryColor,
        },
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          direction: isRTL ? 'rtl' : 'ltr',
          background: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 50%, #ffffff 100%)',
          color: '#1F2937'
        }}
      >
        {/* Modern Header with Glass Effect */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(2, 132, 199, 0.1)',
          padding: '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  height: '50px',
                  width: '50px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
              <Title level={3} style={{ margin: 0, color: primaryColor, fontWeight: 700 }}>
                {appName}
              </Title>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Button
                type="text"
                onClick={() => changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
                style={{
                  color: primaryColor,
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: `1px solid rgba(2, 132, 199, 0.1)`,
                  borderRadius: '8px',
                  padding: '4px 12px',
                  height: 'auto'
                }}
              >
                <GlobalOutlined />
                {currentLanguage === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>
          </div>
        </header>

        {/* Modern Hero Section */}
        <section style={{
          padding: '30px 2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-150px',
            right: '-150px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(31, 111, 58, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)'
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
            {/* Logo Showcase */}
            <div style={{
              display: 'inline-block',
              marginBottom: '32px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(2, 132, 199, 0.15)',
              border: '2px solid rgba(2, 132, 199, 0.1)'
            }}>
              <img
                src={logoUrl}
                alt="Party Logo"
                style={{
                  height: '140px',
                  width: '140px',
                  objectFit: 'contain',
                  borderRadius: '16px'
                }}
              />
            </div>

            <Title
              level={1}
              style={{
                color: primaryColor,
                marginBottom: '24px',
                fontSize: '52px',
                fontWeight: 800,
                lineHeight: '1.2',
                textShadow: '0 2px 10px rgba(2, 132, 199, 0.1)'
              }}
            >
              {heroTitle}
            </Title>

            <Paragraph style={{
              fontSize: '20px',
              color: '#6B7280',
              marginBottom: '40px',
              lineHeight: '1.8',
              maxWidth: '700px',
              margin: '0 auto 40px'
            }}>
              {heroDescription}
            </Paragraph>

            {/* Feature Pills */}
            {/* <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '40px'
            }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50px',
                    border: '1px solid rgba(127, 9, 7, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    fontSize: '15px',
                    color: '#374151',
                    fontWeight: 500
                  }}
                >
                  <span style={{ color: '#1F6F3A', fontSize: '18px' }}>{feature.icon}</span>
                  {feature.text}
                </div>
              ))}
            </div> */}

            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={handleJoinParty}
              style={{
                height: '60px',
                fontSize: '18px',
                padding: '0 48px',
                borderRadius: '12px',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${primary_color} 0%, ${primary_color} 100%)`,
                border: 'none',
                boxShadow: `0 8px 24px ${primary_color} 0.3`,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 32px ${primary_color} 0.4`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${primary_color} 0.3`;
              }}
            >
              {translate('join_now') || 'انضم الآن'}
            </Button>
          </div>
        </section>

        {/* Modern Services/Cards Section */}
        <section id="services" style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2} style={{
              fontSize: '42px',
              fontWeight: 700,
              color: '#1F2937',
              marginBottom: '16px'
            }}>
              {translate('portals') || 'البوابات'}
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#6B7280' }}>
              {translate('choose_portal_desc') || 'اختر البوابة المناسبة للوصول إلى خدماتك'}
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {cardData.map(card => (
              <Col key={card.key} xs={24} md={8}>
                <Card
                  hoverable
                  onClick={() => handleGetStarted(card.key)}
                  style={{
                    height: '100%',
                    borderRadius: '24px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  {/* Color accent bar */}
                  <div style={{
                    height: '6px',
                    background: card.color,
                    marginBottom: '24px'
                  }} />

                  <div
                    style={{
                      width: 80,
                      height: 80,
                      background: card.bgColor,
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                      marginBottom: 24,
                      boxShadow: `0 8px 24px ${card.color}20`
                    }}
                  >
                    {card.icon}
                  </div>

                  <Text style={{
                    color: card.color,
                    fontWeight: 600,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {card.subtitle}
                  </Text>

                  <Title level={3} style={{
                    marginTop: '12px',
                    marginBottom: '16px',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1F2937'
                  }}>
                    {card.title}
                  </Title>

                  <Paragraph style={{
                    color: '#6B7280',
                    marginBottom: 24,
                    lineHeight: '1.7',
                    fontSize: '15px'
                  }}>
                    {card.description}
                  </Paragraph>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    color: card.color,
                    fontSize: '15px'
                  }}>
                    {translate('get_started') || 'ابدأ الآن'}
                    <RightOutlined style={{ fontSize: '12px' }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Modern Footer */}
        <footer style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #014c73 100%)`, // Adjusted to use primaryColor base
          color: '#fff',

          marginTop: '80px',
          borderTop: `4px solid ${primaryColor}`
        }}>

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            padding: '2rem 2rem',
          }}>
            © {new Date().getFullYear()} {translate('all_rights_reserved') || 'جميع الحقوق محفوظة'}
          </div>
        </footer>
      </div >
    </ConfigProvider >
  );
};

export default Landing;
