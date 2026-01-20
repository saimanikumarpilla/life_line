import { useState } from 'react';
import { motion } from 'framer-motion';
import { apDistricts, apTowns } from '../utils/apData';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CustomSelect from './CustomSelect';

const DonorForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        bloodGroup: '',
        lastDonationDate: null,
        phone: '',
        email: '',
        district: '',
        nearestTown: '',
        village: '',
        distanceFromTown: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, lastDonationDate: date });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Donor Registration Data:', formData);
        // TODO: Add to Firebase
        alert("Registration Successful!");
    };

    // Get towns key based on district, handling potential mismatch or empty selection
    const availableTowns = formData.district ? apTowns[formData.district] || [] : [];

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-2xl mx-auto"
        >
            <h2 className="text-3xl font-bold mb-6 text-center">Become a <span className="text-blood-red">Life Saver</span></h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <CustomSelect
                        label="Blood Group"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        options={bloodGroups}
                        placeholder="Select Group"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Last Donation Date</label>
                    <div className="w-full">
                        <DatePicker
                            selected={formData.lastDonationDate}
                            onChange={handleDateChange}
                            className="glass-input w-full text-gray-300 cursor-pointer"
                            placeholderText="Select Date"
                            dateFormat="dd/MM/yyyy"
                            maxDate={new Date()}
                            showYearDropdown
                            scrollableYearDropdown
                        />
                    </div>
                    <p className="text-xs text-gray-400">Leave empty if you haven't donated before.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="+91 98765 43210"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="john@example.com"
                            required
                        />
                    </div>
                </div>

                {/* Location Details for AP */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-gray-200">Location Details (AP)</h3>

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
                            label="Nearest Town / Your Town"
                            name="nearestTown"
                            value={formData.nearestTown}
                            onChange={handleChange}
                            options={availableTowns}
                            placeholder={formData.district ? 'Select Town' : 'Select District First'}
                            disabled={!formData.district}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Village</label>
                            <input
                                type="text"
                                name="village"
                                value={formData.village}
                                onChange={handleChange}
                                className="glass-input w-full"
                                placeholder="Enter Village Name (Optional)"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Distance from Town (KM)</label>
                            <input
                                type="number"
                                name="distanceFromTown"
                                value={formData.distanceFromTown}
                                onChange={handleChange}
                                className="glass-input w-full"
                                placeholder="0 if living in town"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-lg">
                    Register to Donate
                </button>
            </form>
        </motion.div >
    );
};

export default DonorForm;
