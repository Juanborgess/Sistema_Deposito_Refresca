import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ScrollToTop from './components/ScrollToTop';
import ShopLayout from './pages/ShopLayout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import OrderTracking from './pages/OrderTracking';
import { Toaster } from 'react-hot-toast';
import InstallPWA from './components/InstallPWA';

// Admin imports
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Catalog from './pages/admin/Catalog';
import Categories from './pages/admin/Categories';
import Motoboys from './pages/admin/Motoboys';
import Shipping from './pages/admin/Shipping';
import Schedule from './pages/admin/Schedule';
import Coupons from './pages/admin/Coupons';
import Customers from './pages/admin/Customers';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Toaster 
          position="bottom-center" 
          toastOptions={{
            style: {
              background: '#101935',
              color: '#fff',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: '16px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: {
                primary: '#00E5FF',
                secondary: '#0A0F1D',
              },
            },
          }} 
        />
        
        <InstallPWA />
        
        <Routes>
          {/* Rotas Públicas da Vitrine */}
          <Route path="/" element={<ShopLayout />}>
            <Route index element={<Home />} />
            <Route path="produto/:id" element={<ProductDetails />} />
            <Route path="rastreio" element={<OrderTracking />} />
          </Route>

          {/* Rotas Administrativas */}
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="categories" element={<Categories />} />
              <Route path="motoboys" element={<Motoboys />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="customers" element={<Customers />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
