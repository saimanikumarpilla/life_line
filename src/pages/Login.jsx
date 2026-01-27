import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check for admin/hardcoded credentials first (optional, but good for demo)
            if (formData.email === 'admin@lifeline.com' && formData.password === 'admin123') {
                localStorage.setItem('user', JSON.stringify({ userType: 'admin', name: 'Administrator' }));
                navigate('/admin-dashboard');
                return;
            }

            // Query login_details collection
            const q = query(
                collection(db, "login_details"),
                where("email", "==", formData.email),
                where("password", "==", formData.password)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Invalid email or password');
                setLoading(false);
                return;
            }

            // Login successful
            const userDoc = querySnapshot.docs[0].data();
            const userData = {
                id: querySnapshot.docs[0].id,
                ...userDoc
            };

            // Store user session (simplified for demo)
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect based on userType
            switch (userDoc.userType) {
                case 'donor':
                    navigate('/donor-dashboard');
                    break;
                case 'hospital':
                    navigate('/hospital-dashboard');
                    break;
                case 'blood_bank':
                    navigate('/blood-bank-dashboard');
                    break;
                default:
                    navigate('/');
            }

        } catch (err) {
            console.error("Login error:", err);
            setError('Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 w-full max-w-md"
            >
                <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 text-lg disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blood-red hover:underline">
                        Register here
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
