'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Home,
    ArrowLeft,
    Search,
    MapPin,
    Compass,
    Star,
    Sparkles
} from 'lucide-react';

export default function Custom404() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [floatingElements, setFloatingElements] = useState([]);

    // Track mouse movement for interactive effects
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate floating elements
    useEffect(() => {
        const elements = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
            size: 0.5 + Math.random() * 1,
        }));
        setFloatingElements(elements);
    }, []);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                when: "beforeChildren",
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const numberVariants = {
        hidden: { scale: 0, rotate: -180 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15,
                duration: 0.8
            }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(20, 184, 166, 0.3)",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 10
            }
        },
        tap: { scale: 0.95 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {floatingElements.map((element) => (
                    <motion.div
                        key={element.id}
                        className="absolute opacity-10"
                        style={{
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            rotate: [0, 360],
                            scale: [element.size, element.size * 1.2, element.size],
                        }}
                        transition={{
                            duration: element.duration,
                            delay: element.delay,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {element.id % 3 === 0 ? (
                            <Globe className="w-6 h-6 text-teal-400" />
                        ) : element.id % 3 === 1 ? (
                            <Compass className="w-5 h-5 text-teal-300" />
                        ) : (
                            <MapPin className="w-4 h-4 text-teal-500" />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Interactive cursor glow */}
            <motion.div
                className="fixed pointer-events-none z-50 w-96 h-96 rounded-full opacity-20"
                style={{
                    background: "radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%)",
                    left: mousePosition.x - 192,
                    top: mousePosition.y - 192,
                }}
                animate={{
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Main Content */}
            <motion.div
                className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Logo with animation */}
                <motion.div
                    className="flex items-center space-x-3 mb-8"
                    variants={itemVariants}
                >
                    <motion.div
                        className="relative flex items-center"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <Globe className="w-8 h-8 text-teal-400" />
                        <motion.div
                            className="absolute inset-0 rounded-full border border-teal-400/30"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                    <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-white">Wander</span>
                        <span className="text-2xl font-bold text-teal-400">Wave</span>
                    </div>
                </motion.div>

                {/* 404 Number with dramatic animation */}
                <motion.div className="flex items-center justify-center mb-6">
                    <motion.span
                        className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-teal-500 drop-shadow-2xl"
                        variants={numberVariants}
                        style={{
                            textShadow: "0 0 30px rgba(20, 184, 166, 0.5)"
                        }}
                    >
                        4
                    </motion.span>
                    <motion.div
                        className="mx-4 relative"
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Globe className="w-16 h-16 md:w-20 md:h-20 text-teal-400" />
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-teal-400/50"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [1, 0, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                    <motion.span
                        className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-300 to-teal-400 drop-shadow-2xl"
                        variants={numberVariants}
                        style={{
                            textShadow: "0 0 30px rgba(20, 184, 166, 0.5)"
                        }}
                    >
                        4
                    </motion.span>
                </motion.div>

                {/* Main heading */}
                <motion.h1
                    className="text-3xl md:text-4xl font-bold text-white mb-4"
                    variants={itemVariants}
                >
                    Oops! You've wandered off the map
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed"
                    variants={itemVariants}
                >
                    The page you're looking for seems to have drifted away like a wave.
                    Let's get you back on course to discover amazing destinations.
                </motion.p>

                {/* Action buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 mb-12"
                    variants={itemVariants}
                >
                    <motion.button
                        className="flex items-center space-x-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-semibold transition-all duration-300 shadow-lg"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => window.location.href = '/'}
                    >
                        <Home className="w-5 h-5" />
                        <span>Go Home</span>
                    </motion.button>

                    <motion.button
                        className="flex items-center space-x-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-full font-semibold transition-all duration-300 border border-slate-600 hover:border-teal-400"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Go Back</span>
                    </motion.button>
                </motion.div>

                {/* Popular destinations */}
                <motion.div
                    className="text-center"
                    variants={itemVariants}
                >
                    <h3 className="text-xl font-semibold text-teal-300 mb-4 flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Popular Destinations</span>
                        <Sparkles className="w-5 h-5" />
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Explore', 'My Trips', 'Friends', 'Messages'].map((item, index) => (
                            <motion.button
                                key={item}
                                className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-gray-300 rounded-full transition-all duration-300 border border-slate-600/50 hover:border-teal-400/50 backdrop-blur-sm"
                                whileHover={{
                                    scale: 1.05,
                                    backgroundColor: "rgba(20, 184, 166, 0.1)"
                                }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                onClick={() => window.location.href = `/${item.toLowerCase().replace(' ', '')}`}
                            >
                                {item}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Decorative elements */}
                <motion.div
                    className="absolute top-20 left-10 opacity-20"
                    animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <Star className="w-6 h-6 text-teal-400" />
                </motion.div>

                <motion.div
                    className="absolute bottom-20 right-10 opacity-20"
                    animate={{
                        rotate: [360, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <Compass className="w-8 h-8 text-teal-300" />
                </motion.div>
            </motion.div>

            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
        </div>
    );
}