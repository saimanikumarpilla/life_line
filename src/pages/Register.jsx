import DonorForm from '../components/DonorForm';

const Register = () => {
    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-4xl mx-auto text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">Join Our Donor Community</h1>
                <p className="text-gray-400">
                    Your donation can save up to 3 lives. Register now to be notified when your blood type is needed nearby.
                </p>
            </div>
            <DonorForm />
        </div>
    );
};

export default Register;
