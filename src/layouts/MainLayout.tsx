import React from 'react';
import { Layout, Menu, Input, Tabs } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import './MainLayout.css';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderBar from '@/components/HeaderBar';

const { Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedKey = pathname.startsWith('/manage') ? '/manage' : pathname.startsWith('/config') ? '/config' : '';

  return (
    <>
      <HeaderBar />
      <Layout className="ml-root">
        <Sider width={280} className="ml-sider" theme="light" collapsible={false} trigger={null}>
          <div className="ml-tabs">
            <Tabs
              defaultActiveKey="default"
              items={[
                { key: 'default', label: '默认' },
                { key: 'fav', label: '收藏' }
              ]}
            />
          </div>
          <div className="ml-search">
            <Input.Search placeholder="搜索" allowClear />
          </div>
          <div className="ml-menu">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              defaultOpenKeys={["base", "plate"]}
              onClick={({ key }) => {
                if (typeof key === 'string' && key.startsWith('/')) navigate(key);
              }}
              items={[
                {
                  key: 'base',
                  icon: <AppstoreOutlined />,
                  label: '基础配置',
                  children: [
                    { key: '/config', label: '保护压板配置' }
                  ]
                },
                {
                  key: 'plate',
                  icon: <AppstoreOutlined />,
                  label: '保护压板管理',
                  children: [
                    { key: '/manage', label: '保护压板管理' }
                  ]
                }
              ]}
            />
          </div>
        </Sider>
        <Layout>
          <Content className="ml-content">
            {children}
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
