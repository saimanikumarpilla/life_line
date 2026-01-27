import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const bloodBanksData = [
    // Vizag List
    {
        id: 'v1',
        name: 'A.S. Raja Voluntary Blood Bank',
        location: 'Visakhapatnam',
        address: 'Beside Care Hospital, Opp. Circuit House, Waltair Main Road, Visakhapatnam-3',
        contact: '0891-2543436, 5563436',
        category: 'Voluntary'
    },
    {
        id: 'v2',
        name: 'Apollo Hospital Blood Bank',
        location: 'Visakhapatnam',
        address: 'Apollo hospital, Waltair Main Road, Visakhapatnam-2',
        contact: '0891-2727272',
        category: 'Hospital'
    },
    {
        id: 'v3',
        name: 'Indian Red Cross Society Blood Bank',
        location: 'Visakhapatnam',
        address: '14-35-4, Red Cross Building, Opp Zilla Parishad, Maharanipeta, Visakhapatnam-2',
        contact: '0891-2703953, 2706025',
        category: 'Red Cross'
    },
    {
        id: 'v4',
        name: 'King George Hospital Blood Bank',
        location: 'Visakhapatnam',
        address: 'KGH, Maharanipeta, Visakhapatnam-2',
        contact: '0891-2564891',
        category: 'Hospital'
    },
    {
        id: 'v5',
        name: 'Rajya Laxmi Voluntary Blood Bank',
        location: 'Visakhapatnam',
        address: '14-37-44, Chaitanya Medical Centre Complex, Collectrate Jn. Visakhapatnam-2',
        contact: '0891-2568618',
        category: 'Voluntary'
    },
    {
        id: 'v6',
        name: 'R.C. Bothra Voluntary Blood Bank',
        location: 'Visakhapatnam',
        address: '43-6-33, Rama Talkies Road, Srinagar, Visakhapatnam',
        contact: '0891-5515336, 094400-33858',
        category: 'Voluntary'
    },
    {
        id: 'v7',
        name: 'Rotary Blood Bank',
        location: 'Visakhapatnam',
        address: 'Sri Hari Plaza, Beside Prahalada Kalyana Mandapam, Maharanipeta, Visakhapatnam-2',
        contact: '0891-5534635',
        category: 'Charity'
    },
    {
        id: 'v8',
        name: 'Seven Hills Hospital Blood Bank',
        location: 'Visakhapatnam',
        address: 'Seven Hills Hospital, Waltair Main Road, Visakhapatnam-2',
        contact: '0891-2708090',
        category: 'Hospital'
    },
    {
        id: 'v9',
        name: 'Sitarama Blood Bank',
        location: 'Visakhapatnam',
        address: 'Opp. KGH OP Gate, Maharanipeta, Visakhapatnam-2',
        contact: '0891-2706025, 2784321',
        category: 'Private'
    },
    {
        id: 'v10',
        name: 'Visakha Voluntary Blood Bank',
        location: 'Visakhapatnam',
        address: 'Above Visakha Medical Centre, Gajuwaka Jn. Gajuwaka',
        contact: 'Not Available',
        category: 'Voluntary'
    },
    // Vijayawada List
    {
        id: 'via1',
        name: 'New City Blood Bank',
        location: 'Vijayawada',
        address: 'Dornakal Road, Suryaraopet, Vijayawada',
        contact: '9615444447',
        category: 'Private'
    },
    {
        id: 'via2',
        name: 'Vijaya Sri Blood Bank',
        location: 'Vijayawada',
        address: 'Dornakal Road, Suryaraopet, Vijayawada',
        contact: '08662433199',
        category: 'Private'
    },
    {
        id: 'via3',
        name: 'Rotary Red Cross Blood Bank',
        location: 'Vijayawada',
        address: 'Door No 26-5-5, G S Raju Street, Gandhi Nagar, Vijayawada - 520003',
        contact: '08662570082',
        category: 'Red Cross'
    },
    {
        id: 'via4',
        name: 'Lions Blood Bank',
        location: 'Vijayawada',
        address: '29-4-54k, CSI CDA Complex, Prakasham Road, Suryaraopet, Vijayawada',
        contact: '08662573636',
        category: 'Charity'
    },
    {
        id: 'via5',
        name: 'Chaitanya Blood Bank',
        location: 'Vijayawada',
        address: '40-9/1-26, 1st Floor, Vasavi Complex, Benz Circle, Vijayawada',
        contact: '08662497977',
        category: 'Private'
    },
    {
        id: 'via6',
        name: 'Aayush Blood Bank',
        location: 'Vijayawada',
        address: 'Door No 48-13-3 & 3a, Ring Road, Vijayawada',
        contact: '08662541414',
        category: 'Private'
    },
    {
        id: 'via7',
        name: 'Andhra Blood Bank',
        location: 'Vijayawada',
        address: 'Cvr Complex, Prakasam Road, Governorpet, Vijayawada',
        contact: '08662574757',
        category: 'Private'
    },
    // Andhra Pradesh District Red Cross Centres
    {
        id: 'ap1',
        name: 'Red Cross Blood Bank Ananthpur',
        location: 'Ananthpur',
        address: 'Ananthpur District',
        contact: '08554-246344, 9666629797, ircsbloodbank.anantapur@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap2',
        name: 'Red Cross Blood Bank Bhimavaram',
        location: 'Bhimavaram',
        address: 'Bhimavaram',
        contact: '9666771911, ircsbvrmbloodcentre@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap3',
        name: 'Red Cross Blood Bank Chittoor',
        location: 'Chittoor',
        address: 'Chittoor',
        contact: '8374908091, ircschittoor@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap4',
        name: 'Red Cross Blood Bank Eluru',
        location: 'Eluru',
        address: 'Eluru',
        contact: '9440189333, redcrosseluru@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap5',
        name: 'Red Cross Blood Bank Guntur',
        location: 'Guntur',
        address: 'Guntur',
        contact: '9505540341, redcrossguntur@yahoo.co.in',
        category: 'Red Cross'
    },
    {
        id: 'ap6',
        name: 'Red Cross Blood Bank Kadapa',
        location: 'Kadapa',
        address: 'Kadapa',
        contact: '9347162489, ircskadapa@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap7',
        name: 'Red Cross Blood Bank Kakinada',
        location: 'Kakinada',
        address: 'Kakinada',
        contact: '9848424389, redcrossbloodbank@yahoo.com',
        category: 'Red Cross'
    },
    {
        id: 'ap8',
        name: 'Red Cross Blood Bank Kavali',
        location: 'Kavali',
        address: 'Kavali',
        contact: '8977535722, kavaliredcross@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap9',
        name: 'Red Cross Blood Bank Machilipatum',
        location: 'Machilipatum',
        address: 'Krishna - Machilipatum',
        contact: '7793939660, drprcbloodbankmtm@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap10',
        name: 'Red Cross Blood Bank Kurnool',
        location: 'Kurnool',
        address: 'Kurnool',
        contact: '08518-255347, ircsbloodbankknl@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap11',
        name: 'Red Cross Blood Bank Narasapuram',
        location: 'Narasapuram',
        address: 'Narasapuram',
        contact: '9291631555, recrossnarsapuram@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap12',
        name: 'Red Cross Blood Bank Nellore',
        location: 'Nellore',
        address: 'Nellore',
        contact: '9347033100, redcrossbloodbanknellore@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap13',
        name: 'Red Cross Blood Bank Ongole',
        location: 'Ongole',
        address: 'Ongole',
        contact: '9515153436, ircsongole@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap14',
        name: 'Red Cross Blood Bank Palanadu',
        location: 'Palanadu',
        address: 'Palanadu',
        contact: '9440758731, redcrosspalnadu@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap15',
        name: 'Red Cross Blood Bank Repalle',
        location: 'Repalle',
        address: 'Repalle',
        contact: '9177883353, rplredcrossbb@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap16',
        name: 'Red Cross Blood Bank Srikakulam',
        location: 'Srikakulam',
        address: 'Srikakulam',
        contact: '9133008585, secretary.redcrosssklm@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap17',
        name: 'Red Cross Blood Bank Tanuku',
        location: 'Tanuku',
        address: 'Tanuku',
        contact: '8309268213, bcircs733@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap18',
        name: 'Red Cross Blood Bank Vijayawada',
        location: 'Vijayawada',
        address: 'Vijayawada',
        contact: '8977008540, ircskrishna@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap19',
        name: 'Red Cross Blood Bank Visakhapatnam',
        location: 'Visakhapatnam',
        address: 'Visakhapatnam',
        contact: '8331018934, secretaryvspredcross@gmail.com',
        category: 'Red Cross'
    },
    {
        id: 'ap20',
        name: 'Red Cross Blood Bank Vizianagaram',
        location: 'Vizianagaram',
        address: 'Vizianagaram',
        contact: '7032076969, ircsofficevzm@gmail.com',
        category: 'Red Cross'
    }
];

const BloodBanksDirectory = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('All');
    const [fetchedBanks, setFetchedBanks] = useState([]);

    useEffect(() => {
        const fetchBloodBanks = async () => {
            if (!db) return;
            try {
                const querySnapshot = await getDocs(collection(db, "blood_banks_list"));
                const banks = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().bloodBankName,
                    location: doc.data().town || doc.data().district || doc.data().city || 'Unknown',
                    address: doc.data().address,
                    contact: doc.data().contactNumber,
                    category: doc.data().category || 'Blood Bank'
                }));
                // Filter out any invalid entries if necessary
                setFetchedBanks(banks);
            } catch (error) {
                console.error("Error fetching blood banks: ", error);
            }
        };

        fetchBloodBanks();
    }, []);

    const allBanks = [...bloodBanksData, ...fetchedBanks];

    const locations = ['All', ...new Set(allBanks.map(item => item.location).filter(Boolean))];

    const filteredBanks = allBanks.filter(bank => {
        const matchesSearch = bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bank.address?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = locationFilter === 'All' || bank.location === locationFilter;
        return matchesSearch && matchesLocation;
    });

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blood-red to-red-400 mb-4"
                    >
                        Blood Bank Directory
                    </motion.h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Find registered blood banks in your area. Contact them directly for availability and emergencies.
                    </p>
                </div>

                {/* Filters */}
                <div className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <input
                        type="text"
                        placeholder="Search by name or address..."
                        className="glass-input w-full md:w-96"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="glass-input w-full md:w-48 bg-gray-900"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                    >
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                {/* Directory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBanks.map((bank) => (
                        <motion.div
                            key={bank.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            className="glass-card p-6 border border-white/5 hover:border-blood-red/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-lg bg-blood-red/10 text-blood-red">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/10 text-gray-300 border border-white/5">
                                    {bank.category || 'Blood Bank'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blood-red transition-colors">
                                {bank.name}
                            </h3>

                            <div className="space-y-3 text-sm text-gray-400">
                                <div className="flex gap-3">
                                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p>{bank.address}</p>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <p className="text-white font-medium">{bank.contact}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredBanks.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No blood banks found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BloodBanksDirectory;
