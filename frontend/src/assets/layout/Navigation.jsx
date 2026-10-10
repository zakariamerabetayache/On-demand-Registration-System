import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Drawer } from 'antd';
import {
    UserOutlined,
    EnvironmentOutlined,
    BankOutlined,
    ShoppingOutlined,
    BuildOutlined,
    DashboardOutlined,
    TeamOutlined,
    IdcardOutlined,
    CreditCardOutlined,
    MenuOutlined,
    FileTextOutlined,
    FolderOutlined,
    FileDoneOutlined,
    CommentOutlined,
    ImportOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';
import { useLanguage } from '../locale/LanguageContext';
import useResponsive from '../hooks/useResponsive';
import LogoDisplay from './LogoDisplay';
import logo from '../img/algeria.jpg';

const { Sider } = Layout;

export default function Navigation() {
    const { isMobile } = useResponsive();
    return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible }) {
    const { user } = useStateContext();
    const location = useLocation();
    const navigate = useNavigate();
    const { translate, isRTL } = useLanguage();
    const [currentPath, setCurrentPath] = useState(location.pathname);

    const menuItems = [
        // Main
        // {
        //     key: "dashboard",
        //     icon: <DashboardOutlined />,
        //     label: <Link to={"/mainLayout/dashboard"}>{translate('dashboard')}</Link>,
        //     roles: ["national_admin", "wilaya_admin"],
        //     category: "main"
        // },
        {
            key: "party_members",
            icon: <TeamOutlined />,
            label: <Link to={"/mainLayout/party-members"}>
                {user?.etablissement?.type == "party" ? translate('party_members') : translate('association_members')}
            </Link>,
            roles: ["national_admin", "wilaya_admin"],
            category: "main"
        },
        {
            key: "users",
            icon: <UserOutlined />,
            label: <Link to={"/mainLayout/users"}>{translate('users')}</Link>,
            roles: ["admin", "national_admin"],
            category: "administration"
        },
        {
            key: "wilayas",
            icon: <BankOutlined />,
            label: <Link to={"/mainLayout/wilayas"}>{translate('wilayas')}</Link>,
            roles: ["admin"],
            category: "administration"
        },
        {
            key: "communes",
            icon: <EnvironmentOutlined />,
            label: <Link to={"/mainLayout/communes"}>{translate('communes')}</Link>,
            roles: ["admin"],
            category: "administration"
        },
        {
            key: "etablissements",
            icon: <BuildOutlined />,
            label: <Link to={"/mainLayout/etablissements"}>{translate('etablissements')}</Link>,
            roles: ["admin"],
            category: "administration"
        },
        {
            key: "parameters",
            icon: <SettingOutlined />,
            label: <Link to={"/mainLayout/parameters"}>{translate('establishment_parameters')}</Link>,
            roles: ["national_admin"],
            category: "administration"
        }
    ];

    // Filter menu items based on user role
    const filteredItems = menuItems.filter(item =>
        item.roles.includes(user?.role_id)
    );

    // Group items by category
    const categories = ["main", "administration"];
    const groupedItems = categories.map(cat => {
        const items = filteredItems.filter(item => item.category === cat);
        if (items.length === 0) return null;

        return {
            key: `group-${cat}`,
            type: 'group',
            label: translate(cat),
            children: items
        };
    }).filter(Boolean);

    // Update current path when location changes
    useEffect(() => {
        setCurrentPath(location.pathname);
    }, [location]);

    return (
        <Sider
            collapsible={collapsible}
            collapsed={false}
            className="navigation"
            width={256}
            style={{
                overflow: "auto",
                position: "fixed",
                height: "calc(100vh - 80px)",
                left: !isRTL ? 0 : "auto",
                right: !isRTL ? "auto" : 0,
                top: 80,
                backgroundColor: "#f8f9fa",
            }}
            theme="light"
        >
            <div
                className="logo"
                onClick={() => navigate("/")}
                style={{
                    cursor: "pointer",
                    height: "20px",
                    padding: "16px"
                }}
            />
            <Menu
                items={groupedItems}
                mode="inline"
                theme="light"
                selectedKeys={[currentPath]}
                style={{
                    width: 256,
                    backgroundColor: "#f8f9fa",
                    borderRight: 'none'
                }}
            />
        </Sider>
    );
}

function MobileSidebar() {
    const { user } = useStateContext();
    const { isRTL } = useLanguage();
    const [visible, setVisible] = useState(false);

    const showDrawer = () => setVisible(true);
    const onClose = () => setVisible(false);

    return (
        <>
            <Button
                type="text"
                size="large"
                onClick={showDrawer}
                style={{
                    position: 'fixed',
                    top: 20,
                    zIndex: 160,
                    height: '40px',
                    ...(isRTL ? { right: 10 } : { left: 10 }),
                }}
            >
                <MenuOutlined style={{ fontSize: 18 }} />
            </Button>
            <Drawer
                width={256}
                placement={isRTL ? 'right' : 'left'}
                closable={false}
                onClose={onClose}
                open={visible}
                style={{ backgroundColor: '#f8f9fa' }}
            >
                <LogoDisplay user={user} defaultLogo={logo} />
                <Sidebar collapsible={false} isMobile={true} />
            </Drawer>
        </>
    );
}
