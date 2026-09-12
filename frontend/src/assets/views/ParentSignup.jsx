import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Upload, 
  Card, 
  Row, 
  Col, 
  message,
  Steps,
  Radio
} from 'antd';
import dayjs from 'dayjs';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  PhoneOutlined,
  HomeOutlined,
  UploadOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../axios-client';
import './ParentSignup.css';

import ErrorHandling from '../components/ErrorHandling';
import wilayasService from '../services/wilayasService';
import communesService from '../services/communesService';
import { useLanguage } from '../locale/LanguageContext';
import { useStateContext } from '../contexts/ContextProvider';

const { Option } = Select;
const { Step } = Steps;

const ParentSignup = () => {
  const { translate } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [communesRes, setCommunesRes] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [selfPhotoList, setSelfPhotoList] = useState([]);
  const [ninError, setNinError] = useState(false);
  const [ninErrorMessage, setNinErrorMessage] = useState('');
  const [ninEnabled, setNinEnabled] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken } = useStateContext();

  useEffect(() => {
    fetchWilayas();
  }, []);

  const fetchWilayas = async () => {
    try {
      const response = await wilayasService.getAllForDropdown();
      setWilayas(response);
    } catch (error) {
      ErrorHandling(error); 
      message.error(translate('failed_to_load_wilayas') || 'Failed to load wilayas');
    }
  };




 

  const fetchCommunes = async (wilayaId, isResidence = false) => {
    try {
      const response = await communesService.getAllForDropdown(wilayaId);

      if (isResidence) {

        setCommunesRes(response);
      } else {
        setCommunes(response);
      }
    } catch (error) {
      ErrorHandling(error);
      message.error(translate('failed_to_load_communes') || 'Failed to load communes');
    }
  };

  // NIN Validation function - same as Citoyensignup
  const validateNin = (formValues) => {
    const { nin, sex, date_nais, nb_crt } = formValues;
    
    if (!nin || nin.length < 18) {
      setNinError(false);
      setNinErrorMessage('');
      return true; // Don't validate incomplete NIN
    }

    let isError = false;

    // Validate sex
    if (sex !== undefined && nin.length >= 2) {
      console.log("nin 1 " + nin[1]);
      console.log("sex " + sex);

      if (nin[1] !== sex.toString()) {
        console.log("error sex");
        isError = true;
      }
    }

    // Validate certificate number (nb_crt)
    console.log("cnais " + nb_crt);
    console.log("nin cn " + nin.slice(9, 14));
    if (nb_crt && nin.length >= 14) {
      if (parseInt(nin.slice(9, 14), 10) != nb_crt) {
        console.log("error cnais");
        isError = true;
      }
    }

    // Validate birth date - date_nais is now always a string
    if (date_nais && nin.length >= 5) {
      // Extract last 2 digits of year (e.g., '03' from '2003-05-15')
      const birthYear = date_nais.slice(1, 4);
      const ninYear = nin.slice(2, 5); // Get positions 2-3 from NIN
      console.log("birth year (last 2 digits): " + birthYear);
      console.log("nin year: " + ninYear);
      if (birthYear !== ninYear) {
        console.log("error date_nais");
        isError = true;
      }
    }

    setNinError(isError);
    setNinErrorMessage(isError ? translate('nin_incorrect') || 'NIN is incorrect' : '');
    return !isError;
  };

  // Watch form values for NIN validation and enable/disable NIN field
  const handleFormValuesChange = (changedValues, allValues) => {
    // Check if all required fields for NIN are filled
    const { sex, date_nais, nb_crt } = allValues;
    const shouldEnableNin = sex !== undefined && date_nais && nb_crt;
    setNinEnabled(shouldEnableNin);

    // Only validate if NIN or related fields changed
    if (changedValues.nin || changedValues.sex || changedValues.date_nais || changedValues.nb_crt) {
      setTimeout(() => validateNin(allValues), 100); // Small delay to ensure form is updated
    }
  };

  const handleWilayaChange = (wilayaId, isResidence = false) => {
    fetchCommunes(wilayaId, isResidence);
    if (isResidence) {
      form.setFieldsValue({ commune_res_id: undefined });
    } else {
      form.setFieldsValue({ commune_id: undefined });
    }
  };

  const handleUpload = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleSelfPhotoUpload = ({ fileList }) => {
    setSelfPhotoList(fileList);
  };

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      console.log('=== FORM SUBMISSION START ===');
      console.log('Form values received:', values);
      console.log('Number of fields received:', Object.keys(values).length);
      console.log('All form fields from form instance:', form.getFieldsValue(true));
      
      // Use form instance values as backup
      const allFormValues = { ...form.getFieldsValue(true), ...values };
      console.log('Combined form values:', allFormValues);
      
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(allFormValues).forEach(key => {
        if (allFormValues[key] !== undefined && allFormValues[key] !== null && allFormValues[key] !== '') {
          let value = allFormValues[key];
          
          formData.append(key, value);
          console.log(`Added ${key}:`, value);
        } else {
          console.log(`Skipped ${key}: value is`, allFormValues[key]);
        }
      });

      // Add role_id for parent
   

      // Add identity image if uploaded
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('identity_image', fileList[0].originFileObj);
        console.log('Added identity_image:', fileList[0].name);
      }

      // Add self photo if uploaded
      if (selfPhotoList.length > 0 && selfPhotoList[0].originFileObj) {
        formData.append('self_photo', selfPhotoList[0].originFileObj);
        console.log('Added self_photo:', selfPhotoList[0].name);
      }
      
      // Log all FormData entries for debugging
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await axiosClient.post('/parents/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(response.data.user);
      setToken(response.data.token);
      message.success(translate('registration_successful') || 'Registration successful! Welcome to our childcare center.');
      
      // Redirect to parent layout or login
      navigate('/parent-layout');
      
    } catch (error) {
      console.error('Registration error:', error);
      ErrorHandling(error);
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    // Define fields for each step
    const stepFields = [
      ['nom_ar', 'nom_fr', 'prenom_ar', 'prenom_fr', 'date_nais', 'sex', 'nb_crt', 'nin'], // Step 0: Personal Info + NIN
      ['telephone', 'email'], // Step 1: Contact
      ['adress', 'wilaya_id', 'commune_id', 'wilaya_res_id', 'commune_res_id'], // Step 2: Address
      ['password', 'password_confirmation'] // Step 3: Account Setup
    ];

    const currentStepFields = stepFields[currentStep] || [];
    
    form.validateFields(currentStepFields).then(() => {
      const formValues = form.getFieldsValue();
      console.log(`Step ${currentStep} validation passed. Current form values:`, formValues);
      
      // Additional NIN validation for step 0 (Personal Info + NIN)
      if (currentStep === 0) {
        if (!validateNin(formValues)) {
          message.error(translate('correct_nin_errors') || 'Please correct NIN validation errors before proceeding');
          return;
        }
      }
      
      setCurrentStep(currentStep + 1);
    }).catch((errorInfo) => {
      console.log('Validation failed for step', currentStep, errorInfo);
      message.error(translate('fill_required_fields') || 'Please fill all required fields in this step');
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: translate('personal_information_identity') || 'Personal Information & Identity',
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nom_ar"
              label={translate('last_name_arabic') || 'Last Name (Arabic)'}
              rules={[{ required: true, message: translate('please_enter_last_name_arabic') || 'Please enter your last name in Arabic' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="الاسم العائلي" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nom_fr"
              label={translate('last_name_french') || 'Last Name (French)'}
              rules={[{ required: true, message: translate('please_enter_last_name_french') || 'Please enter your last name in French' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nom de famille" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="prenom_ar"
              label={translate('first_name_arabic') || 'First Name (Arabic)'}
              rules={[{ required: true, message: translate('please_enter_first_name_arabic') || 'Please enter your first name in Arabic' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="الاسم الشخصي" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="prenom_fr"
              label={translate('first_name_french') || 'First Name (French)'}
              rules={[{ required: true, message: translate('please_enter_first_name_french') || 'Please enter your first name in French' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Prénom" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_nais"
              label={translate('date_of_birth') || 'Date of Birth'}
              rules={[{ required: true, message: translate('please_select_date_of_birth') || 'Please select your date of birth' }]}
            >
              <Input 
                type="date"
                style={{ width: '100%' }}
                placeholder={translate('select_date_of_birth') || 'Select date of birth'}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="sex"
              label={translate('gender') || 'Gender'}
              rules={[{ required: true, message: translate('please_select_gender') || 'Please select your gender' }]}
            >
              <Select placeholder={translate('select_gender') || 'Select Gender'}>
                <Option value={0}>{translate('male') || 'Male'}</Option>
                <Option value={1}>{translate('female') || 'Female'}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <div style={{ 
              background: '#f0f2f5', 
              padding: '16px', 
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>
                {translate('national_identity_information') || 'National Identity Information'}
              </h4>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="nb_crt"
                    label={translate('certificate_number') || 'Certificate Number'}
                    rules={[{ required: true, message: translate('please_enter_certificate_number') || 'Please enter your certificate number' }]}
                    help={translate('required_to_enable_nin') || 'Required to enable NIN field'}
                  >
                    <Input placeholder={translate('certificate_5_digits') || 'Certificate Number (5 digits)'} maxLength={5} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="nin"
                    label={translate('national_id_number') || 'National ID Number (NIN)'}
                    rules={[
                      { required: true, message: translate('please_enter_national_id') || 'Please enter your national ID number' },
                      { len: 18, message: translate('national_id_18_digits') || 'National ID Number must be exactly 18 digits' },
                      { pattern: /^[0-9]+$/, message: translate('national_id_digits_only') || 'National ID Number must contain only digits' }
                    ]}
                    validateStatus={ninError ? 'error' : ''}
                    help={ninError ? ninErrorMessage : translate('fill_gender_birth_certificate_first') || 'Fill gender, birth date, and certificate number first'}
                  >
                    <Input 
                      prefix={<IdcardOutlined />} 
                      placeholder={translate('national_id_18_digits_placeholder') || 'National ID Number (18 digits)'} 
                      maxLength={18}
                      disabled={!ninEnabled}
                      style={{ 
                        backgroundColor: !ninEnabled ? '#f5f5f5' : 'white',
                        cursor: !ninEnabled ? 'not-allowed' : 'text'
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      ),
    },
    {
      title: translate('contact_information') || 'Contact Information',
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="telephone"
              label={translate('phone_number') || 'Phone Number'}
              rules={[{ required: true, message: translate('please_enter_phone_number') || 'Please enter your phone number' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder={translate('phone_number') || 'Phone Number'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label={translate('email_address') || 'Email'}
              rules={[
                { required: true, message: translate('please_enter_email') || 'Please enter your email' },
                { type: 'email', message: translate('please_enter_valid_email') || 'Please enter a valid email' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder={translate('email_address') || 'Email Address'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="identity_image"
              label={translate('identity_document') || 'Identity Document'}
            >
              <Upload
                listType="picture"
                fileList={fileList}
                onChange={handleUpload}
                beforeUpload={() => false}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>{translate('upload_identity_document') || 'Upload Identity Document'}</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="self_photo"
              label={translate('personal_photo') || 'Personal Photo'}
            >
              <Upload
                listType="picture"
                fileList={selfPhotoList}
                onChange={handleSelfPhotoUpload}
                beforeUpload={() => false}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>{translate('upload_personal_photo') || 'Upload Personal Photo'}</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: translate('address_information') || 'Address Information',
      content: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="adress"
              label={translate('address') || 'Address'}
              rules={[{ required: true, message: translate('please_enter_address') || 'Please enter your address' }]}
            >
              <Input.TextArea prefix={<HomeOutlined />} placeholder={translate('full_address') || 'Full Address'} rows={3} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="wilaya_id"
              label={translate('birth_wilaya') || 'Birth Wilaya'}
              rules={[{ required: true, message: translate('please_select_birth_wilaya') || 'Please select your birth wilaya' }]}
            >
              <Select
                placeholder={translate('select_birth_wilaya') || 'Select Birth Wilaya'}
                onChange={(value) => handleWilayaChange(value, false)}
                showSearch
                optionFilterProp="children"
                options={wilayas}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="commune_id"
              label={translate('birth_commune') || 'Birth Commune'}
              rules={[{ required: true, message: translate('please_select_birth_commune') || 'Please select your birth commune' }]}
            >
              <Select
                placeholder={translate('select_birth_commune') || 'Select Birth Commune'}
                showSearch
                optionFilterProp="children"
                options={communes}

              />
               
            
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="wilaya_res_id"
              label={translate('residence_wilaya') || 'Residence Wilaya'}
              rules={[{ required: true, message: translate('please_select_residence_wilaya') || 'Please select your residence wilaya' }]}
            >
              <Select
                placeholder={translate('select_residence_wilaya') || 'Select Residence Wilaya'}
                onChange={(value) => handleWilayaChange(value, true)}
                showSearch
                optionFilterProp="children"
                options={wilayas}
              />
            </Form.Item>
          </Col>
          <Col span={12}>   
            <Form.Item
              name="commune_res_id"
              label={translate('residence_commune') || 'Residence Commune'}
              rules={[{ required: true, message: translate('please_select_residence_commune') || 'Please select your residence commune' }]}
            >
              <Select
                placeholder={translate('select_residence_commune') || 'Select Residence Commune'}
                showSearch
                optionFilterProp="children"
                options={communesRes}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: translate('account_setup') || 'Account Setup',
      content: (
        <Row gutter={16}>
         
          <Col span={12}>
            <Form.Item
              name="password"
              label={translate('password') || 'Password'}
              rules={[
                { required: true, message: translate('please_enter_password') || 'Please enter a password' },
                { min: 6, message: translate('password_min_6_characters') || 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={translate('password') || 'Password'} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="password_confirmation"
              label={translate('confirm_password') || 'Confirm Password'}
              rules={[
                { required: true, message: translate('please_confirm_password') || 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(translate('passwords_do_not_match') || 'Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={translate('confirm_password') || 'Confirm Password'} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="parent-signup-container">
      <Card className="signup-card">
        <div className="signup-header">
          <h1>{translate('parent_registration') || 'Parent Registration'}</h1>
          <p>{translate('join_childcare_community') || 'Join our childcare center community'}</p>
        </div>

        <Steps current={currentStep} className="signup-steps">
          {steps?.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={handleFormValuesChange}
          size="large"
          className="parent-signup-form"
        >
          <div className="steps-content">
            {steps[currentStep].content}
          </div>

          <div className="steps-action">
            {currentStep > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={prev}>
                {translate('previous') || 'Previous'}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                {translate('next') || 'Next'}
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" htmlType="submit" loading={loading}>
                {translate('complete_registration') || 'Complete Registration'}
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ParentSignup;
