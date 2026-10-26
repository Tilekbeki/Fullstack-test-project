import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { App } from './components/App';
import { ToastProvider } from './providers/ToastProvider';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './style/style.scss';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: '#2196d2', colorPrimaryHover: '#1688c4', colorLink: '#1688c4', colorText: '#303b45', colorBorder: '#cfd8de', colorBgContainer: '#fff', borderRadius: 3, controlHeight: 30, fontSize: 13, fontFamily: 'Arial, Helvetica, sans-serif' } }}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConfigProvider>
  </React.StrictMode>
);
