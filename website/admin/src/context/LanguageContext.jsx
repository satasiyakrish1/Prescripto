import React, { createContext, useContext, useState, useEffect } from 'react';

// Define translations
const translations = {
  english: {
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    doctors: 'Doctors',
    patients: 'Patients',
    reports: 'Reports',
    analytics: 'Analytics',
    schedule: 'Schedule',
    profile: 'Profile',
    settings: 'Settings',
    darkMode: 'Dark Mode',
    fontSize: 'Font Size',
    language: 'Language',
    notifications: 'Notifications',
    emailNotifications: 'Email Notifications',
    appNotifications: 'App Notifications',
    systemUpdates: 'System Updates',
    signedInAs: 'Signed in as',
    myProfile: 'My Profile',
    helpSupport: 'Help & Support',
    logout: 'Logout',
    light: 'Light',
    bold: 'Bold',
  },
  spanish: {
    dashboard: 'Tablero',
    appointments: 'Citas',
    doctors: 'Médicos',
    patients: 'Pacientes',
    reports: 'Informes',
    analytics: 'Análisis',
    schedule: 'Horario',
    profile: 'Perfil',
    settings: 'Ajustes',
    darkMode: 'Modo Oscuro',
    fontSize: 'Tamaño de Fuente',
    language: 'Idioma',
    notifications: 'Notificaciones',
    emailNotifications: 'Notificaciones por Correo',
    appNotifications: 'Notificaciones de la Aplicación',
    systemUpdates: 'Actualizaciones del Sistema',
    signedInAs: 'Conectado como',
    myProfile: 'Mi Perfil',
    helpSupport: 'Ayuda y Soporte',
    logout: 'Cerrar Sesión',
    light: 'Ligero',
    bold: 'Negrita',
  },
  french: {
    dashboard: 'Tableau de Bord',
    appointments: 'Rendez-vous',
    doctors: 'Médecins',
    patients: 'Patients',
    reports: 'Rapports',
    analytics: 'Analyses',
    schedule: 'Horaire',
    profile: 'Profil',
    settings: 'Paramètres',
    darkMode: 'Mode Sombre',
    fontSize: 'Taille de Police',
    language: 'Langue',
    notifications: 'Notifications',
    emailNotifications: 'Notifications par Email',
    appNotifications: 'Notifications de l\'Application',
    systemUpdates: 'Mises à Jour Système',
    signedInAs: 'Connecté en tant que',
    myProfile: 'Mon Profil',
    helpSupport: 'Aide et Support',
    logout: 'Déconnexion',
    light: 'Léger',
    bold: 'Gras',
  },
  german: {
    dashboard: 'Dashboard',
    appointments: 'Termine',
    doctors: 'Ärzte',
    patients: 'Patienten',
    reports: 'Berichte',
    analytics: 'Analysen',
    schedule: 'Zeitplan',
    profile: 'Profil',
    settings: 'Einstellungen',
    darkMode: 'Dunkelmodus',
    fontSize: 'Schriftgröße',
    language: 'Sprache',
    notifications: 'Benachrichtigungen',
    emailNotifications: 'E-Mail-Benachrichtigungen',
    appNotifications: 'App-Benachrichtigungen',
    systemUpdates: 'Systemaktualisierungen',
    signedInAs: 'Angemeldet als',
    myProfile: 'Mein Profil',
    helpSupport: 'Hilfe & Support',
    logout: 'Abmelden',
    light: 'Leicht',
    bold: 'Fett',
  },
  chinese: {
    dashboard: '仪表板',
    appointments: '预约',
    doctors: '医生',
    patients: '患者',
    reports: '报告',
    analytics: '分析',
    schedule: '日程',
    profile: '个人资料',
    settings: '设置',
    darkMode: '深色模式',
    fontSize: '字体大小',
    language: '语言',
    notifications: '通知',
    emailNotifications: '邮件通知',
    appNotifications: '应用通知',
    systemUpdates: '系统更新',
    signedInAs: '登录为',
    myProfile: '我的资料',
    helpSupport: '帮助与支持',
    logout: '退出登录',
    light: '细体',
    bold: '粗体',
  },
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'english';
  });

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const translate = (key) => {
    return translations[currentLanguage]?.[key] || translations.english[key] || key;
  };

  const value = {
    currentLanguage,
    setCurrentLanguage,
    translate,
    availableLanguages: Object.keys(translations),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};