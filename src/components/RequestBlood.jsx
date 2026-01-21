import { useState } from 'react';
import { motion } from 'framer-motion';
import { findMatchingDonors, sendNotification } from '../utils/bloodLogic';

// Mock Data for demonstration before Firebase integration
const MOCK_DONORS = [
    { id: 1, name: 'Alice Smith', bloodGroup: 'A+', lastDonationDate: '2023-01-01', location: 'New York', phone: '+1 555-0101' },
    { id: 2, name: 'Bob Jones', bloodGroup: 'O-', lastDonationDate: '2023-11-20', location: 'New York', phone: '+1 555-0102' },
    { id: 3, name: 'Charlie Day', bloodGroup: 'A+', lastDonationDate: '2022-05-15', location: 'Brooklyn', phone: '+1 555-0103' },
    { id: 4, name: 'David Miller', bloodGroup: 'O+', lastDonationDate: '2023-08-10', location: 'Queens', phone: '+1 555-0104' },
    { id: 5, name: 'Eva Green', bloodGroup: 'AB+', lastDonationDate: '2023-02-20', location: 'Manhattan', phone: '+1 555-0105' },
    { id: 6, name: 'Frank White', bloodGroup: 'A+', lastDonationDate: '2021-12-12', location: 'Bronx', phone: '+1 555-0106' },
    { id: 7, name: 'Grace Lee', bloodGroup: 'O-', lastDonationDate: '2022-09-05', location: 'Staten Island', phone: '+1 555-0107' },
    { id: 8, name: 'Henry Ford', bloodGroup: 'B+', lastDonationDate: '2023-03-30', location: 'Jersey City', phone: '+1 555-0108' },
    { id: 9, name: 'Ivy Chen', bloodGroup: 'A-', lastDonationDate: '2023-06-18', location: 'New York', phone: '+1 555-0109' },
    { id: 10, name: 'Jack Ryan', bloodGroup: 'AB-', lastDonationDate: '2023-01-25', location: 'Brooklyn', phone: '+1 555-0110' },
];

const RequestBlood = () => {
    const [requestData, setRequestData] = useState({
        patientName: '',
        bloodGroup: '',
        location: '',
        urgency: 'Normal'
    });
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API delay
        setTimeout(() => {
            const eligibleDonors = findMatchingDonors(requestData.bloodGroup, MOCK_DONORS);
            setMatches(eligibleDonors);
            setLoading(false);

            // Auto-notify (Simulated)
            eligibleDonors.forEach(donor => sendNotification(donor.id));
        }, 1000);
    };

    return (
        <div className="glass-card p-8 max-w-4xl mx-auto mt-10">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                Request <span className="text-blood-red">Blood</span>
                <span className="text-sm font-normal text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">Finds nearest eligible donors</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Request Form */}
                <div className="lg:col-span-1 border-r border-white/10 pr-0 lg:pr-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <input
                            className="glass-input w-full"
                            placeholder="Patient Name"
                            onChange={(e) => setRequestData({ ...requestData, patientName: e.target.value })}
                        />
                        <select
                            className="glass-input w-full [&>option]:text-black"
                            onChange={(e) => setRequestData({ ...requestData, bloodGroup: e.target.value })}
                        >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                        <input
                            className="glass-input w-full"
                            placeholder="Hospital/Location"
                            onChange={(e) => setRequestData({ ...requestData, location: e.target.value })}
                        />
                        <button className="btn-primary w-full" disabled={loading}>
                            {loading ? 'Searching...' : 'Find Donors'}
                        </button>
                    </form>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">Matched Donors Results</h3>
                    {matches.length === 0 && !loading && (
                        <div className="text-gray-500 italic">No search performed or no eligible donors found.</div>
                    )}

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {matches.map(donor => (
                            <motion.div
                                key={donor.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/5 hover:border-blood-red/30 transition-all group"
                            >
                                <div>
                                    <div className="font-bold text-lg text-white group-hover:text-blood-red transition-colors">{donor.name}</div>
                                    <div className="text-sm text-gray-400 flex items-center gap-2">
                                        <span>{donor.location}</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>Last Donation: {donor.lastDonationDate}</span>
                                    </div>
                                    <div className="text-sm text-gray-300 mt-1 flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                        {donor.phone}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-blood-red font-bold text-xl">{donor.bloodGroup}</div>
                                    <button className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 mt-1 hover:bg-green-500/20 transition-colors">
                                        Notify
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestBlood;
