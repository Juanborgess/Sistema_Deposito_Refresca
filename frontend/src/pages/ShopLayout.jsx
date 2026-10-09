import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Navbar from '../components/Navbar';
import Cart from '../components/Cart';
import Footer from '../components/Footer';

const ShopLayout = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white font-sans flex flex-col">
      <Cart />
      <Topbar />
      <Navbar />
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ShopLayout;
