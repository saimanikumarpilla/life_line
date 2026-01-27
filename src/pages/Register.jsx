import { useState } from 'react';
import DonorForm from '../components/DonorForm';
import HospitalForm from '../components/HospitalForm';
import BloodBankForm from '../components/BloodBankForm';
import { motion } from 'framer-motion';

const Register = () => {
    const [activeTab, setActiveTab] = useState('donor');

    const tabs = [
        { id: 'donor', label: 'Donor' },
        { id: 'hospital', label: 'Hospital' },
        { id: 'blood_bank', label: 'Blood Bank' }
    ];

    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">Join Our Network</h1>
                <p className="text-gray-400">
                    Register as a Donor, Hospital, or Blood Bank to help us save lives.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
                <div className="glass-card p-1 flex space-x-2 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2 rounded-lg transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-blood-red text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'donor' && <DonorForm />}
                {activeTab === 'hospital' && <HospitalForm />}
                {activeTab === 'blood_bank' && <BloodBankForm />}
            </motion.div>
        </div>
    );
};

export default Register;
