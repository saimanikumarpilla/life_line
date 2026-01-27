import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CampCarousel = () => {
    const [photos, setPhotos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fetch photos from Firestore
    useEffect(() => {
        const fetchPhotos = async () => {
            if (!db) return;
            try {
                const q = query(collection(db, "camp_photos"), orderBy("createdAt", "desc"), limit(10));
                const querySnapshot = await getDocs(q);
                const fetchedPhotos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // If no photos, use placeholders
                if (fetchedPhotos.length === 0) {
                    setPhotos([
                        { id: 1, url: 'https://images.unsplash.com/photo-1615461166324-cd1f91f8b434?q=80&w=1000&auto=format&fit=crop', caption: 'Blood Donation Camp 2024' },
                        { id: 2, url: 'https://img.freepik.com/free-vector/blood-donation-concept-illustration_114360-1044.jpg', caption: 'Volunteer Donors' },
                        { id: 3, url: 'https://media.istockphoto.com/id/1212169974/vector/blood-donation-bag-with-tube-shaped-as-a-heart.jpg?s=612x612&w=0&k=20&c=i-q-tH-g-a-l-K-e-g-h-t-k-y-g-l-e-g-l-e-g-h-t-k-y-g-l-e-g-l-e=', caption: 'Save Lives' }
                    ]);
                } else {
                    setPhotos(fetchedPhotos);
                }
            } catch (error) {
                console.error("Error fetching camp photos:", error);
                // Fallback on error
                setPhotos([
                    { id: 1, url: 'https://images.unsplash.com/photo-1615461166324-cd1f91f8b434?q=80&w=1000&auto=format&fit=crop', caption: 'Blood Donation Camp 2024' },
                    { id: 2, url: 'https://img.freepik.com/free-vector/blood-donation-concept-illustration_114360-1044.jpg', caption: 'Volunteer Donors' }
                ]);
            }
        };

        fetchPhotos();
    }, []);

    // Auto-scroll
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [photos.length]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

    if (photos.length === 0) return null;

    return (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden glass-card border border-white/10 group">
            <AnimatePresence mode='wait'>
                <motion.img
                    key={currentIndex}
                    src={photos[currentIndex].url}
                    alt={photos[currentIndex].caption || "Camp Photo"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Caption */}
            <div className="absolute bottom-4 left-4 z-10">
                <p className="text-white font-bold text-lg">{photos[currentIndex].caption}</p>
            </div>

            {/* Controls */}
            <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                {photos.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-blood-red w-4' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CampCarousel;
