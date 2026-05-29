import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Menu, X, Github, Twitter, Linkedin, Mail, Zap, Shield, 
  Globe, Cpu, Database, Network, Cloud, Check, ChevronRight, Sparkles,
  Activity, Clock, Rocket, BarChart3, TrendingUp
} from 'lucide-react';

import { NeonButton } from '../../components/landing/NeonButton';
import { NeonCard } from '../../components/landing/NeonCard';
import { AnimatedCounter } from '../../components/landing/AnimatedCounter';
import { NeonGradientText } from '../../components/landing/NeonGradientText';

// Hero Section
const HeroSection = () => {
  return (
    <motion.section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-pink opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-neon-purple opacity-15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/30 bg-dark-card/50 backdrop-blur">
            <Sparkles className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm text-neon-cyan">Welcome to the Future of Cloud</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <NeonGradientText variant="mixed" glowing>
              Powerful
            </NeonGradientText>
            <br />
            <span className="text-white">Cloud Infrastructure</span>
            <br />
            <NeonGradientText variant="cyan" glowing>
              Made Simple
            </NeonGradientText>
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Deploy, scale, and manage your infrastructure with blazing-fast performance and enterprise-grade reliability. No complexity. Just results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <NeonButton variant="mixed" size="lg">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </NeonButton>
            </Link>
            <Link to="/features">
              <NeonButton variant="cyan" size="lg">
                Explore Features
              </NeonButton>
            </Link>
          </div>
        </motion.div>

        {/* Stats preview */}
        <motion.div
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-neon-cyan mb-2">
              <AnimatedCounter end={99.9} suffix="%" />
            </div>
            <p className="text-gray-400 text-sm">Uptime SLA</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-neon-pink mb-2">
              <AnimatedCounter end={50} suffix="+" />
            </div>
            <p className="text-gray-400 text-sm">Global Locations</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-neon-purple mb-2">
              <AnimatedCounter end={100000} suffix="+" />
            </div>
            <p className="text-gray-400 text-sm">Active Servers</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: <Cpu className="w-8 h-8" />,
      title: 'High-Performance Computing',
      description: 'Deploy instances with the latest processors and guaranteed performance for your applications.',
      color: 'cyan' as const,
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Global Network',
      description: 'Access data centers across the globe with low-latency connections and high-speed transfers.',
      color: 'pink' as const,
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'Advanced DDoS protection, firewalls, and compliance with industry standards built-in.',
      color: 'purple' as const,
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: 'Managed Databases',
      description: 'PostgreSQL, MySQL, and Redis with automatic backups and high availability.',
      color: 'cyan' as const,
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: 'Networking & CDN',
      description: 'Load balancers, VPCs, and content delivery networks for optimal performance.',
      color: 'pink' as const,
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: 'Object Storage',
      description: 'Scalable S3-compatible storage for all your files and media needs.',
      color: 'purple' as const,
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-dark-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comprehensive tools and services to build, deploy, and scale your infrastructure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <NeonCard variant={feature.color} hoverable>
                <div className="flex items-start gap-4">
                  <div className={`text-neon-${feature.color} flex-shrink-0 mt-1`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </NeonCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$10',
      period: '/month',
      description: 'Perfect for small projects',
      features: [
        '1 Cloud Compute',
        '100 GB Storage',
        'Community Support',
        'Basic Analytics',
      ],
      cta: 'Start Now',
      highlighted: false,
      color: 'cyan' as const,
    },
    {
      name: 'Professional',
      price: '$50',
      period: '/month',
      description: 'For growing applications',
      features: [
        '5 Cloud Computes',
        '500 GB Storage',
        'Priority Support',
        'Advanced Analytics',
        'Custom Domains',
      ],
      cta: 'Get Started',
      highlighted: true,
      color: 'pink' as const,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large-scale operations',
      features: [
        'Unlimited Resources',
        'Dedicated Support',
        'Custom SLA',
        'Advanced Security',
        'API Access',
      ],
      cta: 'Contact Sales',
      highlighted: false,
      color: 'purple' as const,
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-dark-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose a plan that scales with your needs. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className={plan.highlighted ? 'md:scale-105' : ''}
            >
              <NeonCard variant={plan.color} hoverable className={plan.highlighted ? 'relative' : ''}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-neon-cyan to-neon-pink rounded-full text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-white">
                      {plan.price}
                      <span className="text-lg text-gray-400 ml-2">{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <NeonButton variant={plan.color} size="md" className="w-full">
                    {plan.cta}
                  </NeonButton>
                </div>
              </NeonCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  return (
    <motion.section
      className="relative py-20 px-4 sm:px-6 lg:px-8 bg-dark-bg overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-neon-pink opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-neon-purple opacity-20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          Ready to <NeonGradientText variant="cyan">elevate</NeonGradientText> your infrastructure?
        </h2>
        <p className="text-xl text-gray-400 mb-12">
          Join thousands of developers and businesses that trust us with their cloud infrastructure.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <NeonButton variant="mixed" size="lg">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </NeonButton>
          </Link>
          <a href="mailto:sales@netlayer.io">
            <NeonButton variant="cyan" size="lg">
              Contact Sales
            </NeonButton>
          </a>
        </div>
      </div>
    </motion.section>
  );
};

// Navigation
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur border-b border-neon-cyan/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-pink rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white hidden sm:inline">NetLayer</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-gray-300 hover:text-neon-cyan transition">Features</Link>
            <Link to="/pricing" className="text-gray-300 hover:text-neon-cyan transition">Pricing</Link>
            <Link to="/docs" className="text-gray-300 hover:text-neon-cyan transition">Docs</Link>
            <Link to="/blog" className="text-gray-300 hover:text-neon-cyan transition">Blog</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <NeonButton variant="cyan" size="sm">Login</NeonButton>
            </Link>
            <Link to="/register">
              <NeonButton variant="pink" size="sm">Sign Up</NeonButton>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-neon-cyan"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-neon-cyan/20">
            <Link to="/features" className="block py-2 text-gray-300 hover:text-neon-cyan">Features</Link>
            <Link to="/pricing" className="block py-2 text-gray-300 hover:text-neon-cyan">Pricing</Link>
            <Link to="/docs" className="block py-2 text-gray-300 hover:text-neon-cyan">Docs</Link>
            <Link to="/blog" className="block py-2 text-gray-300 hover:text-neon-cyan">Blog</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-dark-bg border-t border-neon-cyan/20 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-pink rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">NetLayer</span>
            </div>
            <p className="text-gray-400">Next-generation cloud infrastructure platform.</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-gray-400 hover:text-neon-cyan">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-neon-cyan">Pricing</Link></li>
              <li><Link to="/docs" className="text-gray-400 hover:text-neon-cyan">Documentation</Link></li>
              <li><Link to="/status" className="text-gray-400 hover:text-neon-cyan">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-neon-cyan">About</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-neon-cyan">Blog</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-neon-cyan">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-neon-cyan">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/legal/privacy" className="text-gray-400 hover:text-neon-cyan">Privacy</Link></li>
              <li><Link to="/legal/terms" className="text-gray-400 hover:text-neon-cyan">Terms</Link></li>
              <li><a href="mailto:legal@netlayer.io" className="text-gray-400 hover:text-neon-cyan">Legal</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neon-cyan/20 pt-12 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">&copy; 2024 NetLayer. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-neon-cyan"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-neon-cyan"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-neon-cyan"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Component
export default function NeonLanding() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />
      <div className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}
