import { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { apDistricts, apTowns } from '../utils/apData';
import CustomSelect from './CustomSelect';

const BloodBankForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        bloodBankName: '',
        category: 'Hospital', // Default
        email: '',
        password: '',
        contactNumber: '',
        address: '',
        district: '',
        town: '',
        testingFacilities: '',
        processingFacilities: '',
        storageCapacity: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!db) {
            alert("Firebase configuration is missing!");
            setIsSubmitting(false);
            return;
        }
        try {
            // 1. Add to blood_banks_list collection
            const bankRef = await addDoc(collection(db, "blood_banks_list"), {
                ...formData,
                createdAt: new Date().toISOString()
            });

            // 2. Add to login_details
            await addDoc(collection(db, "login_details"), {
                email: formData.email,
                password: formData.password,
                userType: 'blood_bank',
                profileId: bankRef.id,
                createdAt: new Date().toISOString()
            });

            alert("Blood Bank Registration Successful!");
            setFormData({
                bloodBankName: '',
                category: 'Hospital',
                email: '',
                password: '',
                contactNumber: '',
                address: '',
                district: '',
                town: '',
                testingFacilities: '',
                processingFacilities: '',
                storageCapacity: ''
            });
        } catch (error) {
            console.error("Error registering blood bank: ", error);
            alert("Error: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableTowns = formData.district ? apTowns[formData.district] || [] : [];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-2xl mx-auto"
        >
            <h2 className="text-3xl font-bold mb-6 text-center">Blood Bank Registration</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Blood Bank Name</label>
                    <input
                        type="text"
                        name="bloodBankName"
                        value={formData.bloodBankName}
                        onChange={handleChange}
                        className="glass-input w-full"
                        placeholder="Enter Blood Bank Name"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="Email Address"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="Password"
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="glass-input w-full text-gray-300 [&>option]:text-gray-900"
                    >
                        <option value="Hospital">Hospital</option>
                        <option value="Voluntary">Voluntary</option>
                        <option value="Private">Private</option>
                        <option value="Red Cross">Red Cross</option>
                        <option value="Charity">Charity</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="glass-input w-full h-20 pt-2"
                        placeholder="Full Address"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomSelect
                        label="District"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        options={apDistricts}
                        placeholder="Select District"
                        required
                    />
                    <CustomSelect
                        label="Town"
                        name="town"
                        value={formData.town}
                        onChange={handleChange}
                        options={availableTowns}
                        placeholder={formData.district ? 'Select Town' : 'Select District First'}
                        disabled={!formData.district}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Contact Number</label>
                    <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className="glass-input w-full"
                        placeholder="Contact Number"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Testing Facilities</label>
                    <textarea
                        name="testingFacilities"
                        value={formData.testingFacilities}
                        onChange={handleChange}
                        className="glass-input w-full h-24 pt-2"
                        placeholder="List available testing facilities..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Processing Facilities</label>
                    <textarea
                        name="processingFacilities"
                        value={formData.processingFacilities}
                        onChange={handleChange}
                        className="glass-input w-full h-24 pt-2"
                        placeholder="List available processing facilities..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Storage Capacity</label>
                    <input
                        type="text"
                        name="storageCapacity"
                        value={formData.storageCapacity}
                        onChange={handleChange}
                        className="glass-input w-full"
                        placeholder="e.g., 500 units"
                    />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-lg disabled:opacity-50">
                    {isSubmitting ? 'Registering...' : 'Register Blood Bank'}
                </button>
            </form>
        </motion.div>
    );
};

export default BloodBankForm;
