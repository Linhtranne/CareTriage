import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        logout: 'Log out',
        hello: 'Hello',
        dashboard: 'Dashboard',
        refresh: 'Refresh',
        save: 'Save',
        cancel: 'Cancel',
      },
      contentAdmin: {
        title: 'Content Management',
      },
      superAdmin: {
        title: 'Super Admin Dashboard',
      },
    }
  },
  vi: {
    translation: {
      common: {
        logout: 'Đăng xuất',
        hello: 'Xin chào',
        dashboard: 'Bảng điều khiển',
        refresh: 'Làm mới',
        save: 'Lưu',
        cancel: 'Hủy',
      },
      contentAdmin: {
        title: 'Content Management',
      },
      superAdmin: {
        title: 'Super Admin Dashboard',
      },
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
