import { useState } from 'react';
import { motion } from 'framer-motion';
import { apDistricts, apTowns } from '../utils/apData';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CustomSelect from './CustomSelect';

const HospitalForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        hospitalName: '',
        email: '',
        password: '',
        contactNumber: '',
        hfrId: '',
        district: '',
        town: ''
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
            // 1. Add to hospitals_list collection
            const hospitalRef = await addDoc(collection(db, "hospitals_list"), {
                ...formData,
                createdAt: new Date().toISOString()
            });

            // 2. Add to login_details
            await addDoc(collection(db, "login_details"), {
                email: formData.email,
                password: formData.password,
                userType: 'hospital',
                profileId: hospitalRef.id,
                createdAt: new Date().toISOString()
            });

            alert("Hospital Registration Successful!");
            setFormData({
                hospitalName: '',
                email: '',
                password: '',
                contactNumber: '',
                hfrId: '',
                district: '',
                town: ''
            });
        } catch (error) {
            console.error("Error registering hospital: ", error);
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
            <h2 className="text-3xl font-bold mb-6 text-center">Hospital Registration</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Hospital Name</label>
                    <input
                        type="text"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        className="glass-input w-full"
                        placeholder="Enter Hospital Name"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <label className="block text-sm font-medium text-gray-300">HFR ID</label>
                        <input
                            type="text"
                            name="hfrId"
                            value={formData.hfrId}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="HFR ID"
                            required
                        />
                    </div>
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

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-lg disabled:opacity-50">
                    {isSubmitting ? 'Registering...' : 'Register Hospital'}
                </button>
            </form>
        </motion.div>
    );
};

export default HospitalForm;
