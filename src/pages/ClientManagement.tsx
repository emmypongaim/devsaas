import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Loader } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ClientManagementProps {
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ showAlert }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchClients();
    }
  }, [currentUser]);

  const fetchClients = async () => {
    if (!currentUser) return;
    setIsTableLoading(true);
    try {
      const q = query(collection(db, 'clients'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showAlert('Failed to fetch clients', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showAlert('You must be logged in to add a client.', 'error');
      return;
    }
    setIsAddLoading(true);
    try {
      const clientData = {
        ...newClient,
        userId: currentUser.uid,
      };
      await addDoc(collection(db, 'clients'), clientData);
      showAlert('Client added successfully', 'success');
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', phone: '' });
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      showAlert('Failed to add client. Please try again later.', 'error');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsEditLoading(true);
    try {
      const clientRef = doc(db, 'clients', editingClient.id);
      await updateDoc(clientRef, editingClient);
      showAlert('Client updated successfully', 'success');
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      showAlert('Failed to update client. Please try again later.', 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setIsDeleteLoading(id);
      try {
        await deleteDoc(doc(db, 'clients', id));
        showAlert('Client deleted successfully', 'success');
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        showAlert('Failed to delete client. Please try again later.', 'error');
      } finally {
        setIsDeleteLoading(null);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Client Management</h1>
      <Button onClick={() => setIsModalOpen(true)} className="mb-4">
        <Plus className="mr-2" /> Add New Client
      </Button>

      {/* Client List */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isTableLoading ? (
              <tr>
                <td colSpan={4} className="border px-4 py-2 text-center">
                  <div className="flex justify-center items-center">
                    <Loader className="animate-spin mr-2" />
                    Loading clients...
                  </div>
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="border px-4 py-2 text-center">
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td className="border px-4 py-2">{client.name}</td>
                  <td className="border px-4 py-2">{client.email}</td>
                  <td className="border px-4 py-2">{client.phone}</td>
                  <td className="border px-4 py-2">
                    <Button onClick={() => setEditingClient(client)} className="mr-2">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDeleteClient(client.id)} 
                      variant="outline"
                      isLoading={isDeleteLoading === client.id}
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

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <form onSubmit={handleAddClient}>
              <Input
                type="text"
                placeholder="Client Name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="mb-2"
                required
              />
              <Input
                type="email"
                placeholder="Client Email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="mb-2"
                required
              />
              <Input
                type="tel"
                placeholder="Client Phone"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="mb-2"
                required
              />
              <div className="flex justify-end">
                <Button type="button" onClick={() => setIsModalOpen(false)} className="mr-2">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAddLoading}>
                  Add Client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Edit Client</h2>
            <form onSubmit={handleEditClient}>
              <Input
                type="text"
                placeholder="Client Name"
                value={editingClient.name}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                className="mb-2"
                required
              />
              <Input
                type="email"
                placeholder="Client Email"
                value={editingClient.email}
                onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                className="mb-2"
                required
              />
              <Input
                type="tel"
                placeholder="Client Phone"
                value={editingClient.phone}
                onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                className="mb-2"
                required
              />
              <div className="flex justify-end">
                <Button type="button" onClick={() => setEditingClient(null)} className="mr-2">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isEditLoading}>
                  Update Client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;