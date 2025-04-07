"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { LoaderWrapper } from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Users,
  Wallet,
  MessageSquare,
  Bell,
  CalendarDays,
  Map,
  CreditCard,
  Sparkles,
  ChevronDown,
  Globe,
  BadgeCheck,
  Star,
  MapPin,
  DollarSign,
  PlaneLanding,
  Shield,
} from "lucide-react"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.7,
      ease: "easeOut"
    }
  })
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

// Hero images for slider
const heroImages = [
  '/images/hawaii-coast.jpg',
  '/images/tropical-beach.jpg',
  '/images/maldives-aerial.jpg',
  '/images/norway-mountains.jpg',
  '/images/water-villas.jpg',
  '/images/palm-beach.jpg',
]

// Statistics section data
const stats = [
  { number: "50k+", label: "Active users" },
  { number: "100k+", label: "Trips created" },
  { number: "$2M+", label: "Expenses managed" },
  { number: "120+", label: "Countries" }
]

// Features data
const features = [
  {
    icon: <Users className="w-6 h-6 text-teal-500" />,
    title: "Collaborative Planning",
    description: "Create trips and invite friends to plan together. Assign roles and manage permissions for seamless collaboration.",
    color: "bg-teal-50 text-teal-700"
  },
  {
    icon: <Wallet className="w-6 h-6 text-teal-500" />,
    title: "Expense Management",
    description: "Track expenses, split costs equally, and manage payments with integrated payment processing.",
    color: "bg-teal-50 text-teal-700"
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-teal-500" />,
    title: "Real-time Chat",
    description: "Communicate with trip members in real-time through the built-in group chat with instant notifications.",
    color: "bg-teal-50 text-teal-700"
  },
  {
    icon: <Bell className="w-6 h-6 text-teal-500" />,
    title: "Smart Notifications",
    description: "Stay updated with smart notifications for important trip updates, expense reminders, and chat messages.",
    color: "bg-teal-50 text-teal-700"
  },
  {
    icon: <CalendarDays className="w-6 h-6 text-teal-500" />,
    title: "Itinerary Planning",
    description: "Create detailed day-by-day itineraries with activities, timing, and location information.",
    color: "bg-teal-50 text-teal-700"
  },
  {
    icon: <Map className="w-6 h-6 text-teal-500" />,
    title: "Interactive Maps",
    description: "Visualize your trip with interactive maps showing accommodation, activities, and points of interest.",
    color: "bg-teal-50 text-teal-700"
  }
]

// Testimonials data
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Group traveler",
    content: "WanderWave made our group trip to Europe so much easier to plan. The expense tracking feature saved us from awkward money conversations!",
    avatar: "/placeholder-user.jpg"
  },
  {
    name: "David Chen",
    role: "Adventure traveler",
    content: "I use WanderWave for all my trips now. The real-time chat and split expenses features are game changers for group travel.",
    avatar: "/placeholder-user.jpg"
  },
  {
    name: "Maria Garcia",
    role: "Family vacation planner",
    content: "Planning family vacations used to be a headache until we found WanderWave. Now everyone stays on the same page!",
    avatar: "/placeholder-user.jpg"
  }
]

