import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientManagement from './pages/ClientManagement';
import SiteManagement from './pages/SiteManagement';
import HostingManagement from './pages/HostingManagement';
import MobileApps from './pages/MobileApps';
import DeveloperAccounts from './pages/DeveloperAccounts';
import Notifications from './pages/Notifications';
import PrivateRoute from './components/PrivateRoute';
import { Alert, useAlert } from './components/Alert';

function App() {
  const { alert, showAlert } = useAlert();

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login showAlert={showAlert} />} />
            <Route path="/register" element={<Register showAlert={showAlert} />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<ClientManagement showAlert={showAlert} />} />
              <Route path="sites" element={<SiteManagement showAlert={showAlert} />} />
              <Route path="hosting" element={<HostingManagement showAlert={showAlert} />} />
              <Route path="mobile-apps" element={<MobileApps showAlert={showAlert} />} />
              <Route path="developer-accounts" element={<DeveloperAccounts showAlert={showAlert} />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          {alert && (
            <Alert 
              message={alert.message} 
              type={alert.type} 
              onClose={alert.onClose} 
            />
          )}
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;