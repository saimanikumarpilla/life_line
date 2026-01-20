
import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const BloodContainer = ({ type, liters, percentage }) => {
    // Mouse/Gyro physics state
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // Motion values for smooth physics
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring physics for "sloshing" fluid weight
    const springConfig = { damping: 15, stiffness: 150, mass: 1 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

    // Wave movement
    const waveX = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-5%", "5%"]), { damping: 10, stiffness: 50 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Normalize mouse position (-0.5 to 0.5)
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;
            mouseX.set(x);
            mouseY.set(y);
        };

        const handleOrientation = (e) => {
            // Device orientation for mobile
            if (e.beta && e.gamma) {
                // Approximate normalization
                const x = Math.min(Math.max(e.gamma / 90, -0.5), 0.5);
                const y = Math.min(Math.max(e.beta / 90, -0.5), 0.5);
                mouseX.set(x);
                mouseY.set(y);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    // Determine color and status based on percentage
    const isLow = percentage < 20;
    const statusColor = isLow ? 'bg-red-900' : 'bg-blood-red';
    const statusText = isLow ? 'CRITICAL LOW' : percentage > 75 ? 'Well Stocked' : 'Stable';

    return (
        <div className="flex flex-col items-center gap-3">
            {/* The Glass Container */}
            <div className="relative w-32 h-48 rounded-2xl border-4 border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden transform perspective-1000">
                {/* Glass Glare */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent z-20 pointer-events-none" />

                {/* Measurement Lines */}
                <div className="absolute right-0 top-4 bottom-4 w-4 flex flex-col justify-between items-end pr-1 z-20 opacity-50">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-2 h-[1px] bg-white/50" />
                    ))}
                </div>

                {/* The Blood Liquid */}
                <motion.div
                    className={`absolute bottom-0 w-[200%] -left-1/2 h-full ${statusColor} opacity-90`}
                    style={{
                        height: `${percentage}%`,
                        rotateZ: rotateY, // Tilt the liquid surface based on horizontal movement
                        x: waveX, // Slight horizontal shift for inertia
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Liquid Surface (simulated top of fluid) */}
                    <div className="absolute top-0 w-full h-8 -mt-4 bg-red-400 opacity-30 rounded-[100%] blur-sm transform scale-y-50" />

                    {/* Bubbles / Texture */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </motion.div>

                {/* Label Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
                    <h2 className="text-4xl font-black text-white drop-shadow-lg">{type}</h2>
                    <p className="text-white/80 font-mono text-sm mt-1 drop-shadow-md">{liters}L</p>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="text-center">
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${isLow ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-500/10 text-green-400'}`}>
                    {statusText}
                </div>
            </div>
        </div>
    );
};

export default BloodContainer;
