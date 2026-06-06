'use client'

import Link from "next/link"
import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { ArrowRight, Bot, CheckCircle2, Sparkles, Target, Trophy, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"


// --- COMPONENTS ---

function Hero() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [0, 10])

  return (
    <section ref={containerRef} className="relative min-h-[110vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <div className="container px-4 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-3 py-1 text-xs font-medium bg-zinc-100 border border-zinc-200 rounded-full text-zinc-600 mb-6 inline-block">
            🚀 The Future of Personal Growth
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6">
            Turn your life into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              your greatest quest.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-8">
            Hivemind combines AI coaching, gamified milestones, and a supportive community to help you achieve your goals faster than ever before.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="rounded-full h-12 px-8 text-base bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base border-zinc-200 hover:bg-zinc-50">
                Log In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 3D Dashboard Preview */}
      <motion.div
        style={{ y, opacity, scale, rotateX, perspective: 1000 }}
        className="container mt-16 relative z-10 max-w-5xl"
      >
        <div className="relative rounded-xl border border-zinc-200 bg-white/50 backdrop-blur-sm shadow-2xl overflow-hidden p-2">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-transparent to-transparent z-10 pointer-events-none" />
          <img
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
            alt="Dashboard Preview"
            className="rounded-lg shadow-inner w-full object-cover opacity-90 border border-zinc-100"
          />

          {/* Floating UI Elements (Decoration) */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-6 top-10 bg-white p-4 rounded-xl shadow-xl border border-zinc-100 hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full"><Trophy className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-zinc-500">Quest Completed</p>
                <p className="text-sm font-bold">+500 XP</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-6 bottom-20 bg-white p-4 rounded-xl shadow-xl border border-zinc-100 hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full"><Bot className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-zinc-500">AI Assistant</p>
                <p className="text-sm font-bold">"You're on fire today!"</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

function Features() {
  return (
    <section className="py-24 bg-zinc-50">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything you need to level up</h2>
          <p className="text-zinc-500 text-lg">Hivemind isn't just a todo list. It's a complete operating system for your personal development.</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* Card 1: Large Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Milestones & Quests</h3>
              <p className="text-zinc-500 max-w-md">Break down impossible goals into manageable quests. Track your progress visually and earn XP for every step you take.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* Card 2: Small Right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900 text-white rounded-3xl p-8 shadow-sm relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">AI Coach</h3>
              <p className="text-zinc-400">Stuck? Our AI analyzes your goals and generates custom quests for you.</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* Card 3: Small Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Community</h3>
              <p className="text-zinc-500">Follow friends, share achievements, and climb the leaderboard.</p>
            </div>
          </motion.div>

          {/* Card 4: Large Right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 border border-zinc-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Real-time Analytics</h3>
              <p className="text-zinc-500 max-w-md">Visualize your productivity with beautiful charts. See your XP growth, completed tasks, and streak history.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="py-20 border-y border-zinc-100 bg-white">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Active Users", value: "10k+" },
            { label: "Quests Completed", value: "1.2M" },
            { label: "Goals Smashed", value: "50k+" },
            { label: "AI Interactions", value: "500k+" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900 z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />

      <div className="container px-4 mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to change your life?
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
            Join thousands of others who are turning their dreams into actionable quests today.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-zinc-200">
              Get Started for Free
            </Button>
          </Link>
          <p className="mt-6 text-xs text-zinc-500">No credit card required • Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-zinc-100">
      <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-gray-600 text-white p-1.5 rounded-lg">
            <Image src="/favicon.ico" alt="Hivemind Logo" height={20} width={20} />
          </div>
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            Hivemind
          </Link>
        </div>
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Hivemind Inc. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm font-medium text-zinc-500">
          <Link href="#" className="hover:text-black">Privacy</Link>
          <Link href="#" className="hover:text-black">Terms</Link>
          <Link href="#" className="hover:text-black">Twitter</Link>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Stats />
      <Features />
      <CTA />
      <Footer />
    </main>
  )
}