import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Loader, Server, Bell, ExternalLink } from 'lucide-react';

interface HostingAccount {
  id: string;
  provider: string;
  serverLoginUrl: string;
  hostType: 'shared' | 'reseller' | 'vps' | 'dedicated';
  username: string;
  email: string;
  passwordHint: string;
  expirationDate: string;
  status: 'suspended' | 'active' | 'reported' | 'expired' | 'other' | 'needs renewal';
}

interface HostingManagementProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const HostingManagement: React.FC<HostingManagementProps> = ({ showAlert }) => {
  const [hostingAccounts, setHostingAccounts] = useState<HostingAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHostingAccount, setNewHostingAccount] = useState<HostingAccount>({
    id: '',
    provider: '',
    serverLoginUrl: '',
    hostType: 'shared',
    username: '',
    email: '',
    passwordHint: '',
    expirationDate: '',
    status: 'active'
  });
  const [editingHostingAccount, setEditingHostingAccount] = useState<HostingAccount | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchHostingAccounts();
    }
  }, [currentUser]);

  const fetchHostingAccounts = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'hostingAccounts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const accountsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostingAccount));
      setHostingAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching hosting accounts:', error);
      showAlert('Failed to fetch hosting accounts. Please try again later.', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleAddHostingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a hosting account.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const accountData = {
        ...newHostingAccount,
        userId: currentUser.uid,
      };
      await addDoc(collection(db, 'hostingAccounts'), accountData);
      showAlert('Hosting account added successfully', 'success');
      setIsModalOpen(false);
      setNewHostingAccount({
        id: '',
        provider: '',
        serverLoginUrl: '',
        hostType: 'shared',
        username: '',
        email: '',
        passwordHint: '',
        expirationDate: '',
        status: 'active'
      });
      fetchHostingAccounts();
    } catch (error) {
      console.error('Error adding hosting account:', error);
      showAlert('Failed to add hosting account. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditHostingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHostingAccount) return;
    setIsEditLoading(true);
    try {
      const accountRef = doc(db, 'hostingAccounts', editingHostingAccount.id);
      await updateDoc(accountRef, editingHostingAccount);
      showAlert('Hosting account updated successfully', 'success');
      setEditingHostingAccount(null);
      fetchHostingAccounts();
    } catch (error) {
      console.error('Error updating hosting account:', error);
      showAlert('Failed to update hosting account. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteHostingAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this hosting account?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'hostingAccounts', id));
        showAlert('Hosting account deleted successfully', 'success');
        fetchHostingAccounts();
      } catch (error) {
        console.error('Error deleting hosting account:', error);
        showAlert('Failed to delete hosting account. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'suspended': return 'text-red-500';
      case 'reported': return 'text-orange-500';
      case 'expired': return 'text-gray-500';
      case 'needs renewal': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const isExpiringSoon = (expirationDate: string) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const differenceInDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return differenceInDays <= 30;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Hosting Management</h1>
      <Button onClick={() => setIsModalOpen(true)} className="mb-4">
        <Plus className="mr-2" /> Add New Hosting Account
      </Button>

      {/* Hosting Accounts List */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="border px-4 py-2">Provider</th>
              <th className="border px-4 py-2">Host Type</th>
              <th className="border px-4 py-2">Username</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Expiration Date</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isTableLoading ? (
              <tr>
                <td colSpan={7} className="border px-4 py-2 text-center">
                  <div className="flex justify-center items-center">
                    <Loader className="animate-spin mr-2" />
                    Loading hosting accounts...
                  </div>
                </td>
              </tr>
            ) : hostingAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="border px-4 py-2 text-center">
                  No hosting accounts found.
                </td>
              </tr>
            ) : (
              hostingAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="border px-4 py-2">{account.provider}</td>
                  <td className="border px-4 py-2">{account.hostType}</td>
                  <td className="border px-4 py-2">{account.username}</td>
                  <td className="border px-4 py-2">{account.email}</td>
                  <td className="border px-4 py-2">
                    <span className={isExpiringSoon(account.expirationDate) ? 'text-red-500 font-bold' : ''}>
                      {account.expirationDate}
                    </span>
                    {isExpiringSoon(account.expirationDate) && (
                      <Bell className="inline-block ml-2 text-red-500" size={16} />
                    )}
                  </td>
                  <td className={`border px-4 py-2 ${getStatusColor(account.status)}`}>
                    {account.status}
                  </td>
                  <td className="border px-4 py-2">
                    <Button onClick={() => setEditingHostingAccount(account)} className="mr-2">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDeleteHostingAccount(account.id)} 
                      variant="outline"
                      isLoading={isDeleteLoading === account.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Hosting Account Modal */}
      {(isModalOpen || editingHostingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingHostingAccount ? 'Edit Hosting Account' : 'Add New Hosting Account'}
            </h2>
            <form onSubmit={editingHostingAccount ? handleEditHostingAccount : handleAddHostingAccount}>
              <Input
                type="text"
                placeholder="Provider"
                value={editingHostingAccount ? editingHostingAccount.provider : newHostingAccount.provider}
                onChange={(e) => editingHostingAccount 
                  ? setEditingHostingAccount({ ...editingHostingAccount, provider: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, provider: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="url"
                placeholder="Server Login URL"
                value={editingHostingAccount ? editingHostingAccount.serverLoginUrl : newHostingAccount.serverLoginUrl}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, serverLoginUrl: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, serverLoginUrl: e.target.value })
                }
                className="mb-2"
                required
              />
              <select
                value={editingHostingAccount ? editingHostingAccount.hostType : newHostingAccount.hostType}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, hostType: e.target.value as any })
                  : setNewHostingAccount({ ...newHostingAccount, hostType: e.target.value as any })
                }
                className="mb-2 w-full p-2 border rounded"
                required
              >
                <option value="shared">Shared</option>
                <option value="reseller">Reseller</option>
                <option value="vps">VPS</option>
                <option value="dedicated">Dedicated</option>
              </select>
              <Input
                type="text"
                placeholder="Username"
                value={editingHostingAccount ? editingHostingAccount.username : newHostingAccount.username}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, username: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, username: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={editingHostingAccount ? editingHostingAccount.email : newHostingAccount.email}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, email: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, email: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="text"
                placeholder="Password Hint"
                value={editingHostingAccount ? editingHostingAccount.passwordHint : newHostingAccount.passwordHint}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, passwordHint: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, passwordHint: e.target.value })
                }
                className="mb-2"
              />
              <Input
                type="date"
                placeholder="Expiration Date"
                value={editingHostingAccount ? editingHostingAccount.expirationDate : newHostingAccount.expirationDate}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, expirationDate: e.target.value })
                  : setNewHostingAccount({ ...newHostingAccount, expirationDate: e.target.value })
                }
                className="mb-2"
                required
              />
              <select
                value={editingHostingAccount ? editingHostingAccount.status : newHostingAccount.status}
                onChange={(e) => editingHostingAccount
                  ? setEditingHostingAccount({ ...editingHostingAccount, status: e.target.value as any })
                  : setNewHostingAccount({ ...newHostingAccount, status: e.target.value as any })
                }
                className="mb-2 w-full p-2 border rounded"
                required
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="reported">Reported for Abuse</option>
                <option value="expired">Expired</option>
                <option value="needs renewal">Needs Renewal</option>
                <option value="other">Other</option>
              </select>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingHostingAccount(null);
                  }} 
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading || isEditLoading}>
                  {editingHostingAccount ? 'Update' : 'Add'} Hosting Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostingManagement;