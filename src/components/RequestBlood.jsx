import { useState } from 'react';
import { motion } from 'framer-motion';
import { findMatchingDonors } from '../utils/bloodLogic';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { apDistricts, apTowns } from '../utils/apData';
import CustomSelect from './CustomSelect';
import { Building2, User } from 'lucide-react';

const RequestBlood = () => {
    const [requestData, setRequestData] = useState({
        patientName: '',
        bloodGroup: '',
        district: '',
        nearestTown: '',
        urgency: 'Normal'
    });
    const [donorMatches, setDonorMatches] = useState([]);
    const [bankMatches, setBankMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Get towns key based on district
    const availableTowns = requestData.district ? apTowns[requestData.district] || [] : [];
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const handleChange = (e) => {
        setRequestData({ ...requestData, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDonorMatches([]);
        setBankMatches([]);
        setHasSearched(true);

        try {
            // 1. Fetch Donors
            const donorsRef = collection(db, "donors_list");
            const donorSnap = await getDocs(donorsRef);
            const allDonors = donorSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const eligibleDonors = findMatchingDonors(requestData.bloodGroup, allDonors);
            const filteredDonors = eligibleDonors.filter(d => {
                const matchDistrict = !requestData.district || (d.district && d.district === requestData.district);
                const matchTown = !requestData.nearestTown || (d.nearestTown && d.nearestTown === requestData.nearestTown);
                return matchDistrict && matchTown;
            });
            setDonorMatches(filteredDonors);

            // 2. Fetch Blood Banks (Only if location is selected, otherwise fetch all or limit? Let's strict to district at least if selected)
            let banksQ;
            if (requestData.district) {
                if (requestData.nearestTown) {
                    // Try exact match first
                    banksQ = query(
                        collection(db, "blood_banks_list"),
                        where("district", "==", requestData.district),
                        where("town", "==", requestData.nearestTown)
                    );
                } else {
                    banksQ = query(
                        collection(db, "blood_banks_list"),
                        where("district", "==", requestData.district)
                    );
                }
            } else {
                // If no location, fetch all (might want to limit this in prod)
                banksQ = query(collection(db, "blood_banks_list"));
            }

            const bankSnap = await getDocs(banksQ);
            const banks = bankSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBankMatches(banks);

        } catch (error) {
            console.error("Error fetching data: ", error);
            alert("Failed to perform search. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-8 w-full">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                Request <span className="text-blood-red">Blood</span>
                <span className="text-sm font-normal text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 hidden md:inline-block">
                    Finds nearest eligible donors & blood banks
                </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Request Form */}
                <div className="lg:col-span-1 border-r border-white/10 pr-0 lg:pr-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <input
                            className="glass-input w-full"
                            placeholder="Patient Name"
                            name="patientName"
                            value={requestData.patientName}
                            onChange={handleChange}
                        />

                        <CustomSelect
                            label="Blood Group"
                            name="bloodGroup"
                            value={requestData.bloodGroup}
                            onChange={handleChange}
                            options={bloodGroups}
                            placeholder="Select Blood Group"
                        />

                        <CustomSelect
                            label="District"
                            name="district"
                            value={requestData.district}
                            onChange={handleChange}
                            options={apDistricts}
                            placeholder="Select District"
                        />

                        <CustomSelect
                            label="Town"
                            name="nearestTown"
                            value={requestData.nearestTown}
                            onChange={handleChange}
                            options={availableTowns}
                            placeholder={requestData.district ? 'Select Town' : 'Select District First'}
                            disabled={!requestData.district}
                        />

                        <button className="btn-primary w-full" disabled={loading}>
                            {loading ? 'Searching...' : 'Find Matches'}
                        </button>
                    </form>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Donors Section */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <User size={20} className="text-blood-red" />
                            Example Matches (Donors)
                        </h3>
                        {donorMatches.length === 0 && hasSearched && !loading ? (
                            <div className="text-gray-500 italic ml-2">No eligible donors found in this location.</div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {donorMatches.map(donor => (
                                <motion.div
                                    key={donor.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-blood-red/30 transition-colors flex justify-between items-start"
                                >
                                    <div>
                                        <div className="font-bold text-white">{donor.fullName}</div>
                                        <div className="text-sm text-gray-400">{donor.nearestTown}, {donor.district}</div>
                                        <div className="text-sm text-gray-400 mt-1">{donor.phone}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-blood-red font-bold text-lg">{donor.bloodGroup}</span>
                                        <button className="block text-xs text-green-400 mt-2 bg-green-500/10 px-2 py-1 rounded hover:bg-green-500/20 transition-colors">Notify</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Blood Banks Section */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-400" />
                            Nearest Blood Banks
                        </h3>
                        {bankMatches.length === 0 && hasSearched && !loading ? (
                            <div className="text-gray-500 italic ml-2">No blood banks found in this location.</div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {bankMatches.map(bank => {
                                // Check stock of requested group
                                const requestedStock = requestData.bloodGroup && bank.inventory ? bank.inventory[requestData.bloodGroup] : null;

                                return (
                                    <motion.div
                                        key={bank.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/5 p-4 rounded-lg border border-white/5 hover:border-blue-400/30 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-white">{bank.bloodBankName}</div>
                                                <div className="text-sm text-gray-400">{bank.town}, {bank.district}</div>
                                            </div>
                                            {requestData.bloodGroup && (
                                                <div className={`text-center px-3 py-1 rounded-lg ${requestedStock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    <div className="text-xs font-bold uppercase">Stock</div>
                                                    <div className="font-bold">{requestedStock !== null ? `${requestedStock} Units` : 'N/A'}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-end mt-3">
                                            <div className="text-sm text-gray-300">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    {bank.contactNumber}
                                                </div>
                                            </div>
                                            <button className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                                Contact Bank
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RequestBlood;
