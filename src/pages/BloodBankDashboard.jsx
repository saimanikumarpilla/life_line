import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { compressImage } from '../utils/imageCompressor';
import { db } from '../firebase';

const BloodBankDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoCaption, setPhotoCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);

    const fetchPhotos = async (email) => {
        if (!db || !email) return;
        try {
            const q = query(collection(db, "camp_photos"), where("uploadedBy", "==", email));
            const snapshot = await getDocs(q);
            const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort to avoid index requirements
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
            // Compress and convert to Base64
            const base64Url = await compressImage(photoFile);

            await addDoc(collection(db, "camp_photos"), {
                url: base64Url,
                caption: photoCaption,
                uploadedBy: user.email || 'blood_bank',
                createdAt: new Date().toISOString()
            });
            alert("Photo Added Successfully!");
            setPhotoFile(null);
            setPhotoCaption('');
            fetchPhotos(user.email);
            e.target.reset(); // Reset form
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
