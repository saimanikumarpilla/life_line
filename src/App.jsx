import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RecipientLogin from './pages/RecipientLogin';
import RecipientDashboard from './pages/RecipientDashboard';
import BloodBanksDirectory from './pages/BloodBanksDirectory';

import { Home as HomeIcon, Building2, Package, LogIn, LogOut, User } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    let homeLink = "/";
    const allowedRoles = ['blood_bank', 'hospital', 'admin', 'donor'];
    const showInventory = user && allowedRoles.includes(user.userType);

    if (user) {
        switch (user.userType) {
            case 'donor': homeLink = "/donor-dashboard"; break;
            case 'hospital': homeLink = "/hospital-dashboard"; break;
            case 'blood_bank': homeLink = "/blood-bank-dashboard"; break;
            case 'admin': homeLink = "/admin-dashboard"; break;
            case 'recipient': homeLink = "/recipient-dashboard"; break;
            default: homeLink = "/";
        }
    }

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Desktop Navigation (Floating Top) */}
            <nav className="hidden md:block fixed w-full z-50 top-0 left-0 px-6 py-4">
                <div className="glass-card max-w-7xl mx-auto px-6 py-3 flex justify-between items-center bg-gray-900/40 backdrop-blur-md border-white/10">
                    <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blood-red to-red-400">
                        LifeLine
                    </Link>
                    <div className="flex space-x-6 text-gray-300 items-center">
                        <Link to={homeLink} className={`hover:text-white transition-colors ${isActive(homeLink) ? 'text-white font-medium' : ''}`}>Home</Link>
                        <Link to="/blood-banks-directory" className={`hover:text-white transition-colors ${isActive('/blood-banks-directory') ? 'text-white font-medium' : ''}`}>Blood Banks</Link>
                        {showInventory && (
                            <Link to="/inventory" className={`hover:text-white transition-colors ${isActive('/inventory') ? 'text-white font-medium' : ''}`}>Inventory</Link>
                        )}

                        {!user ? (
                            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-sm font-medium">
                                Login
                            </Link>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="px-4 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation (Fixed Bottom) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/10 px-6 py-3 pb-safe flex justify-between items-center">
                <Link to={homeLink} className={`flex flex-col items-center gap-1 transition-colors ${isActive(homeLink) ? 'text-blood-red' : 'text-gray-400'}`}>
                    <HomeIcon size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link to="/blood-banks-directory" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/blood-banks-directory') ? 'text-blood-red' : 'text-gray-400'}`}>
                    <Building2 size={20} />
                    <span className="text-[10px] font-medium">Banks</span>
                </Link>

                {showInventory && (
                    <Link to="/inventory" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/inventory') ? 'text-blood-red' : 'text-gray-400'}`}>
                        <Package size={20} />
                        <span className="text-[10px] font-medium">Stocks</span>
                    </Link>
                )}

                {!user ? (
                    <Link to="/login" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/login') ? 'text-blood-red' : 'text-gray-400'}`}>
                        <LogIn size={20} />
                        <span className="text-[10px] font-medium">Login</span>
                    </Link>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="text-[10px] font-medium">Logout</span>
                    </button>
                )}
            </nav>
        </>
    );
};

import CampCarousel from './components/CampCarousel';

const Home = () => {
    // Only import 'Home' (the page) but avoid naming conflict with earlier 'Home' (icon) import if any?
    // Wait, step 47 showed 'Home as HomeIcon'. So I can use 'Home' for the component name safely if it's top level.
    // The previous code had `const Home = () => {`.

    return (
        <div className="min-h-screen p-6 pt-24 relative overflow-hidden flex flex-col justify-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blood-red/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

                {/* Main Content (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="text-left space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-bold text-white tracking-tight"
                        >
                            Save a Life, <br />
                            <span className="text-blood-red">Give Blood.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl"
                        >
                            A centralized blood supply management system connecting donors with those in need.
                            Join our community today.
                        </motion.p>
                    </div>

                    {/* Carousel Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <CampCarousel />
                    </motion.div>
                </div>

                {/* Sidebar Actions (Right) */}
                <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1 space-y-4"
                >
                    <div className="glass-card p-6 border border-white/10 space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Quick Actions</h3>

                        <div className="space-y-4">
                            <Link to="/register" className="block group">
                                <div className="p-4 rounded-xl bg-gradient-to-r from-blood-red to-red-600 hover:from-red-600 hover:to-blood-red transition-all shadow-lg hover:shadow-blood-red/25">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-white">Register as Donor</span>
                                        <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                    <p className="text-white/80 text-sm mt-1">Join the lifesavers community</p>
                                </div>
                            </Link>

                            <Link to="/recipient-login" className="block group">
                                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-white">Request Blood</span>
                                        <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">Find blood availability near you</p>
                                </div>
                            </Link>

                            <Link to="/blood-banks-directory" className="block group">
                                <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-white">View Directory</span>
                                        <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">Registered Blood Banks</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </motion.aside>

            </div>
        </div>
    )
}

function App() {
    return (
        <Router>
            <div className="text-white">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/recipient-login" element={<RecipientLogin />} />
                    <Route path="/recipient-dashboard" element={<RecipientDashboard />} />

                    {/* Secured Routes (Auth logic handled in components for now) */}
                    <Route path="/donor-dashboard" element={<DonorDashboard />} />
                    <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
                    <Route path="/blood-bank-dashboard" element={<BloodBankDashboard />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/blood-banks-directory" element={<BloodBanksDirectory />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
