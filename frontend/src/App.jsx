import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import Analytics from './pages/Analytics';
import PaymentsList from './pages/PaymentsList';
import Queue from './pages/Queue';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import ManagerDashboard from './pages/ManagerDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { SearchProvider } from './context/SearchContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const token = localStorage.getItem('token');
  let user = {};
  
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    localStorage.removeItem('user');
  }
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const publicPaths = ['/', '/login', '/register'];
  const isPublic = !token || publicPaths.includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF']}><Customers /></ProtectedRoute>} />
      <Route path="/operations" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF']}><Operations /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF']}><Analytics /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']}><PaymentsList /></ProtectedRoute>} />
      <Route path="/queue" element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF']}><Queue /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><Employees /></ProtectedRoute>} />
      <Route path="/manager/dashboard" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isPublic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>{routes}</main>
      </div>
    );
  }

  return (
    <MainLayout>
      {routes}
    </MainLayout>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <SearchProvider>
        <Router>
          <AppContent />
        </Router>
      </SearchProvider>
    </ThemeProvider>
  );
};

export default App;
