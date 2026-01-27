import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        donors: 0,
        hospitals: 0,
        bloodBanks: 0,
        requests: 0
    });
    const [donorsList, setDonorsList] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));

        const fetchStats = async () => {
            try {
                const donorsRef = collection(db, "donors_list");
                // Create a query against the collection.
                // orderBy might require an index, using simple getDocs first to ensure data flow
                const donorsSnapshot = await getDocs(donorsRef);

                const hospitalsSnapshot = await getDocs(collection(db, "hospitals_list"));
                const banksSnapshot = await getDocs(collection(db, "blood_banks_list"));

                setStats({
                    donors: donorsSnapshot.size,
                    hospitals: hospitalsSnapshot.size,
                    bloodBanks: banksSnapshot.size,
                    requests: 0 // Placeholder logic
                });

                const donors = donorsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDonorsList(donors);

            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();

    }, [navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin <span className="text-blood-red">Control Panel</span></h1>

                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card p-6 border-l-4 border-green-500">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Donors</h3>
                        <p className="text-4xl font-bold">{stats.donors}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-blue-500">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Registered Hospitals</h3>
                        <p className="text-4xl font-bold">{stats.hospitals}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-purple-500">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Blood Banks</h3>
                        <p className="text-4xl font-bold">{stats.bloodBanks}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-red-500">
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Active Requests</h3>
                        <p className="text-4xl font-bold">{stats.requests}</p>
                    </div>
                </div>

                {/* Donors List Table */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Recent Donors</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="pb-3 px-4">Name</th>
                                    <th className="pb-3 px-4">Blood Group</th>
                                    <th className="pb-3 px-4">Location</th>
                                    <th className="pb-3 px-4">Phone</th>
                                    <th className="pb-3 px-4">Last Donation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donorsList.length > 0 ? (
                                    donorsList.map((donor) => (
                                        <tr key={donor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{donor.fullName}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 rounded bg-blood-red/20 text-blood-red text-xs font-bold border border-blood-red/30">
                                                    {donor.bloodGroup}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{donor.district}, {donor.nearestTown}</td>
                                            <td className="py-3 px-4">{donor.phone}</td>
                                            <td className="py-3 px-4 text-sm text-gray-400">
                                                {donor.lastDonationDate
                                                    ? new Date(donor.lastDonationDate).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No donors registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Registrations */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4">System Overview</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span>Platform Status</span>
                                <span className="text-green-400 text-sm font-semibold">Online</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span>Database Connection</span>
                                <span className="text-green-400 text-sm font-semibold">Healthy</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span>Last Backup</span>
                                <span className="text-gray-400 text-sm">2 hours ago</span>
                            </div>
                        </div>
                    </div>

                    {/* Management Links */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4">Administrative Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">Manage Users</h3>
                                <p className="text-xs text-gray-400 mt-1">View/Edit registered users</p>
                            </button>
                            <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">Verify Hospitals</h3>
                                <p className="text-xs text-gray-400 mt-1">Approve pending registrations</p>
                            </button>
                            <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">System Logs</h3>
                                <p className="text-xs text-gray-400 mt-1">View access logs & errors</p>
                            </button>
                            <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">Broadcast Alert</h3>
                                <p className="text-xs text-gray-400 mt-1">Send notifications to all</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
