import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import BloodContainer from '../components/BloodContainer';
import RequestBlood from '../components/RequestBlood';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [hospitalLocation, setHospitalLocation] = useState({ district: '', town: '' });
    const [localInventory, setLocalInventory] = useState({
        "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchHospitalAndInventory(parsedUser.email);
    }, [navigate]);

    const fetchHospitalAndInventory = async (email) => {
        if (!db || !email) return;
        try {
            // 1. Get Hospital Location
            const hospitalQ = query(collection(db, "hospitals_list"), where("email", "==", email));
            const hospitalSnap = await getDocs(hospitalQ);

            if (hospitalSnap.empty) {
                console.error("Hospital profile not found.");
                setLoading(false);
                return;
            }

            const hospitalData = hospitalSnap.docs[0].data();
            const { district, town } = hospitalData;
            setHospitalLocation({ district, town });

            // 2. Fetch Blood Banks in same location
            if (district && town) {
                const banksQ = query(
                    collection(db, "blood_banks_list"),
                    where("district", "==", district),
                    where("town", "==", town)
                );
                const banksSnap = await getDocs(banksQ);

                let aggregated = {
                    "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
                };

                banksSnap.forEach(doc => {
                    const bankData = doc.data();
                    if (bankData.inventory) {
                        Object.keys(aggregated).forEach(type => {
                            aggregated[type] += (parseInt(bankData.inventory[type]) || 0);
                        });
                    }
                });

                setLocalInventory(aggregated);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Hospital <span className="text-blood-red">Dashboard</span></h1>
                        {hospitalLocation.town && (
                            <p className="text-gray-400 mt-1">
                                Location: {hospitalLocation.town}, {hospitalLocation.district}
                            </p>
                        )}
                    </div>
                </div>

                {/* Real-time Inventory Section */}
                <div className="glass-card p-8">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Real-Time Blood Availability
                        </h2>
                        <span className="text-sm text-gray-400">Aggregated from local blood banks</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading inventory data...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-8 gap-y-12 justify-items-center">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => {
                                const count = localInventory[type] || 0;
                                // Assume 50 units is "full" tank for visualization
                                const percentage = Math.min((count / 50) * 100, 100);

                                return (
                                    <BloodContainer
                                        key={type}
                                        type={type}
                                        liters={`${count} Units`}
                                        percentage={percentage}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="text-gray-400 mb-2">Active Requests</h3>
                        <p className="text-4xl font-bold">0</p>
                    </div>

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

                {/* Request Feature Section */}
                <div id="request-blood-section">
                    <RequestBlood />
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Quick Actions</h2>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/5">
                            Update Bed Availability
                        </button>
                    </div>
                </div>

                {/* History Table */}
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
