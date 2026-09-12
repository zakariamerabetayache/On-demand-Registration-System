import React, { useState } from 'react';
import { Switch, Tooltip, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../locale/LanguageContext';
import axiosClient from '../../../axios-client';
import ErrorHandling from '../../components/ErrorHandling';

const StateToggle = ({ record, stateField = 'state', idField = 'id', onStateChange: propOnStateChange, path ,messagedone ,messagepending }) => {
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState(record[stateField]);
  const { translate } = useLanguage();
  const [messageApi, contextHolder] = message.useMessage();

  const handleStateChange = async (checked) => {
    setLoading(true);
    try {
      const newState = checked ? 1 : 0;
      
      await axiosClient.put(`${path}/${record[idField]}/state`, {
        state: newState
      });

      setCurrentState(newState);
      
      if (propOnStateChange) {
        propOnStateChange(newState);
      }
      
      messageApi.success(
        translate(newState === 1 ? messagedone : messagepending) || 
        (newState === 1 ? 'Marked as completed' : 'Marked as pending')
      );
    } catch (error) {
      ErrorHandling(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tooltip 
          title={
            currentState == 1 
              ? (translate(messagepending) || 'Mark as pending')
              : (translate(messagedone) || 'Mark as completed')
          }
        >
          <Switch
            checked={currentState == 1}
            loading={loading}
            onChange={handleStateChange}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<ClockCircleOutlined />}
            style={{
              backgroundColor: currentState == 1 ? '#52c41a' : '#faad14'
            }}
          />
        </Tooltip>
        <span style={{ 
          fontSize: '12px', 
          color: currentState == 1 ? '#52c41a' : '#faad14',
          fontWeight: 'bold',
          minWidth: '60px',
          display: 'inline-block'
        }}>
          {currentState == 1 
            ? (translate(messagedone) || 'Completed')
            : (translate(messagepending) || 'Pending')
          }
        </span>
      </div>
    </>
  );
};

export default StateToggle;
