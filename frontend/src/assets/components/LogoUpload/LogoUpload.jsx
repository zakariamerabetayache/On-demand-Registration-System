import React, { useState } from 'react';
import { Upload, Button, message, Image, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import etablissementsService from '../../services/etablissementsService';

const LogoUpload = ({ 
  etablissementId, 
  currentLogo, 
  onLogoChange,
  disabled = false 
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpload = async (file) => {
    if (!etablissementId) {
      message.error(t('etablissement_id_required'));
      return false;
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error(t('file_must_be_image'));
      return false;
    }

    // Validate file size (2MB)
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t('image_must_smaller_than_2mb'));
      return false;
    }

    setUploading(true);
    try {
      const response = await etablissementsService.uploadLogo(etablissementId, file);
      message.success(response.message || t('logo_uploaded_successfully'));
      
      // Call the callback to update parent component
      if (onLogoChange) {
        onLogoChange(response.logo_path);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      message.error(t('logo_upload_failed'));
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleDelete = async () => {
    if (!etablissementId) {
      message.error(t('etablissement_id_required'));
      return;
    }

    setDeleting(true);
    try {
      const response = await etablissementsService.deleteLogo(etablissementId);
      message.success(response.message || t('logo_deleted_successfully'));
      
      // Call the callback to update parent component
      if (onLogoChange) {
        onLogoChange(null);
      }
    } catch (error) {
      console.error('Logo delete error:', error);
      message.error(t('logo_delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${import.meta.env.VITE_API_BASE_URL}/${logoPath}`;
  };

  return (
    <div className="logo-upload-container">
      <div style={{ marginBottom: 16 }}>
        {currentLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image
              width={80}
              height={80}
              src={getLogoUrl(currentLogo)}
              alt="Current Logo"
              style={{ objectFit: 'cover', borderRadius: '8px' }}
              preview={{
                mask: <EyeOutlined />,
              }}
            />
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {t('current_logo')}
              </p>
              <Popconfirm
                title={t('delete_logo_confirm')}
                onConfirm={handleDelete}
                okText={t('yes')}
                cancelText={t('no')}
                disabled={disabled}
              >
                <Button 
                  danger 
                  size="small" 
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  disabled={disabled}
                >
                  {t('delete')}
                </Button>
              </Popconfirm>
            </div>
          </div>
        ) : (
          <div style={{ 
            width: 80, 
            height: 80, 
            border: '2px dashed #d9d9d9', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            {t('no_logo')}
          </div>
        )}
      </div>

      <Upload
        beforeUpload={handleUpload}
        showUploadList={false}
        accept="image/*"
        disabled={disabled || uploading}
      >
        <Button 
          icon={<UploadOutlined />} 
          loading={uploading}
          disabled={disabled}
        >
          {currentLogo ? t('change_logo') : t('upload_logo')}
        </Button>
      </Upload>

      <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
        {t('logo_upload_hint')}
      </div>
    </div>
  );
};

export default LogoUpload;
