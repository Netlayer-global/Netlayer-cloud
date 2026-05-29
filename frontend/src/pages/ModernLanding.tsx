import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { NeonButton } from '../components/landing/NeonButton';
import { NeonCard } from '../components/landing/NeonCard';
import { NeonGradientText } from '../components/landing/NeonGradientText';
import toast from 'react-hot-toast';

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
  color?: string;
}

interface PricingPlan {
  id: number;
  name: string;
  price: string | number;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
}

interface Stat {
  id: number;
  value: string;
  label: string;
  icon: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  text: string;
  avatar: string;
  rating: number;
}

export default function ModernLanding() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pricing, setPricing] = useState<PricingPlan[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuresRes, pricingRes, statsRes, testimonialsRes] = await Promise.all([
          fetch('http://localhost:3000/api/website/features'),
          fetch('http://localhost:3000/api/website/pricing'),
          fetch('http://localhost:3000/api/website/stats'),
          fetch('http://localhost:3000/api/website/testimonials'),
        ]);

        const featuresData = await featuresRes.json();
        const pricingData = await pricingRes.json();
        const statsData = await statsRes.json();
        const testimonialsData = await testimonialsRes.json();

        if (featuresData.success) setFeatures(featuresData.data);
        if (pricingData.success) setPricing(pricingData.data);
        if (statsData.success) setStats(statsData.data);
        if (testimonialsData.success) setTestimonials(testimonialsData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load website data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/website/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Successfully subscribed!');
        setEmail('');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/website/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Message sent successfully!');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading && stats.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
          <p className="mt-4 text-neon-cyan">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark-bg/80 backdrop-blur-md border-b border-neon-cyan/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold neon-text-cyan"
          >
            NetLayer
          </motion.div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="hover:text-neon-cyan transition">Features</a>
            <a href="#pricing" className="hover:text-neon-cyan transition">Pricing</a>
            <a href="#contact" className="hover:text-neon-cyan transition">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-pink/10"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <NeonGradientText>Infrastructure</NeonGradientText> That
                <br />
                <span className="neon-text-mixed"> Scales with You</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Experience blazing-fast cloud infrastructure powered by 50+ global data centers. Scale from startup to enterprise without breaking a sweat.
              </p>
              <div className="flex gap-4 flex-wrap">
                <NeonButton variant="cyan" size="lg" className="gap-2">
                  Get Started <FiArrowRight />
                </NeonButton>
                <NeonButton variant="cyan" size="lg">
                  Watch Demo
                </NeonButton>
              </div>
            </motion.div>

            {/* 3D Spline Component or Fallback */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-96 rounded-2xl overflow-hidden bg-dark-card border border-neon-cyan/20 relative"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-pink/30 flex items-center justify-center animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink opacity-80"></div>
                  </div>
                  <p className="text-sm text-gray-400">3D Cloud Infrastructure</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-7xl mx-auto mt-32"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <NeonCard key={stat.id} variant="cyan" className="text-center p-6">
                <div className="text-4xl font-bold neon-text-cyan mb-2">
                  {stat.value}
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </NeonCard>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <NeonGradientText>Powerful Features</NeonGradientText>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to build, deploy, and scale your applications globally.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const variant = (feature.color as 'cyan' | 'pink' | 'purple' | undefined) || 'cyan';
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <NeonCard variant={variant} className="h-full p-8">
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <NeonGradientText>Simple, Transparent Pricing</NeonGradientText>
            </h2>
            <p className="text-gray-400 text-lg">No hidden fees. Pay only for what you use.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, i) => {
              const variant = (plan.popular ? 'pink' : 'cyan') as 'cyan' | 'pink' | 'purple';
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={plan.popular ? 'md:scale-105 md:-translate-y-4' : ''}
                >
                  <NeonCard variant={variant} className="h-full p-8 flex flex-col">
                  {plan.popular && (
                    <div className="bg-neon-pink/20 text-neon-pink px-3 py-1 rounded-full text-sm font-bold w-fit mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.period !== 'custom' && <span className="text-gray-400 ml-2">/{plan.period}</span>}
                  </div>
                  <NeonButton variant={plan.popular ? 'pink' : 'cyan'} className="w-full mb-8">
                    {plan.cta}
                  </NeonButton>
                  <div className="space-y-4 flex-1">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-3">
                        <FiCheck className="text-neon-cyan flex-shrink-0 mt-1" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <NeonGradientText>Loved by Developers</NeonGradientText>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <NeonCard variant="cyan" className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-neon-cyan">★</span>
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <NeonGradientText>Get in Touch</NeonGradientText>
            </h2>
            <p className="text-gray-400 text-lg">Have questions? Our team is here to help.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Contact Form */}
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              onSubmit={handleContactSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-card border border-neon-cyan/20 rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-card border border-neon-cyan/20 rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-card border border-neon-cyan/20 rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition"
                  placeholder="Subject"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-card border border-neon-cyan/20 rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition h-32 resize-none"
                  placeholder="Your message"
                  required
                ></textarea>
              </div>
              <button type="submit" className="w-full px-6 py-3 bg-transparent border border-neon-cyan text-neon-cyan rounded-lg hover:shadow-glow-cyan-lg transition">
                Send Message
              </button>
            </motion.form>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <NeonCard variant="cyan" className="p-8 flex gap-4">
                <FiPhone className="text-2xl text-neon-cyan flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Phone</h4>
                  <p className="text-gray-400">+1 (555) 123-4567</p>
                </div>
              </NeonCard>
              <NeonCard variant="pink" className="p-8 flex gap-4">
                <FiMail className="text-2xl text-neon-pink flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Email</h4>
                  <p className="text-gray-400">support@netlayer.com</p>
                </div>
              </NeonCard>
              <NeonCard variant="purple" className="p-8 flex gap-4">
                <FiMapPin className="text-2xl text-neon-purple flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Office</h4>
                  <p className="text-gray-400">123 Tech Street, San Francisco, CA</p>
                </div>
              </NeonCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-dark-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-pink/5"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated with <NeonGradientText>Latest News</NeonGradientText>
            </h2>
            <p className="text-gray-400 mb-8">Get the latest updates on new features and infrastructure improvements.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-6 py-3 bg-dark-bg border border-neon-cyan/20 rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition"
                required
              />
              <button type="submit" className="px-8 py-3 bg-transparent border border-neon-cyan text-neon-cyan rounded-lg hover:shadow-glow-cyan-lg transition">
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-card/50 border-t border-neon-cyan/20 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 neon-text-cyan">NetLayer</h3>
              <p className="text-gray-400">Next-generation cloud infrastructure for modern applications.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-neon-cyan transition">Features</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition">Pricing</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-neon-cyan transition">About</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition">Contact</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-neon-cyan transition">Privacy</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition">Terms</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neon-cyan/20 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NetLayer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
