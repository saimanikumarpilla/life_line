import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
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
    const [hospitalDocId, setHospitalDocId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myRequests, setMyRequests] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchHospitalLocation(parsedUser.email);
    }, [navigate]);

    useEffect(() => {
        if (!hospitalLocation.district || !hospitalLocation.town) return;

        const banksQ = query(
            collection(db, "blood_banks_list"),
            where("district", "==", hospitalLocation.district),
            where("town", "==", hospitalLocation.town)
        );

        const unsubscribe = onSnapshot(banksQ, (snapshot) => {
            let aggregated = {
                "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
            };

            snapshot.forEach(doc => {
                const bankData = doc.data();
                if (bankData.inventory) {
                    Object.keys(aggregated).forEach(type => {
                        aggregated[type] += (parseInt(bankData.inventory[type]) || 0);
                    });
                }
            });

            setLocalInventory(aggregated);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [hospitalLocation]);

    const fetchHospitalLocation = async (email) => {
        if (!db || !email) return;
        try {
            const hospitalQ = query(collection(db, "hospitals_list"), where("email", "==", email));
            const hospitalSnap = await getDocs(hospitalQ);

            if (hospitalSnap.empty) {
                console.error("Hospital profile not found.");
                setLoading(false);
                return;
            }

            const hospitalDoc = hospitalSnap.docs[0];
            setHospitalDocId(hospitalDoc.id);
            const hospitalData = hospitalDoc.data();
            const { district, town } = hospitalData;
            setHospitalLocation({ district, town });

            if (!district || !town) {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    // Listen to My Requests
    useEffect(() => {
        if (!hospitalDocId) return;

        const q = query(collection(db, "hospital_requests"), where("hospitalId", "==", hospitalDocId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by date desc
            reqs.sort((a, b) => new Date(b.date) - new Date(a.date));
            setMyRequests(reqs);
        });

        return () => unsubscribe();
    }, [hospitalDocId]);

    const handleMarkReceived = async (request) => {
        if (!hospitalDocId) return;
        if (!window.confirm(`Confirm receipt of ${request.units} units of ${request.bloodGroup}? This will add to your inventory.`)) return;

        try {
            const batchPromises = [];

            // 1. Update Request Status
            batchPromises.push(updateDoc(doc(db, "hospital_requests", request.id), {
                status: 'completed',
                completedAt: new Date().toISOString()
            }));

            // 2. Add to Inventory
            batchPromises.push(updateDoc(doc(db, "hospitals_list", hospitalDocId), {
                [`inventory.${request.bloodGroup}`]: increment(request.units)
            }));
            setLocalInventory(prev => ({
                ...prev,
                [request.bloodGroup]: (prev[request.bloodGroup] || 0) + request.units
            }));

            // 3. Add to History (received)
            // Create a subcollection 'history' for the hospital if not exists
            const historyRef = collection(db, "hospitals_list", hospitalDocId, "history");
            batchPromises.push(addDoc(historyRef, {
                bloodBankName: request.bloodBankName,
                bloodBankId: request.bloodBankId,
                bloodGroup: request.bloodGroup,
                units: request.units,
                date: new Date().toISOString(),
                type: 'received'
            }));

            await Promise.all(batchPromises);
            alert("Blood Received! Inventory Updated.");
        } catch (error) {
            console.error("Error receiving blood:", error);
            alert("Failed to update records.");
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
                    <h2 className="text-xl font-bold mb-4">Request History & Status</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-white/10 text-xs uppercase text-gray-500">
                                    <th className="pb-3">Bank Name</th>
                                    <th className="pb-3">Blood Group</th>
                                    <th className="pb-3">Units</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {myRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    myRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-white/5">
                                            <td className="py-3 font-semibold">{req.bloodBankName}</td>
                                            <td className="py-3 text-blood-red font-bold">{req.bloodGroup}</td>
                                            <td className="py-3">{req.units}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    req.status === 'approved' ? 'bg-blue-500/20 text-blue-500' :
                                                        req.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                            'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    {req.status === 'approved' ? 'Shipped' : req.status}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                {req.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleMarkReceived(req)}
                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded font-bold transition-colors"
                                                    >
                                                        Mark Received
                                                    </button>
                                                )}
                                                {req.status === 'pending' && <span className="text-xs text-gray-500">Waiting for approval...</span>}
                                                {req.status === 'rejected' && <span className="text-xs text-red-400">Request Rejected</span>}
                                                {req.status === 'completed' && <span className="text-xs text-green-400">Received on {new Date(req.completedAt).toLocaleDateString()}</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
