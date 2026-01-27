import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CustomSelect from '../components/CustomSelect';

const RecipientLogin = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        bloodGroup: ''
    });

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Save to Firestore (optional, but good for persistence)
            const docRef = await addDoc(collection(db, "recipients_temp"), {
                ...formData,
                loginTime: new Date().toISOString()
            });

            // Save to LocalStorage for session
            localStorage.setItem('user', JSON.stringify({
                id: docRef.id,
                userType: 'recipient', // New role
                ...formData
            }));

            // Redirect
            navigate('/recipient-dashboard');

        } catch (error) {
            console.error("Error logging in:", error);
            alert("Error: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 w-full max-w-lg"
            >
                <h2 className="text-3xl font-bold mb-6 text-center">Recipient <span className="text-blood-red">Login</span></h2>
                <p className="text-center text-gray-400 mb-8 text-sm">(Temporary Access)</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Patient Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="Enter patient name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="glass-input w-full"
                            placeholder="Enter phone number"
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
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    <CustomSelect
                        label="Patient Blood Group"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        options={bloodGroups}
                        placeholder="Select Blood Group"
                        required
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full py-3 text-lg mt-4 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Processing...' : 'Access Dashboard'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default RecipientLogin;
