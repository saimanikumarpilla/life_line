import RequestBlood from '../components/RequestBlood';
import BloodContainer from '../components/BloodContainer';

const Inventory = () => {
    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Blood Inventory & Requests</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        View current demand and find donors immediately. Our system intelligently matches requests with eligible donors.
                    </p>
                </div>

                {/* Dynamic Blood Inventory Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                    {[
                        { type: 'A+', liters: 12.4, percent: 85 },
                        { type: 'O+', liters: 8.1, percent: 65 },
                        { type: 'B+', liters: 5.4, percent: 45 },
                        { type: 'AB+', liters: 2.1, percent: 18 },
                        { type: 'A-', liters: 4.2, percent: 35 },
                        { type: 'O-', liters: 0.8, percent: 8 },
                        { type: 'B-', liters: 1.5, percent: 15 },
                        { type: 'AB-', liters: 0.5, percent: 5 },
                    ].map((blood) => (
                        <BloodContainer
                            key={blood.type}
                            type={blood.type}
                            liters={blood.liters}
                            percentage={blood.percent}
                        />
                    ))}
                </div>

                {/* Request Interface */}
                <RequestBlood />
            </div>
        </div>
    );
};

export default Inventory;
