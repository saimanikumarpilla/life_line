import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';

const RecipientDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/recipient-login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch matched donors
        const fetchDonors = async () => {
            try {
                if (!parsedUser.bloodGroup) return;

                const q = query(
                    collection(db, "donors_list"),
                    where("bloodGroup", "==", parsedUser.bloodGroup)
                );

                const querySnapshot = await getDocs(q);
                const donorList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDonors(donorList);
            } catch (error) {
                console.error("Error fetching donors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDonors();
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Patient <span className="text-blood-red">Dashboard</span></h1>
                        <p className="text-gray-400 mt-1">Welcome, {user.fullName}</p>
                    </div>
                    <div className="glass-card px-4 py-2 text-center">
                        <span className="block text-xs text-gray-400">Patient Blood Group</span>
                        <span className="text-xl font-bold text-blood-red">{user.bloodGroup}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Nearest Blood Bank Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-200">Nearest Blood Bank Details</h2>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card p-6 border-l-4 border-blood-red"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Central City Blood Bank</h3>
                                    <p className="text-gray-400 mb-1">123 Healthcare Ave, Medical District</p>
                                    <p className="text-gray-400 mb-4">Distance: <span className="text-white font-medium">2.5 km</span></p>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">●</span>
                                            <span>Open 24/7</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            +91 1800-LIFE-LINE
                                        </div>
                                    </div>
                                </div>
                                <button className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blood-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
                                <button className="flex-1 btn-primary py-2 text-sm">Request Stock</button>
                                <button className="flex-1 border border-white/20 rounded-lg hover:bg-white/5 py-2 text-sm transition-colors">Get Directions</button>
                            </div>
                        </motion.div>

                        {/* Additional Map Placeholder or Info can go here */}
                    </div>

                    {/* Matched Donors Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-200">Matched Donors ({donors.length})</h2>
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-gray-400">Searching for donors...</p>
                            ) : donors.length > 0 ? (
                                donors.map((donor, index) => (
                                    <motion.div
                                        key={donor.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="glass-card p-4 flex justify-between items-center group hover:bg-white/5 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center text-lg font-bold text-blood-red border border-red-500/30">
                                                {donor.bloodGroup}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white group-hover:text-blood-red transition-colors">{donor.fullName}</h4>
                                                <p className="text-xs text-gray-400">{donor.nearestTown || donor.district || 'Location N/A'}</p>
                                                <p className="text-xs text-gray-500">Last Donated: {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {/* We shouldn't show exact phone number publicly usually, but for this 'matched' dashboard context, maybe? 
                                                Or a 'Contact' button. The image says 'donors details', so assume contact info is wanted. */}
                                            <button className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-sm hover:bg-green-500/20 transition-all">
                                                Contact
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="glass-card p-8 text-center">
                                    <p className="text-gray-400">No donors found with blood group {user.bloodGroup} yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipientDashboard;
