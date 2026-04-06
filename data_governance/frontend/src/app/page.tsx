'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Database, GitBranch, Search, Shield, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth scroll progress for easing
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Parallax transforms
  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);

  const section1Y = useTransform(smoothProgress, [0.1, 0.4], [100, 0]);
  const section1Opacity = useTransform(smoothProgress, [0.1, 0.3], [0, 1]);
  const section2Y = useTransform(smoothProgress, [0.2, 0.5], [100, 0]);
  const section2Opacity = useTransform(smoothProgress, [0.2, 0.4], [0, 1]);

  const ctaY = useTransform(smoothProgress, [0.5, 0.8], [50, 0]);
  const ctaOpacity = useTransform(smoothProgress, [0.5, 0.7], [0, 1]);

  // Background floating element (parallax)
  const bgX = useTransform(smoothProgress, [0, 1], [0, 200]);
  const bgY = useTransform(smoothProgress, [0, 1], [0, -100]);

  const functionalRules = [
    { href: '/processes/duplicate_items', label: 'Duplicate Items', icon: Database, description: 'Identify duplicate entries across procurement data with advanced matching.' },
    { href: '/processes/color_variants', label: 'Color Variants', icon: GitBranch, description: 'Detect color variations that cause data fragmentation.' },
    { href: '/processes/same_style_diff_design', label: 'Same Style, Diff Design', icon: Sparkles, description: 'Find items with identical style but different designs.' },
  ];

  const anomalyDetection = [
    { href: '/anomaly_finder/fuzzy', label: 'Fuzzy Matching', icon: Search, description: 'Find near-duplicate entries using probabilistic matching.' },
    { href: '/anomaly_finder/regex', label: 'Regex Pattern', icon: Shield, description: 'Use regex patterns to uncover data inconsistencies.' },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Subtle background parallax element */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="fixed top-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-gray-200/30 to-gray-300/20 rounded-full blur-3xl -z-10"
      />

      {/* Foreground content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 pt-32 pb-20 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 shadow-sm mb-6">
            <Zap className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Data Governance Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
            Ensure Data Integrity with
            <br />
            Advanced Governance Tools
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Detect duplicates, identify anomalies, and maintain data quality across your enterprise systems.
            Our suite of intelligent tools helps you eliminate redundancy and drive better decisions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/processes/duplicate_items"
              className="group inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-all duration-200"
            >
              Launch Duplicate Items
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/anomaly_finder/fuzzy"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Try Fuzzy Matching
            </Link>
          </div>
        </motion.div>

        {/* Functional Rules */}
        <motion.div
          style={{ y: section1Y, opacity: section1Opacity }}
          className="container mx-auto px-4 py-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Functional Rules</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Identify and resolve duplicate entries across your procurement data.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {functionalRules.map((rule, idx) => (
              <Link key={rule.href} href={rule.href} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 mb-4 group-hover:scale-110 transition-transform">
                    <rule.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{rule.label}</h3>
                  <p className="text-gray-600 leading-relaxed">{rule.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Anomaly Detection */}
        <motion.div
          style={{ y: section2Y, opacity: section2Opacity }}
          className="container mx-auto px-4 py-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Data Anomaly Detection</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Uncover hidden patterns and inconsistencies with advanced detection techniques.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {anomalyDetection.map((tool, idx) => (
              <Link key={tool.href} href={tool.href} className="block">
                <motion.div
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 mb-4 group-hover:scale-110 transition-transform">
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.label}</h3>
                  <p className="text-gray-600 leading-relaxed">{tool.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          style={{ y: ctaY, opacity: ctaOpacity }}
          className="container mx-auto px-4 py-20 text-center"
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ready to clean your data?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start identifying duplicates and anomalies in your procurement data today.
            </p>
            <div className="mt-8">
              <Link
                href="/processes/duplicate_items"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-all duration-200"
              >
                Launch Tool Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Data Governance Platform. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}