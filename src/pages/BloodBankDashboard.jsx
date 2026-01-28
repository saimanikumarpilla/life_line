import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc, deleteDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { compressImage } from '../utils/imageCompressor';
import { db } from '../firebase';
import { apDistricts, apTowns } from '../utils/apData';
import BloodContainer from '../components/BloodContainer';
import RequestBlood from '../components/RequestBlood';

const BloodBankDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Inventory State
    const [inventory, setInventory] = useState({
        "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    });
    const [isEditingInventory, setIsEditingInventory] = useState(false);
    const [editingInventory, setEditingInventory] = useState({});
    const [bankDocId, setBankDocId] = useState(null);

    // Search State
    const [searchDistrict, setSearchDistrict] = useState('');
    const [searchTown, setSearchTown] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoCaption, setPhotoCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);

    const fetchInventory = async (email) => {
        if (!db || !email) return;
        try {
            const q = query(collection(db, "blood_banks_list"), where("email", "==", email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setBankDocId(snapshot.docs[0].id);
                const docData = snapshot.docs[0].data();
                if (docData.inventory) {
                    setInventory(docData.inventory);
                    setEditingInventory(docData.inventory);
                }
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    };

    const handleInventorySave = async () => {
        if (!bankDocId) return;
        try {
            const bankRef = doc(db, "blood_banks_list", bankDocId);
            await updateDoc(bankRef, {
                inventory: editingInventory
            });
            setInventory(editingInventory);
            setIsEditingInventory(false);
            alert("Inventory updated successfully!");
        } catch (error) {
            console.error("Error updating inventory:", error);
            alert("Failed to update inventory.");
        }
    };

    const handleInventoryChange = (type, value) => {
        setEditingInventory(prev => ({
            ...prev,
            [type]: parseInt(value) || 0
        }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchDistrict || !searchTown) {
            alert("Please select both District and Town");
            return;
        }
        setIsSearching(true);
        try {
            const q = query(
                collection(db, "blood_banks_list"),
                where("district", "==", searchDistrict),
                where("town", "==", searchTown)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching blood banks:", error);
            alert("Error fetching search results");
        } finally {
            setIsSearching(false);
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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchPhotos(parsedUser.email);
        fetchInventory(parsedUser.email);
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
                                {!isEditingInventory ? (
                                    <button
                                        onClick={() => {
                                            setEditingInventory(inventory);
                                            setIsEditingInventory(true);
                                        }}
                                        className="text-sm text-blood-red hover:underline"
                                    >
                                        Update Stock
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditingInventory(false)}
                                            className="text-sm text-gray-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleInventorySave}
                                            className="text-sm font-bold text-green-500 hover:text-green-400"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Inventory Display: Toggle between Grid Inputs (Edit) and BloodContainer (View) */}
                            {isEditingInventory ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                                        <div key={type} className="bg-white/5 p-4 rounded-lg text-center border border-white/10 relative">
                                            <div className="text-2xl font-bold mb-1 text-blood-red">{type}</div>
                                            <div className="mt-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editingInventory[type] || 0}
                                                    onChange={(e) => handleInventoryChange(type, e.target.value)}
                                                    className="w-full bg-black/30 border border-white/20 rounded px-2 py-1 text-center text-white focus:border-blood-red outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
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
                            )}
                        </div>

                        {/* Search Blood In Other Locations (Replaced with RequestBlood) */}
                        <div id="request-blood-section">
                            <RequestBlood />
                        </div>
                    </div>

                    {/* Quick Actions & Notifications */}
                    <div className="space-y-6">
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

                        {/* Recent Uploads (Mini Gallery) */}
                        {uploadedPhotos.length > 0 && (
                            <div className="glass-card p-6">
                                <h2 className="text-xl font-bold mb-4">Your Uploads</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {uploadedPhotos.map((photo) => (
                                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video">
                                            <img
                                                src={photo.url}
                                                alt={photo.caption}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={() => handleDeletePhoto(photo.id)}
                                                    className="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors"
                                                    title="Delete Photo"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
