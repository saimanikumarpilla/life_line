import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc, deleteDoc, updateDoc, doc, query, where, getDocs, onSnapshot, orderBy, increment } from 'firebase/firestore';
import { compressImage } from '../utils/imageCompressor';
import { db } from '../firebase';
import BloodContainer from '../components/BloodContainer';
import RequestBlood from '../components/RequestBlood';

const BloodBankDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Inventory State
    const [inventory, setInventory] = useState({
        "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    });
    const [bankDocId, setBankDocId] = useState(null);
    const [bankDetails, setBankDetails] = useState(null);
    const [donationHistory, setDonationHistory] = useState([]);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoCaption, setPhotoCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);

    // Donation Requests State
    const [donationRequests, setDonationRequests] = useState([]);
    const [reschedulingId, setReschedulingId] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [completingRequestId, setCompletingRequestId] = useState(null);
    const [unitsCollected, setUnitsCollected] = useState(1);

    // Hospital Requests State
    const [hospitalRequests, setHospitalRequests] = useState([]);

    const fetchInventoryAndHistory = async (email) => {
        if (!db || !email) return;
        try {
            const q = query(collection(db, "blood_banks_list"), where("email", "==", email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const bankId = snapshot.docs[0].id;
                setBankDocId(bankId);
                const docData = snapshot.docs[0].data();
                setBankDetails(docData);
                if (docData.inventory) {
                    setInventory(docData.inventory);
                }

                // Fetch History
                const historyRef = collection(db, "blood_banks_list", bankId, "history");
                // Note: Indexing might be required for orderBy, if so, remove orderBy and sort client-side
                const historySnapshot = await getDocs(historyRef);
                const historyData = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
                setDonationHistory(historyData);
            }
        } catch (error) {
            console.error("Error fetching inventory/history:", error);
        }
    };



    const fetchPhotos = async (email) => {
        if (!db || !email) return;
        try {
            const q = query(collection(db, "camp_photos"), where("uploadedBy", "==", email));
            const snapshot = await getDocs(q);
            const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setUploadedPhotos(photos);
        } catch (error) {
            console.error("Error fetching photos:", error);
        }
    };

    const handleAddPhoto = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        if (!photoFile) {
            alert("Please select an image file");
            setIsUploading(false);
            return;
        }
        try {
            const base64Url = await compressImage(photoFile);
            await addDoc(collection(db, "camp_photos"), {
                url: base64Url,
                caption: photoCaption,
                uploadedBy: user.email,
                createdAt: new Date().toISOString()
            });
            alert("Photo Added Successfully!");
            setPhotoFile(null);
            setPhotoCaption('');
            fetchPhotos(user.email);
            e.target.reset();
        } catch (error) {
            console.error("Error adding photo:", error);
            alert("Error: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeletePhoto = async (id) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return;
        try {
            await deleteDoc(doc(db, "camp_photos", id));
            alert("Photo deleted successfully!");
            fetchPhotos(user.email);
        } catch (error) {
            console.error("Error deleting photo:", error);
            alert("Failed to delete photo");
        }
    };

    // Donation Request Logic
    useEffect(() => {
        const q = query(collection(db, "donation_requests"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter: Show Pending, Accepted (by me), or recently Missed
            requests = requests.filter(r => {
                if (r.status === 'donated' || r.status === 'rejected') return false;
                if (r.status === 'accepted' || r.status === 'not_attended') return r.acceptedBy === user?.email || !r.acceptedBy;
                return true;
            });

            requests.sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate));
            setDonationRequests(requests);
        });

        // Hospital Requests Listener
        let unsubscribeHospital;
        if (bankDocId) {
            const hq = query(collection(db, "hospital_requests"), where("bloodBankId", "==", bankDocId));
            unsubscribeHospital = onSnapshot(hq, (snapshot) => {
                let hRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Filter active ones or recent history
                hRequests = hRequests.filter(r => r.status === 'pending' || r.status === 'approved');
                // Sort pending first, then by date
                hRequests.sort((a, b) => {
                    if (a.status === b.status) return new Date(b.date) - new Date(a.date);
                    return a.status === 'pending' ? -1 : 1;
                });
                setHospitalRequests(hRequests);
            });
        }

        return () => {
            unsubscribe();
            if (unsubscribeHospital) unsubscribeHospital();
        };
    }, [user, bankDetails, bankDocId]);

    const handleAcceptRequest = async (request) => {
        try {
            const reqRef = doc(db, "donation_requests", request.id);
            await updateDoc(reqRef, {
                status: 'accepted',
                acceptedBy: user.email,
                bankName: bankDetails?.hospitalName || 'Blood Bank'
            });
            // alert("Appointment Accepted!");
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Failed to accept request.");
        }
    };

    const handleDeclineRequest = async (request) => {
        if (!window.confirm("Decline this appointment?")) return;
        try {
            const reqRef = doc(db, "donation_requests", request.id);
            await updateDoc(reqRef, {
                status: 'rejected',
                rejectedBy: user.email
            });
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };

    const handleMissedRequest = async (request) => {
        if (!window.confirm("Mark as Not Attended?")) return;
        try {
            const reqRef = doc(db, "donation_requests", request.id);
            await updateDoc(reqRef, {
                status: 'not_attended'
            });
        } catch (error) {
            console.error("Error marking missed:", error);
        }
    };

    const startReschedule = (request) => {
        setReschedulingId(request.id);
        // Pre-fill with existing date formatted for date input (YYYY-MM-DD)
        const date = new Date(request.preferredDate);
        setRescheduleDate(date.toISOString().split('T')[0]);
    };

    const submitReschedule = async (request) => {
        if (!rescheduleDate) return;
        try {
            const newDateObj = new Date(rescheduleDate);
            const reqRef = doc(db, "donation_requests", request.id);
            await updateDoc(reqRef, {
                preferredDate: newDateObj.toISOString(),
                status: 'accepted', // Assuming if blood bank reschedules, it's confirmed
                acceptedBy: user.email,
                bankName: bankDetails?.hospitalName || 'Blood Bank',
                rescheduledBy: 'bank'
            });
            setReschedulingId(null);
            alert("Resheduled successfully");
        } catch (error) {
            console.error("Error rescheduling:", error);
        }
    };

    const handleCompleteDonation = async (request, units = 1) => {
        // if (!window.confirm(`Confirm donation of ${units} unit(s)?`)) return; // Confirmation moved to UI

        try {
            const batchPromises = [];
            const timestamp = new Date().toISOString();

            // 1. Update Request Status
            batchPromises.push(updateDoc(doc(db, "donation_requests", request.id), {
                status: 'donated',
                unitsCollected: units,
                completedAt: timestamp
            }));

            // 2. Add to Donor History
            if (request.donorId) {
                const donorHistoryRef = collection(db, "donors_list", request.donorId, "history");
                batchPromises.push(addDoc(donorHistoryRef, {
                    date: timestamp,
                    location: bankDetails?.hospitalName || "Blood Bank",
                    units: units,
                    bloodGroup: request.bloodGroup
                }));

                // Update last donation date
                batchPromises.push(updateDoc(doc(db, "donors_list", request.donorId), {
                    lastDonationDate: timestamp
                }));
            }

            // 3. Add to Blood Bank History
            if (bankDocId) {
                const bankHistoryRef = collection(db, "blood_banks_list", bankDocId, "history");
                batchPromises.push(addDoc(bankHistoryRef, {
                    donorName: request.donorName,
                    donorId: request.donorId,
                    bloodGroup: request.bloodGroup,
                    units: units,
                    date: timestamp,
                    type: 'Incoming'
                }));
            }

            // 4. Update Inventory - Auto-increment
            if (request.bloodGroup && bankDocId) {
                batchPromises.push(updateDoc(doc(db, "blood_banks_list", bankDocId), {
                    [`inventory.${request.bloodGroup}`]: increment(units)
                }));
                setInventory(prev => ({
                    ...prev,
                    [request.bloodGroup]: (prev[request.bloodGroup] || 0) + units
                }));
            }

            await Promise.all(batchPromises);

            // Refresh local history
            fetchInventoryAndHistory(user.email);
            alert("Donation completed! Stocks & History updated.");

        } catch (error) {
            console.error("Error completing donation:", error);
            alert("Failed to update records.");
        }
    };

    const startCompletion = (request) => {
        setCompletingRequestId(request.id);
        setUnitsCollected(1);
    };

    const confirmDonation = async (request) => {
        if (unitsCollected < 1) {
            alert("Please enter a valid number of units.");
            return;
        }
        await handleCompleteDonation(request, unitsCollected);
        setCompletingRequestId(null);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchPhotos(parsedUser.email);
        fetchInventoryAndHistory(parsedUser.email);
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Blood Bank <span className="text-blood-red">Management</span></h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* My Inventory Management */}
                        <div className="glass-card p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">My Inventory Status</h2>
                            </div>

                            {/* Inventory Display */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-8 gap-y-12 justify-items-center mt-8">
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => {
                                    const count = inventory[type] || 0;
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
                        </div>

                        {/* Recent History Section */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4">Recent In-house Donations</h2>
                            {donationHistory.length === 0 ? (
                                <div className="text-center py-4 text-gray-400">No donation history found.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-300">
                                        <thead className="border-b border-white/10 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="py-2">Date</th>
                                                <th className="py-2">Donor</th>
                                                <th className="py-2">Group</th>
                                                <th className="py-2">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {donationHistory.slice(0, 10).map(item => (
                                                <tr key={item.id} className="hover:bg-white/5">
                                                    <td className="py-2">{item.date ? new Date(item.date).toLocaleDateString() : '--'}</td>
                                                    <td className="py-2">{item.donorName || 'Unknown'}</td>
                                                    <td className="py-2 font-bold text-blood-red">{item.bloodGroup}</td>
                                                    <td className="py-2">{item.type || 'Incoming'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Search Blood In Other Locations (Replaced with RequestBlood) */}
                        <div id="request-blood-section">
                            <RequestBlood />
                        </div>
                    </div>

                    {/* Quick Actions & Notifications */}
                    <div className="space-y-6">
                        {/* Donation Requests Management (Replaces Actions & Alerts) */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4">Appointments ({donationRequests.length})</h2>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {donationRequests.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No active requests.</p>
                                ) : (
                                    donationRequests.map((req) => (
                                        <div key={req.id} className={`p-4 rounded-lg border relative group transition-colors ${req.status === 'not_attended' ? 'bg-red-900/10 border-red-500/30' :
                                            req.status === 'accepted' ? 'bg-green-900/10 border-green-500/30' :
                                                'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white max-w-[70%] truncate">{req.donorName}</h4>
                                                <span className="text-blood-red font-bold text-lg">{req.bloodGroup}</span>
                                            </div>

                                            {/* Reschedule Input Mode */}
                                            {reschedulingId === req.id ? (
                                                <div className="my-2 bg-black/40 p-2 rounded">
                                                    <p className="text-xs text-gray-400 mb-1">Select New Date:</p>
                                                    <input
                                                        type="date"
                                                        value={rescheduleDate}
                                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white mb-2"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => submitReschedule(req)} className="text-xs bg-green-600 px-2 py-1 rounded">Save</button>
                                                        <button onClick={() => setReschedulingId(null)} className="text-xs bg-gray-600 px-2 py-1 rounded">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-gray-300 mb-1">
                                                        <span className="text-gray-500">Date:</span> {new Date(req.preferredDate).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm text-gray-300 mb-3">
                                                        <span className="text-gray-500">Loc:</span> {req.town}, {req.district}
                                                    </p>
                                                </>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {/* Actions based on Status */}

                                                {/* PENDING: Accept, Decline, Reschedule */}
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptRequest(req)}
                                                            className="flex-1 py-1 px-2 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineRequest(req)}
                                                            className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold"
                                                        >
                                                            Decline
                                                        </button>
                                                        <button
                                                            onClick={() => startReschedule(req)}
                                                            className="py-1 px-2 border border-white/20 hover:bg-white/10 rounded text-xs"
                                                            title="Reschedule"
                                                        >
                                                            📅
                                                        </button>
                                                    </>
                                                )}

                                                {/* ACCEPTED: Mark Donated, Not Attended, Reschedule */}
                                                {req.status === 'accepted' && (
                                                    <>
                                                        {completingRequestId === req.id ? (
                                                            <div className="w-full bg-black/40 p-2 rounded mb-2 col-span-full">
                                                                <p className="text-xs text-gray-400 mb-1">Units Collected:</p>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={unitsCollected}
                                                                    onChange={(e) => setUnitsCollected(parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white mb-2"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => confirmDonation(req)}
                                                                        className="flex-1 py-1 px-2 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setCompletingRequestId(null)}
                                                                        className="flex-1 py-1 px-2 bg-gray-600 hover:bg-gray-700 rounded text-xs font-semibold"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => startCompletion(req)}
                                                                className="flex-1 py-1 px-2 bg-blood-red hover:bg-red-700 rounded text-xs font-semibold"
                                                            >
                                                                Mark Donated
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleMissedRequest(req)}
                                                            className="py-1 px-2 bg-gray-600 hover:bg-gray-700 rounded text-xs font-semibold"
                                                            title="Mark Not Attended"
                                                        >
                                                            Missed
                                                        </button>
                                                        <button
                                                            onClick={() => startReschedule(req)}
                                                            className="py-1 px-2 border border-white/20 hover:bg-white/10 rounded text-xs"
                                                            title="Reschedule"
                                                        >
                                                            📅
                                                        </button>
                                                    </>
                                                )}

                                                {/* NOT ATTENDED: Reschedule Only */}
                                                {req.status === 'not_attended' && (
                                                    <div className="w-full flex items-center justify-between">
                                                        <span className="text-xs text-red-400 italic">Donor Missed Appointment</span>
                                                        <button
                                                            onClick={() => startReschedule(req)}
                                                            className="py-1 px-2 border border-white/20 hover:bg-white/10 rounded text-xs"
                                                        >
                                                            Reschedule
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Hospital Requests Section */}
                        <div className="glass-card p-6 mt-6">
                            <h2 className="text-xl font-bold mb-4">Hospital Requests ({hospitalRequests.length})</h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {hospitalRequests.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No incoming requests from hospitals.</p>
                                ) : (
                                    hospitalRequests.map(req => (
                                        <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-lg text-white">{req.hospitalName}</h4>
                                                    <p className="text-xs text-gray-400">Requesting: <span className="text-blood-red font-bold text-sm">{req.units} Units of {req.bloodGroup}</span></p>
                                                    <p className="text-xs text-gray-500">{new Date(req.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded font-bold uppercase ${req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    req.status === 'approved' ? 'bg-blue-500/20 text-blue-500' : ''
                                                    }`}>
                                                    {req.status === 'approved' ? 'Shipped' : req.status}
                                                </div>
                                            </div>

                                            {req.status === 'pending' && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleApproveHospitalRequest(req)}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded"
                                                    >
                                                        Approve & Send
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectHospitalRequest(req)}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add Camp Photo Widget */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4">Add Camp Photo</h2>
                            <form onSubmit={handleAddPhoto} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Upload Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setPhotoFile(e.target.files[0])}
                                        className="glass-input w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blood-red/20 file:text-blood-red hover:file:bg-blood-red/30 text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={photoCaption}
                                        onChange={(e) => setPhotoCaption(e.target.value)}
                                        className="glass-input w-full"
                                        placeholder="Caption"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="btn-primary w-full py-2 disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BloodBankDashboard;
