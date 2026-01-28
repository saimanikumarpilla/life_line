
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { compressImage } from '../utils/imageCompressor';
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
    const [hospitalsList, setHospitalsList] = useState([]);
    const [bloodBanksList, setBloodBanksList] = useState([]);
    const [userLoginsList, setUserLoginsList] = useState([]);
    const [recipientsList, setRecipientsList] = useState([]);

    // System Status State
    const [systemStatus, setSystemStatus] = useState({
        platform: 'Online',
        dbConnection: 'Checking...',
        lastActivity: 'N/A'
    });

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoCaption, setPhotoCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);

    const fetchPhotos = async () => {
        if (!db) return;
        try {
            const q = query(collection(db, "camp_photos"), orderBy("createdAt", "desc"), limit(20));
            const snapshot = await getDocs(q);
            setUploadedPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
            // Compress and convert to Base64
            const base64Url = await compressImage(photoFile);

            await addDoc(collection(db, "camp_photos"), {
                url: base64Url,
                caption: photoCaption,
                uploadedBy: 'admin',
                createdAt: new Date().toISOString()
            });
            alert("Photo Added Successfully!");
            setPhotoFile(null);
            setPhotoCaption('');
            fetchPhotos(); // Refresh list
            e.target.reset(); // Reset form to clear file input
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
            fetchPhotos(); // Refresh list
        } catch (error) {
            console.error("Error deleting photo:", error);
            alert("Failed to delete photo");
        }
    };

    const handleDeleteUser = async (collectionName, id) => {
        if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, collectionName, id));
            alert("Record deleted successfully!");
            // Refresh data (simplified by triggering full fetch, optimized in real app)
            // Ideally we should just update local state, but calling fetchStats is easier for consistency
            // We need to move fetchStats definition outside useEffect to call it here, or just reload page.
            // For now, I'll update local state manually to avoid full re-fetch complexity or moving the function.
            if (collectionName === "donors_list") setDonorsList(prev => prev.filter(item => item.id !== id));
            if (collectionName === "hospitals_list") setHospitalsList(prev => prev.filter(item => item.id !== id));
            if (collectionName === "blood_banks_list") setBloodBanksList(prev => prev.filter(item => item.id !== id));
            if (collectionName === "login_details") setUserLoginsList(prev => prev.filter(item => item.id !== id));
            if (collectionName === "recipients_temp") setRecipientsList(prev => prev.filter(item => item.id !== id));

            // Also update stats for immediate feedback
            setStats(prev => {
                if (collectionName === "donors_list") return { ...prev, donors: prev.donors - 1 };
                if (collectionName === "hospitals_list") return { ...prev, hospitals: prev.hospitals - 1 };
                if (collectionName === "blood_banks_list") return { ...prev, bloodBanks: prev.bloodBanks - 1 };
                return prev;
            });

        } catch (error) {
            console.error("Error deleting record:", error);
            alert("Failed to delete record: " + error.message);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));

        // Initial Fetch
        fetchPhotos();

        const fetchStats = async () => {
            try {
                // Fetch Donors
                const donorsSnapshot = await getDocs(collection(db, "donors_list"));
                const donors = donorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDonorsList(donors);

                // Fetch Hospitals
                const hospitalsSnapshot = await getDocs(collection(db, "hospitals_list"));
                const hospitals = hospitalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHospitalsList(hospitals);

                // Fetch Blood Banks
                const banksSnapshot = await getDocs(collection(db, "blood_banks_list"));
                const banks = banksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBloodBanksList(banks);

                // Fetch Login Details (Temporary Logins)
                const loginsSnapshot = await getDocs(collection(db, "login_details"));
                const logins = loginsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUserLoginsList(logins);

                // Fetch Temporary Recipient Logins
                // Fetch Temporary Recipient Logins
                const recipientsSnapshot = await getDocs(collection(db, "recipients_temp"));
                const recipients = recipientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecipientsList(recipients);

                setStats({
                    donors: donorsSnapshot.size,
                    hospitals: hospitalsSnapshot.size,
                    bloodBanks: banksSnapshot.size,
                    requests: 0 // Placeholder logic
                });

                // Calculate Last Activity
                const allItems = [...donors, ...hospitals, ...banks, ...logins, ...recipients];
                let mostRecent = null;
                if (allItems.length > 0) {
                    allItems.sort((a, b) => new Date(b.createdAt || b.loginTime || 0) - new Date(a.createdAt || a.loginTime || 0));
                    const latest = allItems[0];
                    mostRecent = latest.createdAt || latest.loginTime;
                }

                setSystemStatus({
                    platform: 'Online',
                    dbConnection: 'Healthy',
                    lastActivity: mostRecent ? new Date(mostRecent).toLocaleString() : 'No recent activity'
                });

            } catch (error) {
                console.error("Error fetching stats:", error);
                setSystemStatus(prev => ({ ...prev, dbConnection: 'Error' }));
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

                {/* Add Camp Photo Section */}
                <div className="glass-card p-6 mb-8 border border-blood-red/20">
                    <h2 className="text-xl font-bold mb-4">Add Camp Photo</h2>
                    <form onSubmit={handleAddPhoto} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-400 mb-1">Upload Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhotoFile(e.target.files[0])}
                                className="glass-input w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blood-red/20 file:text-blood-red hover:file:bg-blood-red/30 text-white"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-400 mb-1">Caption</label>
                            <input
                                type="text"
                                value={photoCaption}
                                onChange={(e) => setPhotoCaption(e.target.value)}
                                className="glass-input w-full"
                                placeholder="Brief description..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="btn-primary whitespace-nowrap px-6 py-2 h-[42px] disabled:opacity-50"
                        >
                            {isUploading ? 'Uploading...' : 'Add Photo'}
                        </button>
                    </form>
                </div>

                {/* Manage Photos */}
                {uploadedPhotos.length > 0 && (
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">Manage Uploaded Photos</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {uploadedPhotos.map((photo) => (
                                <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video">
                                    <img
                                        src={photo.url}
                                        alt={photo.caption}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                            title="Delete Photo"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    {photo.caption && (
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-xs text-center text-white truncate">
                                            {photo.caption}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                    <th className="pb-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donorsList.length > 0 ? (
                                    donorsList.map((donor) => (
                                        <tr key={donor.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
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
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser("donors_list", donor.id)}
                                                    className="text-red-500 hover:text-red-400 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-500">
                                            No donors registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Hospitals List Table */}
                <div id="hospitals-list" className="glass-card p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Registered Hospitals</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="pb-3 px-4">Hospital Name</th>
                                    <th className="pb-3 px-4">Contact</th>
                                    <th className="pb-3 px-4">HFR ID</th>
                                    <th className="pb-3 px-4">Location</th>
                                    <th className="pb-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hospitalsList.length > 0 ? (
                                    hospitalsList.map((hospital) => (
                                        <tr key={hospital.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{hospital.hospitalName}</td>
                                            <td className="py-3 px-4">{hospital.contactNumber}</td>
                                            <td className="py-3 px-4">{hospital.hfrId}</td>
                                            <td className="py-3 px-4">{hospital.town}, {hospital.district}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser("hospitals_list", hospital.id)}
                                                    className="text-red-500 hover:text-red-400 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No hospitals registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Blood Banks List Table */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Blood Banks</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="pb-3 px-4">Name</th>
                                    <th className="pb-3 px-4">Category</th>
                                    <th className="pb-3 px-4">Contact</th>
                                    <th className="pb-3 px-4">Location</th>
                                    <th className="pb-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bloodBanksList.length > 0 ? (
                                    bloodBanksList.map((bank) => (
                                        <tr key={bank.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{bank.bloodBankName}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                                                    {bank.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{bank.contactNumber}</td>
                                            <td className="py-3 px-4">{bank.town}, {bank.district}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser("blood_banks_list", bank.id)}
                                                    className="text-red-500 hover:text-red-400 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No blood banks registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Logins (Temporary Logins) Table */}
                <div id="registered-users" className="glass-card p-6 mb-8 border border-yellow-500/20">
                    <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                        <span>Registered User Accounts</span>
                        <span className="text-xs text-gray-400 font-normal">Donors, Hospitals, Banks</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="pb-3 px-4">Email</th>
                                    <th className="pb-3 px-4">User Type</th>
                                    <th className="pb-3 px-4">Password (Stored)</th>
                                    <th className="pb-3 px-4">Created At</th>
                                    <th className="pb-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userLoginsList.length > 0 ? (
                                    userLoginsList.map((login) => (
                                        <tr key={login.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{login.email}</td>
                                            <td className="py-3 px-4 capitalize">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${login.userType === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                    login.userType === 'donor' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                    }`}>
                                                    {login.userType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-sm text-gray-400">{login.password}</td>
                                            <td className="py-3 px-4 text-sm text-gray-400">
                                                {login.createdAt ? new Date(login.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser("login_details", login.id)}
                                                    className="text-red-500 hover:text-red-400 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No logins recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recipient Logins (Temporary) Table */}
                <div id="system-logs" className="glass-card p-6 mb-8 border border-purple-500/20">
                    <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                        <span>Temporary Recipient Logins</span>
                        <span className="text-xs text-gray-400 font-normal">Session-based Access</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="pb-3 px-4">Patient Name</th>
                                    <th className="pb-3 px-4">Blood Group</th>
                                    <th className="pb-3 px-4">Phone</th>
                                    <th className="pb-3 px-4">Email</th>
                                    <th className="pb-3 px-4">Login Time</th>
                                    <th className="pb-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipientsList.length > 0 ? (
                                    recipientsList.map((recipient) => (
                                        <tr key={recipient.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                            <td className="py-3 px-4 font-medium text-white">{recipient.fullName}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 rounded bg-blood-red/20 text-blood-red text-xs font-bold border border-blood-red/30">
                                                    {recipient.bloodGroup}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{recipient.phone}</td>
                                            <td className="py-3 px-4">{recipient.email}</td>
                                            <td className="py-3 px-4 text-sm text-gray-400">
                                                {recipient.loginTime ? new Date(recipient.loginTime).toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser("recipients_temp", recipient.id)}
                                                    className="text-red-500 hover:text-red-400 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-500">
                                            No temporary logins recorded.
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
                                <span className="text-green-400 text-sm font-semibold">{systemStatus.platform}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span>Database Connection</span>
                                <span className={`text-sm font-semibold ${systemStatus.dbConnection === 'Healthy' ? 'text-green-400' : 'text-red-400'}`}>
                                    {systemStatus.dbConnection}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span>Last Activity</span>
                                <span className="text-gray-400 text-sm">{systemStatus.lastActivity}</span>
                            </div>
                        </div>
                    </div>

                    {/* Management Links */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4">Administrative Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => scrollToSection('registered-users')} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">Manage Users</h3>
                                <p className="text-xs text-gray-400 mt-1">Jump to User Accounts</p>
                            </button>
                            <button onClick={() => scrollToSection('hospitals-list')} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">Manage Hospitals</h3>
                                <p className="text-xs text-gray-400 mt-1">Jump to Hospital List</p>
                            </button>
                            <button onClick={() => scrollToSection('system-logs')} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
                                <h3 className="font-semibold text-white">System Logs</h3>
                                <p className="text-xs text-gray-400 mt-1">View Recent Logins</p>
                            </button>
                            <button onClick={() => alert("Broadcast Alert feature coming soon!")} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
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
