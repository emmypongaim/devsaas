import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Loader, ExternalLink } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  type: string;
  url: string;
  hostId: string;
  hostName: string;
  domainPurchasedFrom: string;
  expirationDate: string;
  nameChanged: boolean;
  oldDomainName?: string;
  oldDomainExpirationDate?: string;
  amountPaid: number;
  amountUsedForCreation: number;
}

interface Host {
  id: string;
  name: string;
}

interface SiteManagementProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SiteManagement: React.FC<SiteManagementProps> = ({ showAlert }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSite, setNewSite] = useState<Omit<Site, 'id'>>({
    name: '',
    type: '',
    url: '',
    hostId: '',
    hostName: '',
    domainPurchasedFrom: '',
    expirationDate: '',
    nameChanged: false,
    amountPaid: 0,
    amountUsedForCreation: 0,
  });
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [siteTypes, setSiteTypes] = useState<string[]>(['Personal', 'Business', 'E-commerce', 'Blog']);
  const [newSiteType, setNewSiteType] = useState('');
  const [isAddingHost, setIsAddingHost] = useState(false);
  const [newHost, setNewHost] = useState({ name: '' });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchSites();
      fetchHosts();
    }
  }, [currentUser]);

  const fetchSites = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'sites'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const sitesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching sites:', error);
      showAlert('Failed to fetch sites. Please try again later.', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchHosts = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'hostingAccounts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const hostsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().provider } as Host));
      setHosts(hostsData);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      showAlert('Failed to fetch hosts. Please try again later.', 'error');
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a site.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const selectedHost = hosts.find(host => host.id === newSite.hostId);
      if (!selectedHost) {
        throw new Error('Selected host not found');
      }
      const siteData = {
        ...newSite,
        userId: currentUser.uid,
        hostName: selectedHost.name,
      };
      await addDoc(collection(db, 'sites'), siteData);
      showAlert('Site added successfully', 'success');
      setIsModalOpen(false);
      setNewSite({
        name: '',
        type: '',
        url: '',
        hostId: '',
        hostName: '',
        domainPurchasedFrom: '',
        expirationDate: '',
        nameChanged: false,
        amountPaid: 0,
        amountUsedForCreation: 0,
      });
      fetchSites();
    } catch (error) {
      console.error('Error adding site:', error);
      showAlert('Failed to add site. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    setIsEditLoading(true);
    try {
      const selectedHost = hosts.find(host => host.id === editingSite.hostId);
      if (!selectedHost) {
        throw new Error('Selected host not found');
      }
      const updatedSite = {
        ...editingSite,
        hostName: selectedHost.name,
      };
      const siteRef = doc(db, 'sites', editingSite.id);
      await updateDoc(siteRef, updatedSite);
      showAlert('Site updated successfully', 'success');
      setEditingSite(null);
      fetchSites();
    } catch (error) {
      console.error('Error updating site:', error);
      showAlert('Failed to update site. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'sites', id));
        showAlert('Site deleted successfully', 'success');
        fetchSites();
      } catch (error) {
        console.error('Error deleting site:', error);
        showAlert('Failed to delete site. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  const handleAddSiteType = () => {
    if (newSiteType && !siteTypes.includes(newSiteType)) {
      setSiteTypes([...siteTypes, newSiteType]);
      setNewSiteType('');
    }
  };

  const handleAddHost = async () => {
    if (!currentUser || !newHost.name) return;
    try {
      const hostData = {
        provider: newHost.name,
        userId: currentUser.uid,
      };
      const docRef = await addDoc(collection(db, 'hostingAccounts'), hostData);
      const newHostWithId = { id: docRef.id, name: newHost.name };
      setHosts([...hosts, newHostWithId]);
      setNewHost({ name: '' });
      setIsAddingHost(false);
      showAlert('Host added successfully', 'success');
    } catch (error) {
      console.error('Error adding host:', error);
      showAlert('Failed to add host. Please try again later.', 'error');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Site Management</h1>
      <Button onClick={() => setIsModalOpen(true)} className="mb-4">
        <Plus className="mr-2" /> Add New Site
      </Button>

      {/* Site List */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Type</th>
              <th className="border px-4 py-2">URL</th>
              <th className="border px-4 py-2">Host</th>
              <th className="border px-4 py-2">Domain Purchased From</th>
              <th className="border px-4 py-2">Expiration Date</th>
              <th className="border px-4 py-2">Name Changed</th>
              <th className="border px-4 py-2">Amount Paid</th>
              <th className="border px-4 py-2">Amount Used for Creation</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isTableLoading ? (
              <tr>
                <td colSpan={10} className="border px-4 py-2 text-center">
                  <div className="flex justify-center items-center">
                    <Loader className="animate-spin mr-2" />
                    Loading sites...
                  </div>
                </td>
              </tr>
            ) : sites.length === 0 ? (
              <tr>
                <td colSpan={10} className="border px-4 py-2 text-center">
                  No sites found.
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr key={site.id}>
                  <td className="border px-4 py-2">{site.name}</td>
                  <td className="border px-4 py-2">{site.type}</td>
                  <td className="border px-4 py-2">
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {site.url} <ExternalLink className="inline w-4 h-4" />
                    </a>
                  </td>
                  <td className="border px-4 py-2">{site.hostName}</td>
                  <td className="border px-4 py-2">{site.domainPurchasedFrom}</td>
                  <td className="border px-4 py-2">{site.expirationDate}</td>
                  <td className="border px-4 py-2">{site.nameChanged ? 'Yes' : 'No'}</td>
                  <td className="border px-4 py-2">${site.amountPaid}</td>
                  <td className="border px-4 py-2">${site.amountUsedForCreation}</td>
                  <td className="border px-4 py-2">
                    <Button onClick={() => setEditingSite(site)} className="mr-2">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDeleteSite(site.id)} 
                      variant="outline"
                      isLoading={isDeleteLoading === site.id}
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

      {/* Add/Edit Site Modal */}
      {(isModalOpen || editingSite) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingSite ? 'Edit Site' : 'Add New Site'}
            </h2>
            <form onSubmit={editingSite ? handleEditSite : handleAddSite}>
              <Input
                type="text"
                placeholder="Site Name"
                value={editingSite ? editingSite.name : newSite.name}
                onChange={(e) => editingSite 
                  ? setEditingSite({ ...editingSite, name: e.target.value })
                  : setNewSite({ ...newSite, name: e.target.value })
                }
                className="mb-2"
                required
              />
              <div className="flex mb-2">
                <select
                  value={editingSite ? editingSite.type : newSite.type}
                  onChange={(e) => editingSite
                    ? setEditingSite({ ...editingSite, type: e.target.value })
                    : setNewSite({ ...newSite, type: e.target.value })
                  }
                  className="flex-grow p-2 border rounded mr-2"
                  required
                >
                  <option value="">Select Site Type</option>
                  {siteTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <Input
                  type="text"
                  placeholder="New Site Type"
                  value={newSiteType}
                  onChange={(e) => setNewSiteType(e.target.value)}
                  className="flex-grow"
                />
                <Button type="button" onClick={handleAddSiteType} className="ml-2">
                  Add
                </Button>
              </div>
              <Input
                type="url"
                placeholder="Site URL"
                value={editingSite ? editingSite.url : newSite.url}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, url: e.target.value })
                  : setNewSite({ ...newSite, url: e.target.value })
                }
                className="mb-2"
                required
              />
              <div className="flex mb-2">
                <select
                  value={editingSite ? editingSite.hostId : newSite.hostId}
                  onChange={(e) => editingSite
                    ? setEditingSite({ ...editingSite, hostId: e.target.value })
                    : setNewSite({ ...newSite, hostId: e.target.value })
                  }
                  className="flex-grow p-2 border rounded mr-2"
                  required
                >
                  <option value="">Select Host</option>
                  {hosts.map((host) => (
                    <option key={host.id} value={host.id}>{host.name}</option>
                  ))}
                </select>
                <Button type="button" onClick={() => setIsAddingHost(true)} className="ml-2">
                  Add Host
                </Button>
              </div>
              {isAddingHost && (
                <div className="mb-2">
                  <Input
                    type="text"
                    placeholder="New Host Name"
                    value={newHost.name}
                    onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                    className="mr-2"
                  />
                  <Button type="button" onClick={handleAddHost}>
                    Add Host
                  </Button>
                </div>
              )}
              <Input
                type="text"
                placeholder="Domain Purchased From"
                value={editingSite ? editingSite.domainPurchasedFrom : newSite.domainPurchasedFrom}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, domainPurchasedFrom: e.target.value })
                  : setNewSite({ ...newSite, domainPurchasedFrom: e.target.value })
                }
                className="mb-2"
                required
              />
              <Input
                type="date"
                placeholder="Expiration Date"
                value={editingSite ? editingSite.expirationDate : newSite.expirationDate}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, expirationDate: e.target.value })
                  : setNewSite({ ...newSite, expirationDate: e.target.value })
                }
                className="mb-2"
                required
              />
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingSite ? editingSite.nameChanged : newSite.nameChanged}
                    onChange={(e) => editingSite
                      ? setEditingSite({ ...editingSite, nameChanged: e.target.checked })
                      : setNewSite({ ...newSite, nameChanged: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Name Changed
                </label>
              </div>
              {(editingSite ? editingSite.nameChanged : newSite.nameChanged) && (
                <>
                  <Input
                    type="text"
                    placeholder="Old Domain Name"
                    value={editingSite ? editingSite.oldDomainName : newSite.oldDomainName}
                    onChange={(e) => editingSite
                      ? setEditingSite({ ...editingSite, oldDomainName: e.target.value })
                      : setNewSite({ ...newSite, oldDomainName: e.target.value })
                    }
                    className="mb-2"
                  />
                  <Input
                    type="date"
                    placeholder="Old Domain Expiration Date"
                    value={editingSite ? editingSite.oldDomainExpirationDate : newSite.oldDomainExpirationDate}
                    onChange={(e) => editingSite
                      ? setEditingSite({ ...editingSite, oldDomainExpirationDate: e.target.value })
                      : setNewSite({ ...newSite, oldDomainExpirationDate: e.target.value })
                    }
                    className="mb-2"
                  />
                </>
              )}
              <Input
                type="number"
                placeholder="Amount Paid"
                value={editingSite ? editingSite.amountPaid : newSite.amountPaid}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, amountPaid: parseFloat(e.target.value) })
                  : setNewSite({ ...newSite, amountPaid: parseFloat(e.target.value) })
                }
                className="mb-2"
                required
              />
              <Input
                type="number"
                placeholder="Amount Used for Creation"
                value={editingSite ? editingSite.amountUsedForCreation : newSite.amountUsedForCreation}
                onChange={(e) => editingSite
                  ? setEditingSite({ ...editingSite, amountUsedForCreation: parseFloat(e.target.value) })
                  : setNewSite({ ...newSite, amountUsedForCreation: parseFloat(e.target.value) })
                }
                className="mb-2"
                required
              />
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSite(null);
                  }} 
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading || isEditLoading}>
                  {editingSite ? 'Update' : 'Add'} Site
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManagement;