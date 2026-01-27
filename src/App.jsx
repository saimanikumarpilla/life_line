import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import AdminDashboard from './pages/AdminDashboard';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = ['/donor-dashboard', '/hospital-dashboard', '/blood-bank-dashboard', '/admin-dashboard'].includes(location.pathname);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="fixed w-full z-50 top-0 left-0 px-6 py-4">
            <div className="glass-card max-w-7xl mx-auto px-6 py-3 flex justify-between items-center bg-gray-900/40 backdrop-blur-md border-white/10">
                <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blood-red to-red-400">
                    LifeLine
                </Link>
                <div className="flex space-x-6 text-gray-300 items-center">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    {!isDashboard ? (
                        <>

                            <Link to="/inventory" className="hover:text-white transition-colors">Inventory</Link>
                            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-sm font-medium">
                                Login
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/inventory" className="hover:text-white transition-colors">Inventory</Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const Home = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-24 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blood-red/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl md:text-7xl font-bold text-white tracking-tight"
                >
                    Save a Life, <br />
                    <span className="text-blood-red">Give Blood.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-400 max-w-2xl mx-auto"
                >
                    A centralized blood supply management system connecting donors with those in need.
                    Join our community today.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center gap-4"
                >
                    <Link to="/register" className="btn-primary block">Register as Donor</Link>
                    <Link to="/inventory" className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all block">Request Blood</Link>
                </motion.div>
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

                    {/* Secured Routes (Auth logic handled in components for now) */}
                    <Route path="/donor-dashboard" element={<DonorDashboard />} />
                    <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
                    <Route path="/blood-bank-dashboard" element={<BloodBankDashboard />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
