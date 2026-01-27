import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HospitalDashboard = () => {
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
                    <h1 className="text-3xl font-bold">Hospital <span className="text-blood-red">Dashboard</span></h1>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link to="/inventory" className="glass-card p-6 hover:bg-white/5 transition-colors cursor-pointer group">
                        <h3 className="text-gray-400 mb-2 group-hover:text-white">Active Requests</h3>
                        <p className="text-4xl font-bold">0</p>
                    </Link>

                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Units Required</h3>
                        <p className="text-4xl font-bold text-red-500">0</p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Pending Fulfillment</h3>
                        <p className="text-4xl font-bold text-yellow-500">0</p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Total Received</h3>
                        <p className="text-4xl font-bold text-green-500">0</p>
                    </div>
                </div>

                <div className="glass-card p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Quick Actions</h2>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/inventory" className="btn-primary">
                            Request Blood Units
                        </Link>
                        <button className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/5">
                            Update Bed Availability
                        </button>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Request History</h2>
                    <table className="w-full text-left text-gray-300">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="pb-3">Request ID</th>
                                <th className="pb-3">Blood Group</th>
                                <th className="pb-3">Units</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-gray-500">
                                    No requests found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
