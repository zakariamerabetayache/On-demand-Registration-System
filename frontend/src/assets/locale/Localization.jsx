import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import arEG from 'antd/locale/ar_EG';
import { LanguageProvider, useLanguage } from './LanguageContext';

function LocalizationInner({ children }) {
  const { currentLanguage, isRTL } = useLanguage();
  
  const antdLocale = currentLanguage === 'ar' ? arEG : enUS;
  
  return (
    <ConfigProvider
      locale={antdLocale}
      direction={isRTL ? 'rtl' : 'ltr'}
      theme={{
        token: {
          colorPrimary: '#339393',
          colorLink: '#1640D6',
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default function Localization({ children }) {
  return (
    <LanguageProvider>
      <LocalizationInner>
        {children}
      </LocalizationInner>
    </LanguageProvider>
  );
}
