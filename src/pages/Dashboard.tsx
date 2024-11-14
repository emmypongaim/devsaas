import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, 
  //orderBy, limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  //LayoutDashboard, 
  Users, 
  Globe, 
  Server, 
  Smartphone, 
  AlertTriangle,
  Bell,
  TrendingUp,
  TrendingDown,
  Plus
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface QuickStat {
  icon: React.ElementType;
  label: string;
  value: number;
  change?: number;
}

interface ExpiringItem {
  id: string;
  type: 'site' | 'hosting' | 'app';
  name: string;
  expiryDate: string;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    labels: ['1 Month', '2 Weeks', '1 Week', '3 Days', 'Expiring'],
    datasets: [
      {
        label: 'Sites',
        data: [0, 0, 0, 0, 0],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Hosting',
        data: [0, 0, 0, 0, 0],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Mobile Apps',
        data: [0, 0, 0, 0, 0],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchQuickStats();
      fetchExpiringItems();
    }
  }, [currentUser]);

  const fetchQuickStats = async () => {
    if (!currentUser) return;
    try {
      const clientsQuery = query(collection(db, 'clients'), where('userId', '==', currentUser.uid));
      const sitesQuery = query(collection(db, 'sites'), where('userId', '==', currentUser.uid));
      const hostingQuery = query(collection(db, 'hostingAccounts'), where('userId', '==', currentUser.uid));
      const appsQuery = query(collection(db, 'mobileApps'), where('userId', '==', currentUser.uid));

      const [clientsSnapshot, sitesSnapshot, hostingSnapshot, appsSnapshot] = await Promise.all([
        getDocs(clientsQuery),
        getDocs(sitesQuery),
        getDocs(hostingQuery),
        getDocs(appsQuery)
      ]);

      const now = new Date();
      const oneWeekFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
      const threeDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const expiringSites = sitesSnapshot.docs.filter(doc => new Date(doc.data().expirationDate) <= oneMonthFromNow).length;
      const expiringHosting = hostingSnapshot.docs.filter(doc => new Date(doc.data().expirationDate) <= oneMonthFromNow).length;
      const expiringApps = appsSnapshot.docs.filter(doc => new Date(doc.data().renewalDate) <= oneMonthFromNow).length;

      const expiringInOneWeek = [...sitesSnapshot.docs, ...hostingSnapshot.docs, ...appsSnapshot.docs].filter(doc => {
        const expiryDate = new Date(doc.data().expirationDate || doc.data().renewalDate);
        return expiryDate <= oneWeekFromNow && expiryDate > threeDaysFromNow;
      }).length;

      const expiringInThreeDays = [...sitesSnapshot.docs, ...hostingSnapshot.docs, ...appsSnapshot.docs].filter(doc => {
        const expiryDate = new Date(doc.data().expirationDate || doc.data().renewalDate);
        return expiryDate <= threeDaysFromNow && expiryDate > now;
      }).length;

      const expiringInOneMonth = [...sitesSnapshot.docs, ...hostingSnapshot.docs, ...appsSnapshot.docs].filter(doc => {
        const expiryDate = new Date(doc.data().expirationDate || doc.data().renewalDate);
        return expiryDate <= oneMonthFromNow && expiryDate > oneWeekFromNow;
      }).length;

      setQuickStats([
        { icon: Users, label: 'Total Clients', value: clientsSnapshot.size },
        { icon: Globe, label: 'Total Sites', value: sitesSnapshot.size },
        { icon: Server, label: 'Total Hosting Accounts', value: hostingSnapshot.size },
        { icon: Smartphone, label: 'Total Mobile Apps', value: appsSnapshot.size },
        { icon: AlertTriangle, label: 'Expiring Sites', value: expiringSites },
        { icon: AlertTriangle, label: 'Expiring Hosting', value: expiringHosting },
        { icon: AlertTriangle, label: 'Expiring Mobile Apps', value: expiringApps },
        { icon: AlertTriangle, label: 'Expiring in 1 Week', value: expiringInOneWeek },
        { icon: AlertTriangle, label: 'Expiring in 3 Days', value: expiringInThreeDays },
        { icon: AlertTriangle, label: 'Expiring in 1 Month', value: expiringInOneMonth },
      ]);
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      setError('Failed to fetch dashboard data. Please try again later.');
    }
  };

  const fetchExpiringItems = async () => {
    if (!currentUser) return;
    try {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const items: ExpiringItem[] = [];

      const sitesQuery = query(
        collection(db, 'sites'),
        where('userId', '==', currentUser.uid),
        where('expirationDate', '<=', oneMonthFromNow.toISOString())
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      sitesSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'site', name: doc.data().name, expiryDate: doc.data().expirationDate });
      });

      const hostingQuery = query(
        collection(db, 'hostingAccounts'),
        where('userId', '==', currentUser.uid),
        where('expirationDate', '<=', oneMonthFromNow.toISOString())
      );
      const hostingSnapshot = await getDocs(hostingQuery);
      hostingSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'hosting', name: doc.data().provider, expiryDate: doc.data().expirationDate });
      });

      const appsQuery = query(
        collection(db, 'mobileApps'),
        where('userId', '==', currentUser.uid),
        where('renewalDate', '<=', oneMonthFromNow.toISOString())
      );
      const appsSnapshot = await getDocs(appsQuery);
      appsSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'app', name: doc.data().appName, expiryDate: doc.data().renewalDate });
      });

      setExpiringItems(items);
      updateAnalyticsData(items);
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      setError('Failed to fetch expiration data. Please try again later.');
    }
  };

  const updateAnalyticsData = (items: ExpiringItem[]) => {
    const now = new Date();
    const data = {
      sites: [0, 0, 0, 0, 0],
      hosting: [0, 0, 0, 0, 0],
      apps: [0, 0, 0, 0, 0],
    };

    items.forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      let index;
      if (daysUntilExpiry <= 0) index = 4;
      else if (daysUntilExpiry <= 3) index = 3;
      else if (daysUntilExpiry <= 7) index = 2;
      else if (daysUntilExpiry <= 14) index = 1;
      else index = 0;

      if (item.type === 'site') data.sites[index]++;
      else if (item.type === 'hosting') data.hosting[index]++;
      else if (item.type === 'app') data.apps[index]++;
    });

    setAnalyticsData(prevData => ({
      ...prevData,
      datasets: [
        { ...prevData.datasets[0], data: data.sites },
        { ...prevData.datasets[1], data: data.hosting },
        { ...prevData.datasets[2], data: data.apps },
      ],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] dark:bg-[#1A1A1A]">
      <div className="p-4 lg:p-8">
        <div className="flex flex-col gap-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Overview</h2>
            <div className="flex items-center gap-4">
              <select 
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
                defaultValue="last7Days"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7Days">Last 7 Days</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>
              <button className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/30" role="alert">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-red-100 p-1 dark:bg-red-900/50">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </span>
                <p className="text-sm font-medium text-red-600 dark:text-red-500">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-[#1A1A1A]/60"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <span className="inline-flex rounded-full bg-gray-100 p-2 dark:bg-gray-900">
                    <stat.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </h3>
                  {stat.change !== undefined && (
                    <p className={`mt-2 flex items-center text-sm ${
                      stat.change >= 0 
                        ? 'text-green-600 dark:text-green-500' 
                        : 'text-red-600 dark:text-red-500'
                    }`}>
                      {stat.change >= 0 ? (
                        <TrendingUp className="mr-1 h-4 w-4" />
                      ) : (
                        <TrendingDown className="mr-1 h-4 w-4" />
                      )}
                      {Math.abs(stat.change)}% from last month
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expiration Analytics</h3>
                <select 
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
                  defaultValue="thisMonth"
                >
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisQuarter">This Quarter</option>
                  <option value="thisYear">This Year</option>
                </select>
              </div>
              <div className="mt-6 h-[300px]">
                <Line data={analyticsData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expirations</h3>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  View All
                </button>
              </div>
              <div className="mt-6 space-y-6">
                {expiringItems.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className={`mt-1 rounded-full p-2 ${
                      item.type === 'site' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      item.type === 'hosting' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {item.type === 'site' && <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {item.type === 'hosting' && <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      {item.type === 'app' && <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h4>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Expires on {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-all hover:border-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500">
                      Renew
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-[#1F2937]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Critical Alerts</h3>
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-500">
                  {expiringItems.filter(item => new Date(item.expiryDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).length} Critical
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {expiringItems
                  .filter(item => new Date(item.expiryDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
                  .map((item, index) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/30">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-600 dark:text-red-500">
                          {item.name} ({item.type})
                        </h4>
                        <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                          Expires in less than 3 days!
                        </p>
                      </div>
                      <button className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
                        Take Action
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-[#1F2937]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="mt-6 grid gap-4">
                <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500">
                  <span className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
                    <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add New Site</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Register a new website</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500">
                  <span className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                    <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">New Hosting Account</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Set up hosting service</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500">
                  <span className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                    <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">New Mobile App</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Create mobile application</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;