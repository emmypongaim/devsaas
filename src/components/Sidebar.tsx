import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Globe,
  Cloud,
  Smartphone,
  FolderCog,
  CreditCard,
  Headphones,
  MessageSquare,
  LineChart,
  Settings,
  LogOut,
  Bell,
  Calendar,
  FileSpreadsheet,
  CloudCog,
  ListTodo,
  Users2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
//import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';

const menuSections = [
  {
    name: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: Users, label: 'Client Management', path: '/clients' },
      { icon: Globe, label: 'Site Management', path: '/sites' },
      { icon: Cloud, label: 'Hosting Management', path: '/hosting' },
      { icon: Smartphone, label: 'Mobile Apps', path: '/mobile-apps' },
      { icon: FolderCog, label: 'Developer Accounts', path: '/developer-accounts' },
    ]
  },
  {
    name: 'Workspace',
    items: [
      { icon: ListTodo, label: 'Tasks & To-Do', path: '/tasks' },
      { icon: Calendar, label: 'Task Calendar', path: '/task-calendar' },
      { icon: FileSpreadsheet, label: 'Task Reports', path: '/task-reports' },
    ]
  },

  {
    name: 'Teams & Collaboration',
    items: [
      { icon: Users2, label: 'Teams', path: '/teams' },
      { icon: MessageSquare, label: 'Team Communication', path: '/team-communication' },
      { icon: Calendar, label: 'Team Calendar', path: '/team-calendar' },
      { icon: FileSpreadsheet, label: 'Team Reports', path: '/team-reports' },
    ]
  },

  {
    name: 'Important',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: LineChart, label: 'Reports', path: '/reports' },
      { icon: Headphones, label: 'Support', path: '/support' },
    ]
  },
  {
    name: 'Billing & System',
    items: [
      { icon: CreditCard, label: 'Billing', path: '/billing' },
      { icon: CloudCog, label: 'System Status', path: '/system-status' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white dark:bg-[#1A1A1A] w-64 border-r border-gray-200 dark:border-gray-700/50 
        flex flex-col transform transition-transform duration-200 ease-in-out
        lg:transform-none lg:flex
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-2">
        <LayoutDashboard className="w-8 h-8 text-gray-900 dark:text-white" />
        <span className="text-xl font-semibold text-gray-900 dark:text-white">STACK ASSIST</span>
      </div>

      <nav className="flex-grow p-5 space-y-8 overflow-y-auto">
        {menuSections.map((section, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
              {section.name}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === item.path 
                      ? 'text-indigo-600 dark:text-[#3765F0] bg-indigo-50 dark:bg-[#3765F0]/10 font-medium' 
                      : 'text-gray-700 dark:text-[#A1A1A1] hover:text-indigo-600 dark:hover:text-[#3765F0] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-5">
        <Button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white dark:bg-[#FF3B30] dark:hover:bg-[#FF3B30]/90 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="sm:inline">Logout</span>
        </Button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;