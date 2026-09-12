import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { 
  UserOutlined, 
  HomeOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  BookOutlined,
  HeartOutlined 
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useStateContext();

  const getWelcomeMessage = () => {
    switch (user.role_id) {
      case 'admin':
        return 'Welcome to Childcare Center Management System';
      case 'manager':
        return `Welcome back, ${user.prenom_fr || user.prenom_ar}! Manage your childcare center efficiently.`;
      case 'parent':
        return `Hello ${user.prenom_fr || user.prenom_ar}! Check your child's activities and progress.`;
      case 'associate':
        return `Welcome ${user.prenom_fr || user.prenom_ar}! Ready to support our children today.`;
      default:
        return 'Welcome to Childcare Center Dashboard';
    }
  };

  const getStatsCards = () => {
    if (user.role_id === 'admin' || user.role_id === 'manager') {
      return [
        {
          title: 'Total Children',
          value: 45,
          icon: <TeamOutlined style={{ color: '#1890ff' }} />,
          color: '#1890ff'
        },
        {
          title: 'Active Staff',
          value: 12,
          icon: <UserOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a'
        },
        {
          title: 'Classrooms',
          value: 6,
          icon: <HomeOutlined style={{ color: '#faad14' }} />,
          color: '#faad14'
        },
        {
          title: 'Today\'s Activities',
          value: 8,
          icon: <CalendarOutlined style={{ color: '#f5222d' }} />,
          color: '#f5222d'
        }
      ];
    } else if (user.role_id === 'parent') {
      return [
        {
          title: 'My Children',
          value: 2,
          icon: <HeartOutlined style={{ color: '#eb2f96' }} />,
          color: '#eb2f96'
        },
        {
          title: 'Upcoming Events',
          value: 3,
          icon: <CalendarOutlined style={{ color: '#1890ff' }} />,
          color: '#1890ff'
        },
        {
          title: 'Learning Progress',
          value: '85%',
          icon: <BookOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a'
        }
      ];
    } else {
      return [
        {
          title: 'Assigned Children',
          value: 15,
          icon: <TeamOutlined style={{ color: '#1890ff' }} />,
          color: '#1890ff'
        },
        {
          title: 'Today\'s Tasks',
          value: 5,
          icon: <CalendarOutlined style={{ color: '#faad14' }} />,
          color: '#faad14'
        },
        {
          title: 'Activities Completed',
          value: 12,
          icon: <BookOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a'
        }
      ];
    }
  };

  const statsCards = getStatsCards();

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Welcome Section */}
        <Card>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            {getWelcomeMessage()}
          </Title>
          <Text type="secondary">
            Role: {user.role_id?.charAt(0).toUpperCase() + user.role_id?.slice(1)}
            {user.etablissement_id && ` | Center: ${user.etablissement?.designation_fr || 'Your Center'}`}
          </Text>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          {statsCards.map((stat, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.icon}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Actions */}
        <Card title="Quick Actions" style={{ marginTop: '24px' }}>
          <Row gutter={[16, 16]}>
            {user.role_id === 'admin' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card 
                    hoverable 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => window.location.href = '/mainLayout/users'}
                  >
                    <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div style={{ marginTop: '8px' }}>Manage Users</div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card 
                    hoverable 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => window.location.href = '/mainLayout/etablissements'}
                  >
                    <HomeOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px' }}>Manage Centers</div>
                  </Card>
                </Col>
              </>
            )}
            
            {user.role_id === 'manager' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card 
                    hoverable 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => window.location.href = '/mainLayout/users'}
                  >
                    <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div style={{ marginTop: '8px' }}>Manage Staff & Parents</div>
                  </Card>
                </Col>
              </>
            )}

            {user.role_id === 'parent' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <HeartOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />
                    <div style={{ marginTop: '8px' }}>View Children</div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <CalendarOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                    <div style={{ marginTop: '8px' }}>Schedule & Events</div>
                  </Card>
                </Col>
              </>
            )}

            {user.role_id === 'associate' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div style={{ marginTop: '8px' }}>My Assigned Children</div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <BookOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px' }}>Daily Activities</div>
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" style={{ marginTop: '24px' }}>
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            Recent activities will be displayed here based on your role and permissions.
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default Dashboard;
