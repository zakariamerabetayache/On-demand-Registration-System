import React from 'react';
import { Card, Avatar, Typography, Space, Divider } from 'antd';
import { useLanguage } from '../../locale/LanguageContext';
import {
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  EllipsisOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import './PostCard.css';

const { Title, Text, Paragraph } = Typography;

const PostCard = ({ post }) => {
  const { currentLanguage } = useLanguage();

  // Set moment locale
  moment.locale(currentLanguage === 'ar' ? 'ar' : 'fr');

  const creator = post.user || {
    nom_fr: 'System',
    prenom_fr: 'Administrator',
    nom_ar: 'النظام',
    prenom_ar: 'مدير'
  };

  const displayName = currentLanguage === 'ar'
    ? `${creator.prenom_ar} ${creator.nom_ar}`
    : `${creator.prenom_fr} ${creator.nom_fr}`;

  const initials = currentLanguage === 'ar'
    ? `${creator.prenom_ar?.[0] || ''}${creator.nom_ar?.[0] || ''}`
    : `${creator.prenom_fr?.[0] || 'A'}${creator.nom_fr?.[0] || 'S'}`;

  return (
    <Card
      className="post-card"
      bordered={false}

    >
      <div className="post-card-header">
        <Space align="center" size="middle">
          <Avatar
            size={48}
            className="post-avatar"
            style={{ backgroundColor: '#1890ff' }}
          >
            {initials.toUpperCase()}
          </Avatar>
          <div >
            <Title level={5} className="post-creator-name" >
              {displayName}
            </Title>
            <p type="secondary" style={{ marginTop: "-12px", color: '#8c8c8c' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {moment().diff(moment(post.created_at), 'hours') >= 24
                ? moment(post.created_at).format('LL')
                : moment(post.created_at).fromNow()}
            </p>
          </div>
        </Space>
      </div>

      <div className="post-card-body">
        <Title level={4} className="post-main-title">{post.title}</Title>
        <Paragraph
          className="post-description"
          ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
        >
          {post.description}
        </Paragraph>
      </div>

      {post.image && (
        <div className="post-image-wrapper">
          <img
            alt={post.title}
            src={`${import.meta.env.VITE_API_BASE_URL}/storage/${post.image}`}
            className="post-image"
          />
        </div>
      )}
    </Card>
  );
};

export default PostCard;
