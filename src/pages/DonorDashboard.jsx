import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, addDoc, updateDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DonorDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [donorProfile, setDonorProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Appointment State
    const [appointmentDate, setAppointmentDate] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [activeRequests, setActiveRequests] = useState([]);
    const [donationHistory, setDonationHistory] = useState([]);
    const [editingRequestId, setEditingRequestId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            if (parsedUser.profileId) {
                try {
                    // Fetch full profile
                    const docRef = doc(db, "donors_list", parsedUser.profileId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setDonorProfile({ id: docSnap.id, ...docSnap.data() });

                        // Fetch History
                        const historyRef = collection(db, "donors_list", parsedUser.profileId, "history");
                        const historySnap = await getDocs(historyRef);
                        const historyData = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        // Sort history by date descending
                        historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
                        setDonationHistory(historyData);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, [navigate]);

    // Listen for active requests
    useEffect(() => {
        if (!user?.profileId) return;

        const q = query(
            collection(db, "donation_requests"),
            where("donorId", "==", user.profileId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            // Show requests that are not completed (donated) or rejected, unless we want to show history of requests too
            // Let's show pending, accepted, rescheduled, not_attended
            setActiveRequests(requests.filter(r => ['pending', 'accepted', 'rescheduled', 'not_attended'].includes(r.status)));
        });

        return () => unsubscribe();
    }, [user]);

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!appointmentDate) {
            alert("Please select a date for donation.");
            return;
        }
        if (!donorProfile) {
            alert("Donor profile not found. Please contact support.");
            return;
        }

        // Eligibility Check (3 months)
        if (donorProfile.lastDonationDate) {
            const lastDate = new Date(donorProfile.lastDonationDate);
            const nextEligibleDate = new Date(lastDate);
            nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);

            // Normalize time for fair date comparison
            nextEligibleDate.setHours(0, 0, 0, 0);
            const selectedDate = new Date(appointmentDate);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < nextEligibleDate) {
                alert(`You are not eligible to donate yet. Next eligible date: ${nextEligibleDate.toLocaleDateString()}`);
                return;
            }
        }

        setIsBooking(true);
        try {
            if (editingRequestId) {
                // Update existing request (Reschedule)
                const reqRef = doc(db, "donation_requests", editingRequestId);
                await updateDoc(reqRef, {
                    preferredDate: appointmentDate.toISOString(),
                    status: 'pending', // Reset status to pending on reschedule
                    rescheduledBy: 'donor',
                    updatedAt: new Date().toISOString()
                });
                alert("Appointment Rescheduled. Awaiting confirmation.");
                setEditingRequestId(null);
            } else {
                // New Request
                await addDoc(collection(db, "donation_requests"), {
                    donorId: donorProfile.id,
                    donorName: donorProfile.fullName,
                    bloodGroup: donorProfile.bloodGroup,
                    district: donorProfile.district,
                    town: donorProfile.nearestTown,
                    phone: donorProfile.phone,
                    preferredDate: appointmentDate.toISOString(),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
                alert("Appointment request sent successfully!");
            }
            setAppointmentDate(null);
        } catch (error) {
            console.error("Error booking appointment:", error);
            alert("Failed to process request.");
        } finally {
            setIsBooking(false);
        }
    };

    const handleReschedule = (request) => {
        setAppointmentDate(new Date(request.preferredDate));
        setEditingRequestId(request.id);
        // Scroll to the booking form
        document.getElementById("booking-form")?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingRequestId(null);
        setAppointmentDate(null);
    };

    if (loading) return <div className="min-h-screen pt-24 px-6 text-center">Loading profile...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome, <span className="text-blood-red">{donorProfile?.fullName || 'Donor'}</span></h1>
                        <p className="text-gray-400 mt-1">Blood Group: <span className="text-white font-bold">{donorProfile?.bloodGroup || '--'}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-gray-400 mb-2">Total Donations</h3>
                        <p className="text-4xl font-bold">{donationHistory.length}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-gray-400 mb-2">Last Donation</h3>
                        <p className="text-xl font-semibold">
                            {donorProfile?.lastDonationDate ? new Date(donorProfile.lastDonationDate).toLocaleDateString() : 'Never'}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6"
                    >
                        <h3 className="text-gray-400 mb-2">Status</h3>
                        <p className="text-xl font-semibold text-green-400">Active Donor</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Booking Section */}
                    <div id="booking-form" className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{editingRequestId ? 'Reschedule Appointment' : 'Book Donation Appointment'}</h2>
                            {editingRequestId && (
                                <button onClick={handleCancelEdit} className="text-sm text-gray-400 hover:text-white">Cancel</button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">Select a preferred date to donate blood at a nearby blood bank or camp.</p>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-300">Preferred Date</label>
                                <DatePicker
                                    selected={appointmentDate}
                                    onChange={(date) => setAppointmentDate(date)}
                                    className="glass-input w-full text-white cursor-pointer"
                                    placeholderText="Select Date"
                                    dateFormat="dd/MM/yyyy"
                                    minDate={new Date()}
                                />
                            </div>
                            <button
                                onClick={handleBookAppointment}
                                disabled={isBooking || !appointmentDate}
                                className="btn-primary w-full py-2 disabled:opacity-50"
                            >
                                {isBooking ? 'Processing...' : (editingRequestId ? 'Update Appointment' : 'Request Appointment')}
                            </button>
                        </div>

                        {/* Active Requests List */}
                        {activeRequests.length > 0 && (
                            <div className="mt-8 border-t border-white/10 pt-6">
                                <h3 className="text-lg font-bold mb-3">Your Appointments</h3>
                                <div className="space-y-3">
                                    {activeRequests.map(req => (
                                        <div key={req.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-sm">Request on {new Date(req.preferredDate).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-400">Status:
                                                        <span className={`ml-1 font-bold ${req.status === 'accepted' ? 'text-green-400' :
                                                                req.status === 'not_attended' ? 'text-red-400' :
                                                                    req.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                                                            }`}>
                                                            {req.status === 'not_attended' ? 'Missed' : req.status.toUpperCase()}
                                                        </span>
                                                    </p>
                                                    {req.bankName && <p className="text-xs text-gray-400">At: {req.bankName}</p>}
                                                </div>
                                                {/* Allow Reschedule only if pending, accepted or not_attended */}
                                                {(['pending', 'accepted', 'not_attended'].includes(req.status)) && (
                                                    <button
                                                        onClick={() => handleReschedule(req)}
                                                        className="text-xs border border-white/20 px-2 py-1 rounded hover:bg-white/10"
                                                    >
                                                        Reschedule
                                                    </button>
                                                )}
                                            </div>
                                            {req.status === 'accepted' && (
                                                <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded w-fit">
                                                    Please arrive by 9:00 AM - 5:00 PM
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4">Donation History</h2>
                        {donationHistory.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No recent donations found.
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {donationHistory.map((history) => (
                                    <div key={history.id} className="border-l-2 border-blood-red pl-4 py-1">
                                        <p className="font-bold">{history.location || 'Blood Bank'}</p>
                                        <p className="text-sm text-gray-400">{history.date ? new Date(history.date).toLocaleDateString() : 'Unknown Date'}</p>
                                        <p className="text-xs text-green-400">Units Donated: {history.units || 1} • {history.bloodGroup}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorDashboard;
