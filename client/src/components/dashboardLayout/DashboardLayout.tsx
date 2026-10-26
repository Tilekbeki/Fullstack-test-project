import type { ReactNode } from 'react';
import { Popover } from 'antd';
import type { DashboardSection } from '../../models/dashboard.type';
import { DashboardIcon } from '../dashboardIcon/DashboardIcon';

const profileAvatar = 'https://api.dicebear.com/10.x/lorelei/svg?seed=13';

export interface DashboardLayoutProps {
  section: DashboardSection;
  mobileMenuOpen: boolean;
  onSectionChange: (section: DashboardSection) => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  children: ReactNode;
}

export function DashboardLayout({
  section,
  mobileMenuOpen,
  onSectionChange,
  onToggleMenu,
  onCloseMenu,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="app-shell">
      <aside
        id="workboard-sidebar"
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <button
          className={`nav-item ${section === 'overview' ? 'active' : ''}`}
          onClick={() => {
            onSectionChange('overview');
          }}
        >
          <DashboardIcon name="overview" /> Обзор работы
        </button>
        <button
          className={`nav-item ${section === 'projects' ? 'active' : ''}`}
          onClick={() => {
            onSectionChange('projects');
          }}
        >
          <DashboardIcon name="projects" /> Проекты и задачи
        </button>
        <button
          className={`nav-item ${section === 'responsibles' ? 'active' : ''}`}
          onClick={() => {
            onSectionChange('responsibles');
          }}
        >
          <DashboardIcon name="responsibles" /> Ответственные
        </button>
        <div className="sidebar-foot">
          <img
            className="avatar"
            src={profileAvatar}
            alt=""
          />
          <strong>Тилекбек Ташбаев</strong>
        </div>
      </aside>
      {mobileMenuOpen && (
        <button
          className="menu-backdrop"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => onCloseMenu()}
        />
      )}
      <main className="main">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">A</span>
            <span>
              adminka<small>ПАНЕЛЬ УПРАВЛЕНИЯ</small>
            </span>
          </div>
          <div className="header-tools">
            <Popover
              content={<strong className="profile-name">Тилекбек Ташбаев</strong>}
              trigger="click"
              placement="bottomRight"
            >
              <button
                className="profile-trigger"
                type="button"
                aria-label="Показать профиль"
              >
                <img
                  className="header-avatar"
                  src={profileAvatar}
                  alt=""
                />
              </button>
            </Popover>
          </div>
          <button
            className="menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-controls="workboard-sidebar"
            aria-expanded={mobileMenuOpen}
            onClick={() => onToggleMenu()}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path d="M5 5 19 19M19 5 5 19" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <h1>
                {section === 'projects'
                  ? 'Проекты и задачи'
                  : section === 'responsibles'
                    ? 'Ответственные'
                    : 'Обзор работы'}
              </h1>
              <p>Данные, сроки и команда в одном месте</p>
            </div>
          </div>
          <nav
            className="section-tabs"
            aria-label="Разделы"
          >
            <button
              type="button"
              className={section === 'overview' ? 'active' : ''}
              aria-current={section === 'overview' ? 'page' : undefined}
              onClick={() => {
                onSectionChange('overview');
              }}
            >
              Обзор работы
            </button>
            <button
              type="button"
              className={section === 'projects' ? 'active' : ''}
              aria-current={section === 'projects' ? 'page' : undefined}
              onClick={() => {
                onSectionChange('projects');
              }}
            >
              Проекты и задачи
            </button>
            <button
              type="button"
              className={section === 'responsibles' ? 'active' : ''}
              aria-current={section === 'responsibles' ? 'page' : undefined}
              onClick={() => {
                onSectionChange('responsibles');
              }}
            >
              Ответственные
            </button>
          </nav>
          {children}
        </div>
      </main>
    </div>
  );
}
