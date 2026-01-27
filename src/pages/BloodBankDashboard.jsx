import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BloodBankDashboard = () => {
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
                    <h1 className="text-3xl font-bold">Blood Bank <span className="text-blood-red">Management</span></h1>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Total Units Stored</h3>
                        <p className="text-4xl font-bold text-white">1,240</p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Units Dispatched</h3>
                        <p className="text-4xl font-bold text-blue-400">45</p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Pending Requests</h3>
                        <p className="text-4xl font-bold text-yellow-500">12</p>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Critical Low Stock</h3>
                        <p className="text-4xl font-bold text-red-500">A-</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inventory Management */}
                    <div className="glass-card p-6 lg:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Blood Inventory Status</h2>
                            <button className="text-sm text-blood-red hover:underline">Update Stock</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                                <div key={type} className="bg-white/5 p-4 rounded-lg text-center border border-white/10">
                                    <div className="text-2xl font-bold mb-1">{type}</div>
                                    <div className="text-sm text-gray-400">120 Units</div>
                                    <div className="w-full bg-gray-700 h-1.5 mt-3 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full w-[60%]"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions & Notifications */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4">Actions</h2>
                            <div className="space-y-3">
                                <button className="w-full py-2 btn-primary">Process Donation</button>
                                <button className="w-full py-2 border border-white/20 rounded-lg hover:bg-white/5">Organize Camp</button>
                                <button className="w-full py-2 border border-white/20 rounded-lg hover:bg-white/5">Dispatch Units</button>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></span>
                                    Urgent request for O- from City Hospital
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 shrink-0"></span>
                                    Stock low for AB- blood group
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0"></span>
                                    Donation Camp scheduled for tomorrow
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BloodBankDashboard;
