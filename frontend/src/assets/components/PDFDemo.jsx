import React from 'react';
import { Card, Space, Typography, Divider } from 'antd';
import ParentalAuthorizationPDF from './ParentalAuthorizationPDF';
import CompanionAuthorizationPDF from './CompanionAuthorizationPDF';
import { useLanguage } from '../locale/LanguageContext';

const { Title, Text } = Typography;

const PDFDemo = () => {
  const { translate } = useLanguage();

  // Sample data for demonstration
  const sampleChild = {
    id: 1,
    nom_ar: "بن علي",
    nom_fr: "Ben Ali",
    prenom_ar: "أحمد",
    prenom_fr: "Ahmed",
    date_nais: "2018-05-15",
    bloodsign: "O+",
    sex: 0 // Male
  };

  const sampleCompanion = {
    id: 1,
    nom_ar: "بن محمد",
    nom_fr: "Ben Mohamed",
    prenom_ar: "فاطمة",
    prenom_fr: "Fatima"
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        {translate('childcare_management_system') || 'نظام إدارة مراكز رعاية الأطفال'}
      </Title>
      
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '32px' }}>
        {translate('pdf_authorization_demo') || 'عرض توضيحي لتوليد تصاريح PDF'}
      </Text>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Parental Authorization Demo */}
        <Card 
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                {translate('parental_authorization_document') || 'تصريح أبوي'}
              </Title>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Text style={{ marginBottom: '16px', display: 'block' }}>
            {translate('parental_authorization_description') || 
            'تصريح رسمي يخول مركز رعاية الأطفال برعاية الطفل والإشراف عليه. يجب طباعة هذا التصريح والذهاب به إلى البلدية للمصادقة عليه وختمه.'}
          </Text>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>{translate('sample_child_data') || 'بيانات الطفل النموذجية'}:</Text>
            <ul style={{ marginTop: '8px' }}>
              <li>{translate('arabic_name') || 'الاسم بالعربية'}: {sampleChild.prenom_ar} {sampleChild.nom_ar}</li>
              <li>{translate('french_name') || 'الاسم بالفرنسية'}: {sampleChild.prenom_fr} {sampleChild.nom_fr}</li>
              <li>{translate('birth_date') || 'تاريخ الميلاد'}: {sampleChild.date_nais}</li>
              <li>{translate('blood_type') || 'فصيلة الدم'}: {sampleChild.bloodsign}</li>
              <li>{translate('gender') || 'الجنس'}: {sampleChild.sex === 0 ? (translate('male') || 'ذكر') : (translate('female') || 'أنثى')}</li>
            </ul>
          </div>
          
          <ParentalAuthorizationPDF 
            child={sampleChild}
            onDownload={(filename) => {
              console.log('Downloaded:', filename);
            }}
          />
        </Card>

        <Divider />

        {/* Companion Authorization Demo */}
        <Card 
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                {translate('companion_authorization_document') || 'تصريح بالمرافق'}
              </Title>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Text style={{ marginBottom: '16px', display: 'block' }}>
            {translate('companion_authorization_description') || 
            'تصريح رسمي يخول شخصاً معيناً بمرافقة الأطفال وتمثيل الولي في مركز رعاية الأطفال. يجب طباعة هذا التصريح والذهاب به إلى البلدية للمصادقة عليه وختمه.'}
          </Text>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>{translate('sample_companion_data') || 'بيانات المرافق النموذجية'}:</Text>
            <ul style={{ marginTop: '8px' }}>
              <li>{translate('arabic_name') || 'الاسم بالعربية'}: {sampleCompanion.prenom_ar} {sampleCompanion.nom_ar}</li>
              <li>{translate('french_name') || 'الاسم بالفرنسية'}: {sampleCompanion.prenom_fr} {sampleCompanion.nom_fr}</li>
            </ul>
          </div>
          
          <CompanionAuthorizationPDF 
            companion={sampleCompanion}
            onDownload={(filename) => {
              console.log('Downloaded:', filename);
            }}
          />
        </Card>

        {/* Instructions */}
        <Card 
          title={translate('instructions') || 'التعليمات'}
          style={{ borderRadius: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
        >
          <ol style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              {translate('step_1_download') || 'قم بتحميل التصريح المطلوب بالضغط على الزر أعلاه'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              {translate('step_2_print') || 'اطبع التصريح على ورق أبيض عادي'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              {translate('step_3_commune') || 'اذهب إلى البلدية مع التصريح المطبوع ووثائق الهوية'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              {translate('step_4_approval') || 'احصل على المصادقة والختم الرسمي من البلدية'}
            </li>
            <li>
              {translate('step_5_submit') || 'سلم التصريح المصادق عليه إلى مركز رعاية الأطفال'}
            </li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default PDFDemo;
