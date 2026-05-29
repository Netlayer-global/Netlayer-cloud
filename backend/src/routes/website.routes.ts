import { Router } from 'express';

const router = Router();

// Features endpoint
router.get('/features', async (req, res) => {
  try {
    const features = [
      {
        id: 1,
        title: 'Lightning Fast Performance',
        description: 'Global network with 99.99% uptime SLA',
        icon: 'lightning',
        color: 'cyan'
      },
      {
        id: 2,
        title: 'Enterprise Security',
        description: 'DDoS protection, firewalls, and compliance',
        icon: 'shield',
        color: 'pink'
      },
      {
        id: 3,
        title: 'Instant Scaling',
        description: 'Auto-scaling infrastructure for any workload',
        icon: 'scale',
        color: 'purple'
      },
      {
        id: 4,
        title: '24/7 Support',
        description: 'Expert support team available round the clock',
        icon: 'headset',
        color: 'cyan'
      },
      {
        id: 5,
        title: 'Global Presence',
        description: '50+ data centers across all continents',
        icon: 'globe',
        color: 'pink'
      },
      {
        id: 6,
        title: 'Easy Integration',
        description: 'Simple APIs and CLI tools for developers',
        icon: 'code',
        color: 'purple'
      }
    ];
    res.json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch features' });
  }
});

// Pricing endpoint
router.get('/pricing', async (req, res) => {
  try {
    const pricing = [
      {
        id: 1,
        name: 'Starter',
        price: 4.99,
        period: 'month',
        description: 'Perfect for small projects',
        features: [
          '1 vCPU',
          '1 GB RAM',
          '20 GB SSD',
          'Free tier support',
          'Community access'
        ],
        popular: false,
        cta: 'Get Started'
      },
      {
        id: 2,
        name: 'Professional',
        price: 19.99,
        period: 'month',
        description: 'Ideal for growing businesses',
        features: [
          '8 vCPU',
          '32 GB RAM',
          '500 GB SSD',
          'Priority support',
          'Auto-scaling',
          'DDoS protection',
          'Free SSL certificate'
        ],
        popular: true,
        cta: 'Start Free Trial'
      },
      {
        id: 3,
        name: 'Enterprise',
        price: 'Custom',
        period: 'custom',
        description: 'For large-scale operations',
        features: [
          'Unlimited vCPU',
          'Unlimited RAM',
          'Unlimited Storage',
          '24/7 Dedicated support',
          'Custom SLA',
          'Advanced security',
          'Load balancing'
        ],
        popular: false,
        cta: 'Contact Sales'
      }
    ];
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pricing' });
  }
});

// Statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = [
      {
        id: 1,
        value: '99.99%',
        label: 'Uptime SLA',
        icon: 'trending-up'
      },
      {
        id: 2,
        value: '50+',
        label: 'Global Locations',
        icon: 'globe'
      },
      {
        id: 3,
        value: '100K+',
        label: 'Active Servers',
        icon: 'cpu'
      },
      {
        id: 4,
        value: '1M+',
        label: 'Happy Customers',
        icon: 'users'
      }
    ];
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Testimonials endpoint
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = [
      {
        id: 1,
        name: 'Sarah Chen',
        role: 'CEO at TechStart',
        company: 'TechStart Inc',
        text: 'The infrastructure is rock solid. We scaled from 1000 to 1M users without a single downtime.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        rating: 5
      },
      {
        id: 2,
        name: 'Marcus Johnson',
        role: 'DevOps Lead at CloudFlow',
        company: 'CloudFlow Systems',
        text: 'Best deployment experience I\'ve had. The CLI tools are intuitive and powerful.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
        rating: 5
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        role: 'CTO at DataVault',
        company: 'DataVault Solutions',
        text: 'Outstanding support team. They resolved our issue within minutes of reporting.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        rating: 5
      }
    ];
    res.json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch testimonials' });
  }
});

// Contact form endpoint
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Here you would save to database or send email
    console.log('Contact form submission:', { name, email, subject, message });
    
    res.json({ 
      success: true, 
      message: 'Thank you for reaching out. We\'ll be in touch soon!' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit contact form' });
  }
});

// Newsletter subscription endpoint
router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Here you would save to database or send email
    console.log('Newsletter subscription:', { email });
    
    res.json({ 
      success: true, 
      message: 'Successfully subscribed to our newsletter!' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

export default router;
