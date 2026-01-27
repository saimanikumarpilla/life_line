import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DonorDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Welcome, <span className="text-blood-red">Donor</span></h1>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-gray-400 mb-2">Total Donations</h3>
                        <p className="text-4xl font-bold">0</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-gray-400 mb-2">Last Donation</h3>
                        <p className="text-xl font-semibold">--</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-gray-400 mb-2">Next Eligible Date</h3>
                        <p className="text-xl font-semibold text-green-400">Available Now</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4">Donation History</h2>
                        <div className="text-center py-8 text-gray-500">
                            No recent donations found.
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4">Urgent Requests Nearby</h2>
                        <div className="text-center py-8 text-gray-500">
                            No urgent requests at the moment.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorDashboard;
