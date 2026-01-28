import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import RequestBlood from '../components/RequestBlood';
import { apDistricts, apTowns } from '../utils/apData';

const Inventory = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('my-stock'); // 'my-stock' or 'sourcing'

    // My Inventory State
    const [myInventory, setMyInventory] = useState({
        "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editBuffer, setEditBuffer] = useState({});
    const [hospitalDocId, setHospitalDocId] = useState(null);

    // Bank Search State
    const [searchDistrict, setSearchDistrict] = useState('');
    const [searchTown, setSearchTown] = useState('');
    const [bankResults, setBankResults] = useState([]);
    const [isSearchingBanks, setIsSearchingBanks] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.userType === 'hospital') {
            fetchMyInventory(parsedUser.email);
        }
    }, [navigate]);

    const fetchMyInventory = async (email) => {
        if (!db || !email) return;
        try {
            const q = query(collection(db, "hospitals_list"), where("email", "==", email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setHospitalDocId(snapshot.docs[0].id);
                const data = snapshot.docs[0].data();
                if (data.inventory) {
                    setMyInventory(data.inventory);
                    setEditBuffer(data.inventory);
                }
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    };

    const handleSaveInventory = async () => {
        if (!hospitalDocId) return;
        try {
            const hospitalRef = doc(db, "hospitals_list", hospitalDocId);
            await updateDoc(hospitalRef, {
                inventory: editBuffer
            });
            setMyInventory(editBuffer);
            setIsEditing(false);
            alert("Inventory updated successfully!");
        } catch (error) {
            console.error("Error updating inventory:", error);
            alert("Failed to update inventory.");
        }
    };

    const handleSearchBanks = async (e) => {
        e.preventDefault();
        setIsSearchingBanks(true);
        try {
            const q = query(
                collection(db, "blood_banks_list"),
                where("district", "==", searchDistrict),
                where("town", "==", searchTown)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBankResults(results);
        } catch (error) {
            console.error("Error searching banks:", error);
        } finally {
            setIsSearchingBanks(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Inventory & <span className="text-blood-red">Sourcing</span></h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Manage your internal stock and find blood from external donors or blood banks.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('my-stock')}
                        className={`px-6 py-2 rounded-full transition-all ${activeTab === 'my-stock' ? 'bg-blood-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        My Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('sourcing')}
                        className={`px-6 py-2 rounded-full transition-all ${activeTab === 'sourcing' ? 'bg-blood-red text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Sourcing & Requests
                    </button>
                </div>

                {/* My Stock Section */}
                {activeTab === 'my-stock' && (
                    <div className="glass-card p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Local Inventory Management</h2>
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <button
                                        onClick={() => {
                                            setEditBuffer(myInventory);
                                            setIsEditing(true);
                                        }}
                                        className="btn-primary py-2 px-4 text-sm"
                                    >
                                        Edit Stock Levels
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500 transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveInventory}
                                            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 transition-colors text-sm font-bold"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                                <div key={type} className="bg-white/5 p-6 rounded-xl border border-white/10 text-center relative">
                                    <div className="text-3xl font-bold text-blood-red mb-2">{type}</div>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editBuffer[type] || 0}
                                            onChange={(e) => setEditBuffer({ ...editBuffer, [type]: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-center text-white focus:border-blood-red outline-none text-lg font-bold"
                                        />
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-white mb-1">{myInventory[type] || 0}</div>
                                            <div className="text-gray-400 text-sm">Units Available</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sourcing Section */}
                {activeTab === 'sourcing' && (
                    <div className="space-y-8">
                        {/* Search Banks */}
                        <div className="glass-card p-8">
                            <h2 className="text-2xl font-bold mb-6">Find Blood from Banks</h2>
                            <form onSubmit={handleSearchBanks} className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex-1">
                                    <select
                                        value={searchDistrict}
                                        onChange={(e) => setSearchDistrict(e.target.value)}
                                        className="glass-input w-full text-gray-300 [&>option]:text-gray-900"
                                        required
                                    >
                                        <option value="">Select District</option>
                                        {apDistricts.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={searchTown}
                                        onChange={(e) => setSearchTown(e.target.value)}
                                        className="glass-input w-full text-gray-300 [&>option]:text-gray-900"
                                        disabled={!searchDistrict}
                                        required
                                    >
                                        <option value="">{searchDistrict ? 'Select Town' : 'Select District First'}</option>
                                        {searchDistrict && apTowns[searchDistrict]?.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary whitespace-nowrap px-8">
                                    {isSearchingBanks ? 'Searching...' : 'Search Inventory'}
                                </button>
                            </form>

                            {bankResults.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                                    {bankResults.map((bank) => (
                                        <div key={bank.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                                            <h3 className="font-bold text-lg text-white">{bank.bloodBankName}</h3>
                                            <p className="text-sm text-gray-400 mb-2">{bank.town}, {bank.contactNumber}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['A+', 'O+', 'B+', 'AB+'].map(type => (
                                                    <span key={type} className={`text-xs px-2 py-1 rounded ${bank.inventory && bank.inventory[type] > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {type}: {bank.inventory ? bank.inventory[type] || 0 : 0}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Request from Donors (Existing Component) */}
                        <RequestBlood />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
