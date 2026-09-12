import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import axiosClient from '../../axios-client';
import { useLanguage } from '../locale/LanguageContext';
import ErrorHandling from './ErrorHandling';
import Swal from 'sweetalert2';

const RFIDScanner = ({ record, onUpdate }) => {
  const [scanVisible, setScanVisible] = useState(false);
  const [rfidNumber, setRfidNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { translate } = useLanguage();

  // Focus input when modal opens
  useEffect(() => {
    if (scanVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [scanVisible]);

  const showScanModal = () => {
    setScanVisible(true);
    setRfidNumber(record.rfid || ''); // Pre-fill with existing RFID if available
  };

  const handleScanCancel = () => {
    setScanVisible(false);
    setRfidNumber('');
  };

  const handleRfidSubmit = async () => {
    if (!rfidNumber.trim()) {
      message.error(translate('rfid_required') || 'RFID is required');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axiosClient.put(`/users/${record.id}/rfid`, {
        rfid: rfidNumber.trim()
      });
      Swal.fire({
        icon: 'success',
        title: translate('rfid_updated_successfully') || 'RFID card has been successfully updated.',
        showConfirmButton: false,
        timer: 1500
      });

      if (response.data) {
        message.success(translate('rfid_updated_successfully') || 'RFID card has been successfully updated.');
        setScanVisible(false);
        setRfidNumber('');
        
        // Call onUpdate callback if provided to refresh parent data
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      ErrorHandling(error)
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && rfidNumber.trim()) {
      handleRfidSubmit();
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<ScanOutlined />}
        onClick={showScanModal}
        size="small"
        style={{
          backgroundColor: record.rfid ? '#52c41a' : '#1890ff',
          borderColor: record.rfid ? '#52c41a' : '#1890ff',
        }}
        title={record.rfid ? `${translate('current_rfid') || 'Current RFID'}: ${record.rfid}` : translate('scan_rfid') || 'Scan RFID'}
      >
        {record.rfid ? translate('update_rfid') || 'Update RFID' : translate('scan_rfid') || 'Scan RFID'}
      </Button>

      <Modal
        title={
          <div style={{ textAlign: 'center', color: '#52c41a', fontSize: '18px', fontWeight: 'bold' }}>
            {translate('scan_rfid_card') || 'امسح البطاقة'}
          </div>
        }
        open={scanVisible}
        footer={null}
        onCancel={handleScanCancel}
        width={400}
        centered
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '20px',
            border: '2px dashed #52c41a',
            borderRadius: '10px',
            backgroundColor: '#f6ffed',
          }}
        >
          {/* User Info */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              {record.nom_ar || record.nom_fr} {record.prenom_ar || record.prenom_fr}
            </div>
            {record.email && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {record.email}
              </div>
            )}
          </div>

          {/* RFID Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#52c41a',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            <ScanOutlined style={{ fontSize: '40px', color: 'white' }} />
          </div>

          {/* RFID Input */}
          <Input
            ref={inputRef}
            value={rfidNumber}
            onChange={(e) => setRfidNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            type="text"
            placeholder={translate('scan_rfid_placeholder') || 'امسح البطاقة أو أدخل الرقم'}
            style={{
              width: '280px',
              padding: '12px',
              border: '2px solid #52c41a',
              borderRadius: '8px',
              fontSize: '16px',
              textAlign: 'center',
            }}
            maxLength={20}
          />

          {/* Current RFID Display */}
          {record.rfid && (
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              backgroundColor: '#f0f0f0',
              padding: '8px 12px',
              borderRadius: '6px',
              width: '100%',
              textAlign: 'center'
            }}>
              {translate('current_rfid') || 'Current RFID'}: <strong>{record.rfid}</strong>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <Button
              type="primary"
              loading={loading}
              onClick={handleRfidSubmit}
              disabled={!rfidNumber.trim()}
              style={{
                flex: 1,
                height: '40px',
                backgroundColor: '#52c41a',
                borderColor: '#52c41a',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {translate('save') || 'حفظ'}
            </Button>
            <Button
              onClick={handleScanCancel}
              disabled={loading}
              style={{
                flex: 1,
                height: '40px',
                fontSize: '16px',
              }}
            >
              {translate('cancel') || 'إلغاء'}
            </Button>
          </div>

          {/* Instructions */}
          <div style={{ 
            fontSize: '12px', 
            color: '#8c8c8c', 
            textAlign: 'center',
            marginTop: '10px',
            lineHeight: '1.4'
          }}>
            {translate('rfid_instructions') || 'امسح البطاقة أو أدخل رقم RFID يدوياً ثم اضغط حفظ'}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RFIDScanner;