export default function Home() {
  const { data: session, status } = useSession()
  const [scrollY, setScrollY] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { scrollYProgress } = useScroll()
  const heroRef = useRef<HTMLDivElement>(null)

  // Transform values for parallax effects
  const y = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  // Handle scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Image slider for hero section
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)

    return () => clearTimeout(timer)
  }, [currentImageIndex])

  return (
    <LoaderWrapper>
      <div className="relative overflow-hidden">
        {/* Hero section with animated background */}
        <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-900/90 to-slate-900/70 z-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 100%)'
            }}
          />

          {/* Background image slider */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={heroImages[currentImageIndex]}
                alt="Travel destination"
                fill
                priority
                className="object-cover"
                quality={90}
              />
            </motion.div>
          </AnimatePresence>

          <div className="container relative z-20 px-4 py-32 mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-4"
            >
              <span className="inline-block px-4 py-1.5 mb-5 text-sm font-medium tracking-wider text-teal-300 uppercase bg-teal-900/30 rounded-full backdrop-blur-sm border border-teal-500/20">
                Plan Together, Travel Better
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Group Travel Planning <br className="hidden sm:block" />
              <span className="text-teal-400">Made Simple</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-2xl mx-auto mb-8 text-xl text-white/80"
            >
              Create trips, invite friends, manage expenses, and chat in real-time.
              Your all-in-one platform for stress-free group travel planning.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {status === "authenticated" ? (
                <Link href="/trips/new">
                  <Button size="lg" className="px-8 bg-teal-500 hover:bg-teal-600 text-white">
                    Create a Trip <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="px-8 bg-teal-500 hover:bg-teal-600 text-white">
                      Sign Up Free <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="px-8 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="absolute bottom-10 left-0 right-0 flex justify-center"
            >
              <div className="animate-bounce">
                <ChevronDown className="w-6 h-6 text-teal-400" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trust indicators */}
        <section className="py-6 bg-slate-900">
          <div className="container px-4 mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <span className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-teal-400" />
                256-bit Encryption
              </span>
              <span className="flex items-center">
                <BadgeCheck className="w-4 h-4 mr-2 text-teal-400" />
                Trusted by 50,000+ travelers
              </span>
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-teal-400" />
                4.9/5 Rating on App Store
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-teal-400" />
                Available in 120+ countries
              </span>
            </div>
          </div>
        </section>

        {/* Benefits/Overview Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">Easy Group Travel</span>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  One Platform For All Your <span className="text-teal-600">Group Travel Needs</span>
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  WanderWave eliminates the chaos of planning trips with friends. No more endless group chats,
                  confusing spreadsheets, or forgotten expenses.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-teal-100">
                      <DollarSign className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Fair Expense Sharing</h3>
                      <p className="text-gray-600">Split costs equally or by custom amounts with instant calculations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-teal-100">
                      <MessageSquare className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Group Chat & Decisions</h3>
                      <p className="text-gray-600">Built-in messaging to keep everyone on the same page</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-teal-100">
                      <PlaneLanding className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Itinerary Management</h3>
                      <p className="text-gray-600">Day-by-day plans with bookings, activities, and location information</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Link href="/register">
                    <Button className="bg-teal-500 hover:bg-teal-600 text-white">Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative h-[500px] rounded-xl overflow-hidden shadow-xl"
              >
                <Image
                  src="/images/traveler-world.jpg"
                  alt="WanderWave global travel"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          </div>

          {/* Decorative element */}
          <div className="absolute top-1/2 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-teal-100 blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-teal-200 blur-2xl opacity-20"></div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-gray-50">
          <div className="container px-4 mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-8 md:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  custom={index}
                  className="text-center p-6 bg-white rounded-xl shadow-sm"
                >
                  <h3 className="mb-2 text-4xl font-bold text-teal-600">{stat.number}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto mb-16 text-center"
            >
              <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-teal-600 uppercase bg-teal-50 rounded-full">Features</span>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Everything You Need for Group Travel</h2>
              <p className="text-xl text-gray-600">
                Our comprehensive platform streamlines every aspect of planning trips with friends and family.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  custom={index}
                  className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-teal-50">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Travel Illustrations Section */}
        <section className="py-20 bg-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white to-transparent"></div>
          <div className="container px-4 mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="max-w-lg"
              >
                <Image
                  src="/images/travel-icons.jpg"
                  alt="Travel essentials"
                  width={500}
                  height={400}
                  className="rounded-xl shadow-lg"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="flex flex-col justify-center"
              >
                <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">How It Works</span>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
                  Easy As <span className="text-teal-600">1-2-3</span>
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Getting started with WanderWave is simple. Create your trip, invite your friends, and start planning together.
                </p>

                <div className="mt-8 space-y-6">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-600 font-bold mr-4">1</div>
                    <div>
                      <h3 className="text-xl font-semibold">Create a Trip</h3>
                      <p className="text-gray-600">Set up your trip with dates, destination, and basic details in just a few clicks.</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-600 font-bold mr-4">2</div>
                    <div>
                      <h3 className="text-xl font-semibold">Invite Friends</h3>
                      <p className="text-gray-600">Add your travel companions by email or username. They'll get instant access to all trip details.</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-600 font-bold mr-4">3</div>
                    <div>
                      <h3 className="text-xl font-semibold">Plan & Enjoy</h3>
                      <p className="text-gray-600">Collaborate on planning, manage expenses, and chat - all within one platform.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Link href="/register">
                    <Button className="bg-teal-500 hover:bg-teal-600 text-white">Start Planning <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-full h-40 bg-gradient-to-t from-white to-transparent"></div>
        </section>

        {/* Testimonials section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto mb-16 text-center"
            >
              <span className="inline-block px-4 py-1.5 mb-5 text-xs font-medium tracking-wider text-teal-300 uppercase bg-teal-900/50 rounded-full border border-teal-800">
                Testimonials
              </span>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">What Our Users Say</h2>
              <p className="text-lg text-gray-400">
                Thousands of travelers are using WanderWave to simplify their group travel planning.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  className="p-6 bg-slate-800 rounded-xl border border-slate-700"
                >
                  <div className="flex items-center mb-4">
                    <div className="relative w-12 h-12 mr-4 overflow-hidden rounded-full border-2 border-teal-500">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-teal-300">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="inline-block w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300">"{testimonial.content}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-teal-600 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white"></div>
            <div className="absolute top-1/4 right-0 w-60 h-60 rounded-full bg-white"></div>
            <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white"></div>
          </div>

          <div className="container px-4 mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Plan Your Next Adventure?</h2>
              <p className="mb-8 text-xl text-white/90">
                Join thousands of travelers who use WanderWave to make group travel planning simple and stress-free.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {status === "authenticated" ? (
                  <Link href="/trips/new">
                    <Button size="lg" className="px-8 bg-white text-teal-700 hover:bg-white/90">
                      Create Your First Trip <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="px-8 bg-white text-teal-700 hover:bg-white/90">
                        Sign Up Free <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="px-8 border-white text-white hover:bg-white/10">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </LoaderWrapper>
  )
}
