import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Bell, Settings, Clock, AlertTriangle } from 'lucide-react';

interface ExpiringItem {
  id: string;
  type: 'site' | 'hosting' | 'app';
  name: string;
  expiryDate: string;
}

interface NotificationSetting {
  id: string;
  enableEmailNotifications: boolean;
  notifyOneMonth: boolean;
  notifyTwoWeeks: boolean;
  notifyThreeDays: boolean;
  notifyOnExpiryDay: boolean;
}

const Notifications: React.FC = () => {
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [settings, setSettings] = useState<NotificationSetting | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchExpiringItems();
      fetchSettings();
    }
  }, [currentUser]);

  const fetchExpiringItems = async () => {
    if (!currentUser) return;
    setError(null);
    try {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const items: ExpiringItem[] = [];

      // Fetch expiring sites
      const sitesQuery = query(
        collection(db, 'sites'),
        where('userId', '==', currentUser.uid),
        where('expirationDate', '<=', oneMonthFromNow.toISOString())
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      sitesSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'site', name: doc.data().name, expiryDate: doc.data().expirationDate });
      });

      // Fetch expiring hosting accounts
      const hostingQuery = query(
        collection(db, 'hostingAccounts'),
        where('userId', '==', currentUser.uid),
        where('expirationDate', '<=', oneMonthFromNow.toISOString())
      );
      const hostingSnapshot = await getDocs(hostingQuery);
      hostingSnapshot.forEach(doc => {
        items.push({ id: doc.id, type: 'hosting', name: doc.data().provider, expiryDate: doc.data().expirationDate });
      });

      // Fetch expiring mobile apps
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
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      setError('Failed to fetch expiring items. Please try again later.');
    }
  };

  const fetchSettings = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'notificationSettings'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const settingsData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as NotificationSetting;
        setSettings(settingsData);
      } else {
        const defaultSettings: Omit<NotificationSetting, 'id'> = {
          enableEmailNotifications: true,
          notifyOneMonth: true,
          notifyTwoWeeks: true,
          notifyThreeDays: true,
          notifyOnExpiryDay: true,
        };
        const docRef = await addDoc(collection(db, 'notificationSettings'), { ...defaultSettings, userId: currentUser.uid });
        setSettings({ id: docRef.id, ...defaultSettings });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      setError('Failed to fetch notification settings. Please try again later.');
    }
  };

  const updateSettings = async () => {
    if (!currentUser || !settings) return;
    try {
      const settingsRef = doc(db, 'notificationSettings', settings.id);
      await updateDoc(settingsRef, settings);
      setIsSettingsModalOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Failed to update notification settings. Please try again later.');
    }
  };

  const handleSettingChange = (setting: keyof NotificationSetting) => {
    if (settings) {
      setSettings({ ...settings, [setting]: !settings[setting] });
    }
  };

  const getExpirationStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysUntilExpiry <= 0) return 'Expired';
    if (daysUntilExpiry <= 3) return 'Expiring in 3 days or less';
    if (daysUntilExpiry <= 14) return 'Expiring in 2 weeks or less';
    return 'Expiring in 1 month or less';
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button onClick={() => setIsSettingsModalOpen(true)}>
          <Settings className="mr-2" /> Notification Settings
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Expirations</h2>
        {expiringItems.length === 0 ? (
          <p>No upcoming expirations.</p>
        ) : (
          <ul className="space-y-4">
            {expiringItems.map((item) => (
              <li key={item.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires on: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-red-500">
                      {getExpirationStatus(item.expiryDate)}
                    </p>
                  </div>
                  <AlertTriangle className="text-yellow-500" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isSettingsModalOpen && settings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableEmailNotifications}
                  onChange={() => handleSettingChange('enableEmailNotifications')}
                  className="mr-2"
                />
                Enable Email Notifications
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyOneMonth}
                  onChange={() => handleSettingChange('notifyOneMonth')}
                  className="mr-2"
                />
                Notify One Month Before Expiry
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyTwoWeeks}
                  onChange={() => handleSettingChange('notifyTwoWeeks')}
                  className="mr-2"
                />
                Notify Two Weeks Before Expiry
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyThreeDays}
                  onChange={() => handleSettingChange('notifyThreeDays')}
                  className="mr-2"
                />
                Notify Three Days Before Expiry
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyOnExpiryDay}
                  onChange={() => handleSettingChange('notifyOnExpiryDay')}
                  className="mr-2"
                />
                Notify on Expiry Day
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setIsSettingsModalOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={updateSettings}>Save Settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;