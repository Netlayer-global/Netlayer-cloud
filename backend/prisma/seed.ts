import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const j = (v: unknown) => JSON.stringify(v)

async function main() {
  console.log('🌱 Seeding NetLayer database...')

  // ─── PLANS ───────────────────────────────────────────
  // Round 23 — yearly = 10 × monthly (2 months free for prepaid yearly)
  const yearly = (m: number) => Math.round(m * 10)
  const computePlans = [
    { name: 'c2.small',   slug: 'c2-small',   cpu: 1,  ramGB: 2,  diskGB: 40,   bandwidthTB: 1,  priceMonthly: 199,  priceHourly: 0.27, priceInr: 199,  isPopular: false, sortOrder: 1 },
    { name: 'c2.medium',  slug: 'c2-medium',  cpu: 2,  ramGB: 4,  diskGB: 80,   bandwidthTB: 2,  priceMonthly: 399,  priceHourly: 0.54, priceInr: 399,  isPopular: false, sortOrder: 2 },
    { name: 'c3.large',   slug: 'c3-large',   cpu: 4,  ramGB: 8,  diskGB: 160,  bandwidthTB: 3,  priceMonthly: 799,  priceHourly: 1.09, priceInr: 799,  isPopular: true,  sortOrder: 3 },
    { name: 'c3.xlarge',  slug: 'c3-xlarge',  cpu: 8,  ramGB: 16, diskGB: 320,  bandwidthTB: 5,  priceMonthly: 1499, priceHourly: 2.05, priceInr: 1499, isPopular: false, sortOrder: 4 },
    { name: 'c4.2xlarge', slug: 'c4-2xlarge', cpu: 16, ramGB: 32, diskGB: 640,  bandwidthTB: 8,  priceMonthly: 2999, priceHourly: 4.10, priceInr: 2999, isPopular: false, sortOrder: 5 },
    { name: 'c4.4xlarge', slug: 'c4-4xlarge', cpu: 32, ramGB: 64, diskGB: 1280, bandwidthTB: 10, priceMonthly: 5999, priceHourly: 8.21, priceInr: 5999, isPopular: false, sortOrder: 6 },
  ].map((p) => ({
    ...p,
    category: 'compute',
    priceYearly: yearly(p.priceMonthly),
    yearlyEnabled: true,
    diskType: 'nvme',
    diskCount: 1,
    raidSupported: '[]',
    stockTotal: 0, // unlimited
  }))

  // Bare-metal plans (latitude.sh / OVH-style dedicated servers)
  const bareMetalPlans = [
    {
      name: 'bm.epyc-1', slug: 'bm-epyc-1', category: 'bare-metal',
      cpu: 16, ramGB: 64, diskGB: 1920, bandwidthTB: 20,
      priceMonthly: 14999, priceHourly: 0, priceInr: 14999, priceYearly: yearly(14999),
      hourlyEnabled: false, monthlyEnabled: true, yearlyEnabled: true,
      cpuModel: 'AMD EPYC 7402P', cpuCores: 16, cpuThreads: 32,
      diskType: 'nvme', diskCount: 2, raidSupported: '["raid0","raid1"]',
      ipv4Included: 1, ipv6Included: 1, stockTotal: 4,
      sortOrder: 100, isActive: true, isPopular: false,
    },
    {
      name: 'bm.epyc-2', slug: 'bm-epyc-2', category: 'bare-metal',
      cpu: 32, ramGB: 128, diskGB: 3840, bandwidthTB: 30,
      priceMonthly: 24999, priceHourly: 0, priceInr: 24999, priceYearly: yearly(24999),
      hourlyEnabled: false, monthlyEnabled: true, yearlyEnabled: true,
      cpuModel: 'AMD EPYC 7543P', cpuCores: 32, cpuThreads: 64,
      diskType: 'nvme', diskCount: 4, raidSupported: '["raid0","raid1","raid10"]',
      ipv4Included: 1, ipv6Included: 1, stockTotal: 2,
      sortOrder: 101, isActive: true, isPopular: true,
    },
    {
      name: 'bm.gpu-l40', slug: 'bm-gpu-l40', category: 'bare-metal',
      cpu: 32, ramGB: 256, diskGB: 7680, bandwidthTB: 50,
      priceMonthly: 89999, priceHourly: 0, priceInr: 89999, priceYearly: yearly(89999),
      hourlyEnabled: false, monthlyEnabled: true, yearlyEnabled: true,
      cpuModel: 'Intel Xeon Gold 6448Y + 1× NVIDIA L40 48GB', cpuCores: 32, cpuThreads: 64,
      diskType: 'nvme', diskCount: 2, raidSupported: '["raid0","raid1"]',
      ipv4Included: 1, ipv6Included: 1, stockTotal: 1,
      sortOrder: 200, isActive: true, isPopular: false,
    },
  ]

  const plans = [...computePlans, ...bareMetalPlans]
  for (const p of plans) await prisma.plan.upsert({ where: { slug: p.slug }, update: p as any, create: p as any })
  console.log(`✓ ${plans.length} plans (${computePlans.length} compute + ${bareMetalPlans.length} bare-metal)`)

  // ─── REGIONS ─────────────────────────────────────────
  const regions = [
    // Asia
    { name: 'Mumbai',    slug: 'mumbai',    country: 'India',     countryCode: 'IN', city: 'Mumbai',    flag: '🇮🇳', latencyMs: 12 },
    { name: 'Delhi',     slug: 'delhi',     country: 'India',     countryCode: 'IN', city: 'Delhi',     flag: '🇮🇳', latencyMs: 18 },
    { name: 'Singapore', slug: 'singapore', country: 'Singapore', countryCode: 'SG', city: 'Singapore', flag: '🇸🇬', latencyMs: 45 },
    { name: 'Tokyo',     slug: 'tokyo',     country: 'Japan',     countryCode: 'JP', city: 'Tokyo',     flag: '🇯🇵', latencyMs: 70 },
    { name: 'Seoul',     slug: 'seoul',     country: 'Korea',     countryCode: 'KR', city: 'Seoul',     flag: '🇰🇷', latencyMs: 75 },
    { name: 'Sydney',    slug: 'sydney',    country: 'Australia', countryCode: 'AU', city: 'Sydney',    flag: '🇦🇺', latencyMs: 130 },
    // Europe
    { name: 'Frankfurt', slug: 'frankfurt', country: 'Germany',   countryCode: 'DE', city: 'Frankfurt', flag: '🇩🇪', latencyMs: 110 },
    { name: 'London',    slug: 'london',    country: 'UK',        countryCode: 'GB', city: 'London',    flag: '🇬🇧', latencyMs: 115 },
    { name: 'Paris',     slug: 'paris',     country: 'France',    countryCode: 'FR', city: 'Paris',     flag: '🇫🇷', latencyMs: 112 },
    { name: 'Amsterdam', slug: 'amsterdam', country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', flag: '🇳🇱', latencyMs: 108 },
    // Americas
    { name: 'New York',  slug: 'new-york',  country: 'USA',       countryCode: 'US', city: 'New York',  flag: '🇺🇸', latencyMs: 180 },
    { name: 'Chicago',   slug: 'chicago',   country: 'USA',       countryCode: 'US', city: 'Chicago',   flag: '🇺🇸', latencyMs: 195 },
    { name: 'Los Angeles', slug: 'los-angeles', country: 'USA',   countryCode: 'US', city: 'Los Angeles', flag: '🇺🇸', latencyMs: 220 },
    { name: 'São Paulo', slug: 'sao-paulo', country: 'Brazil',    countryCode: 'BR', city: 'São Paulo', flag: '🇧🇷', latencyMs: 290 },
    // Middle East
    { name: 'Dubai',     slug: 'dubai',     country: 'UAE',       countryCode: 'AE', city: 'Dubai',     flag: '🇦🇪', latencyMs: 95 },
  ]
  for (const r of regions) await prisma.region.upsert({ where: { slug: r.slug }, update: r, create: r })
  console.log(`✓ ${regions.length} regions`)

  // ─── OS TEMPLATES ────────────────────────────────────
  const osTemplates = [
    { name: 'Ubuntu 22.04 LTS',    slug: 'ubuntu-22-04', version: '22.04', family: 'LINUX',   logo: 'ubuntu',    proxmoxId: 'ubuntu-22.04-standard' },
    { name: 'Ubuntu 20.04 LTS',    slug: 'ubuntu-20-04', version: '20.04', family: 'LINUX',   logo: 'ubuntu',    proxmoxId: 'ubuntu-20.04-standard' },
    { name: 'Debian 12',           slug: 'debian-12',    version: '12',    family: 'LINUX',   logo: 'debian',    proxmoxId: 'debian-12-standard' },
    { name: 'Debian 11',           slug: 'debian-11',    version: '11',    family: 'LINUX',   logo: 'debian',    proxmoxId: 'debian-11-standard' },
    { name: 'CentOS Stream 9',     slug: 'centos-9',     version: '9',     family: 'LINUX',   logo: 'centos',    proxmoxId: 'centos-stream-9' },
    { name: 'AlmaLinux 9',         slug: 'almalinux-9',  version: '9',     family: 'LINUX',   logo: 'almalinux', proxmoxId: 'almalinux-9' },
    { name: 'Fedora 39',           slug: 'fedora-39',    version: '39',    family: 'LINUX',   logo: 'fedora',    proxmoxId: 'fedora-39' },
    { name: 'Windows Server 2022', slug: 'win-2022',     version: '2022',  family: 'WINDOWS', logo: 'windows',   proxmoxId: 'win-server-2022' },
  ]
  for (const o of osTemplates) await prisma.osTemplate.upsert({ where: { slug: o.slug }, update: o, create: o })
  console.log(`✓ ${osTemplates.length} OS templates`)

  // ─── DEMO NODE (Mumbai) ──────────────────────────────
  const mumbai = await prisma.region.findUnique({ where: { slug: 'mumbai' } })
  if (mumbai) {
    await prisma.node.upsert({
      where: { slug: 'mumbai-node-01' },
      update: {},
      create: {
        name: 'Mumbai Node 01',
        slug: 'mumbai-node-01',
        regionId: mumbai.id,
        proxmoxHost: 'https://mock.netlayer.com:8006',
        proxmoxNode: 'pve',
        proxmoxTokenId: 'netlayer@pam!api',
        proxmoxTokenSecret: 'mock-secret',
        totalCpu: 32,
        totalRamGB: 128,
        totalDiskGB: 3840,
        maxVMs: 50,
        networkGbps: 10,
        ipRanges: j(['103.21.148.0/24']),
        status: 'ONLINE',
      },
    })
    console.log('✓ Demo node (Mumbai)')
  }

  // ─── ROLES ───────────────────────────────────────────
  const roles = [
    {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full platform access, including role management.',
      permissions: ['*'],
      isSystem: true,
    },
    {
      name: 'admin',
      displayName: 'Admin',
      description: 'Full admin access except role:delete.',
      permissions: [
        'admin:access', 'admin:integrations', 'admin:settings',
        'users:view', 'users:edit', 'users:suspend', 'users:delete',
        'servers:view', 'servers:create', 'servers:delete', 'servers:power', 'servers:all',
        'billing:view', 'billing:edit', 'billing:refund',
        'nodes:view', 'nodes:edit', 'nodes:add', 'nodes:delete',
        'tickets:view', 'tickets:reply', 'tickets:assign', 'tickets:close',
        'announcements:manage', 'audit:view',
      ],
      isSystem: true,
    },
    {
      name: 'support',
      displayName: 'Support',
      description: 'Handle user support tickets.',
      permissions: ['admin:access', 'tickets:view', 'tickets:reply', 'tickets:assign', 'users:view', 'servers:view'],
      isSystem: true,
    },
    {
      name: 'billing',
      displayName: 'Billing',
      description: 'Manage invoices and refunds.',
      permissions: ['admin:access', 'billing:view', 'billing:edit', 'billing:refund', 'users:view'],
      isSystem: true,
    },
    {
      name: 'client',
      displayName: 'Client',
      description: 'Standard end user.',
      permissions: [],
      isSystem: true,
    },
    {
      name: 'reseller',
      displayName: 'Reseller',
      description: 'Resell NetLayer to sub-users.',
      permissions: ['servers:view', 'servers:create'],
      isSystem: false,
    },
  ]
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description, permissions: j(r.permissions) },
      create: { ...r, permissions: j(r.permissions) },
    })
  }
  console.log(`✓ ${roles.length} roles`)

  // ─── USERS ───────────────────────────────────────────
  // billingMode: super/admin staff → wallet (legacy hourly testing path)
  // Real customers default to retail (pay-per-deploy via Razorpay/Stripe)
  const seedUsers = [
    { email: 'super@netlayer.com',   password: 'Super@123456',   firstName: 'Super',   lastName: 'Admin',   role: 'SUPER_ADMIN', balance: 100000, country: 'IN', billingMode: 'wallet' },
    { email: 'admin@netlayer.com',   password: 'Admin@123456',   firstName: 'Admin',   lastName: 'NetLayer', role: 'ADMIN',       balance: 10000,  country: 'IN', billingMode: 'wallet' },
    { email: 'support@netlayer.com', password: 'Support@123456', firstName: 'Support', lastName: 'Agent',    role: 'SUPPORT',     balance: 0,      country: 'IN', billingMode: 'wallet' },
    { email: 'billing@netlayer.com', password: 'Billing@123456', firstName: 'Billing', lastName: 'Agent',    role: 'BILLING',     balance: 0,      country: 'IN', billingMode: 'wallet' },
  ]
  for (const u of seedUsers) {
    const passwordHash = await bcrypt.hash(u.password, 12)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, balance: u.balance, country: u.country, billingMode: u.billingMode },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        emailVerified: true,
        balance: u.balance,
        country: u.country,
        billingMode: u.billingMode,
      },
    })

    const roleSlug =
      u.role === 'SUPER_ADMIN' ? 'super_admin' :
      u.role === 'ADMIN'       ? 'admin' :
      u.role === 'SUPPORT'     ? 'support' :
      u.role === 'BILLING'     ? 'billing' : 'client'
    const role = await prisma.role.findUnique({ where: { name: roleSlug } })
    if (role) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      })
    }
  }
  console.log(`✓ ${seedUsers.length} admin users (+role assignments)`)

  // ─── INTEGRATION CONFIGS ─────────────────────────────
  const configs: Array<[string, any]> = [
    ['cloudflare',       { apiToken: '', zoneId: '', domain: 'netlayer.com', mockMode: true }],
    ['grafana',          { url: 'http://localhost:3001', apiKey: '', orgId: 1, datasourceId: 1, mockMode: true }],
    ['zabbix',           { url: 'http://localhost:8080', user: 'Admin', password: 'zabbix', mockMode: true }],
    ['email.resend',     { apiKey: '', fromName: 'NetLayer', fromEmail: 'noreply@netlayer.com', mockMode: true }],
    ['email.smtp',       { host: '', port: 587, user: '', pass: '', fromEmail: '', tls: true, mockMode: true }],
    ['email.active',     { provider: 'resend' }],
    ['sms.twilio',       { accountSid: '', authToken: '', from: '', mockMode: true }],
    ['sms.msg91',        { apiKey: '', senderId: 'NETLYR', otpTemplateId: '', mockMode: true }],
    ['sms.active',       { provider: 'mock' }],
    ['payment.razorpay', { keyId: '', keySecret: '', webhookSecret: '', mode: 'test', mockMode: true }],
    ['payment.stripe',   { secretKey: '', publishableKey: '', webhookSecret: '', currencies: ['USD','EUR','GBP'], mode: 'test', mockMode: true }],
    ['proxmox',          { defaultStorage: 'local-lvm', defaultBridge: 'vmbr0', cloudInitTemplate: '', mockMode: true }],
    ['platform.general', { name: 'NetLayer', supportEmail: 'support@netlayer.com', supportPhone: '', logoUrl: '' }],
    ['platform.registration', { registrationEnabled: true, emailVerificationRequired: false, maxServersPerUser: 10, allowedCountries: 'all' }],
    ['platform.billing', { defaultCurrency: 'INR', taxRate: 18, taxLabel: 'GST', minBalance: -500, gracePeriodDays: 3, billingCycle: 'monthly', lowBalanceThreshold: 50 }],
    ['platform.security', { jwtExpiryMinutes: 15, maxLoginAttempts: 5, lockDurationMinutes: 30, twoFactorRequiredForAdmins: false }],
    ['platform.maintenance', { enabled: false, message: '' }],
  ]
  for (const [key, value] of configs) {
    await prisma.integrationConfig.upsert({
      where: { key },
      update: { value: j(value) },
      create: { key, value: j(value) },
    })
  }
  console.log(`✓ ${configs.length} integration configs`)

  // ─── EMAIL TEMPLATES ─────────────────────────────────
  const emailTemplates = [
    { slug: 'welcome',           name: 'Welcome',            subject: 'Welcome to NetLayer Cloud',                  htmlBody: '<h2>Hi {{firstName}}!</h2><p>Welcome to NetLayer Cloud.</p><p><a href="{{verifyUrl}}">Verify your email</a></p>', variables: ['firstName', 'verifyUrl'] },
    { slug: 'email-verify',      name: 'Email verification', subject: 'Verify your email',                          htmlBody: '<p>Click to verify: <a href="{{verifyUrl}}">{{verifyUrl}}</a></p>',                                              variables: ['verifyUrl'] },
    { slug: 'password-reset',    name: 'Password reset',     subject: 'Reset your NetLayer password',               htmlBody: '<p>Reset link (1 hour): <a href="{{resetUrl}}">{{resetUrl}}</a></p>',                                            variables: ['resetUrl'] },
    { slug: 'server-ready',      name: 'Server ready',       subject: 'Your server {{name}} is ready 🚀',           htmlBody: '<p>Server <strong>{{name}}</strong> is online.</p><pre>ssh root@{{ipv4}}</pre>',                                  variables: ['name', 'ipv4', 'hostname', 'plan'] },
    { slug: 'server-down',       name: 'Server down',        subject: 'Server {{name}} is down',                    htmlBody: '<p>We detected your server <strong>{{name}}</strong> ({{ipv4}}) is down. We are looking into it.</p>',           variables: ['name', 'ipv4'] },
    { slug: 'server-deleted',    name: 'Server deleted',     subject: 'Server {{name}} deleted',                    htmlBody: '<p>Your server <strong>{{name}}</strong> has been deleted.</p>',                                                  variables: ['name'] },
    { slug: 'invoice-created',   name: 'Invoice created',    subject: 'Invoice {{id}} — ₹{{amount}}',               htmlBody: '<p>New invoice <strong>{{id}}</strong> for ₹{{amount}}, due {{dueDate}}.</p>',                                    variables: ['id', 'amount', 'dueDate'] },
    { slug: 'payment-success',   name: 'Payment success',    subject: 'Payment received — ₹{{amount}}',             htmlBody: '<p>Thanks for your payment of ₹{{amount}}. Invoice <strong>{{id}}</strong> is now paid.</p>',                      variables: ['id', 'amount'] },
    { slug: 'payment-failed',    name: 'Payment failed',     subject: 'Payment failed — invoice {{id}}',            htmlBody: '<p>Payment for invoice <strong>{{id}}</strong> (₹{{amount}}) failed. Please retry.</p>',                          variables: ['id', 'amount'] },
    { slug: 'account-suspended', name: 'Account suspended',  subject: 'Your NetLayer account is suspended',         htmlBody: '<p>Reason: {{reason}}. Contact support.</p>',                                                                     variables: ['reason'] },
    { slug: 'account-activated', name: 'Account activated',  subject: 'Your NetLayer account is active',            htmlBody: '<p>Your account has been re-activated. Welcome back!</p>',                                                       variables: [] },
    { slug: 'low-balance',       name: 'Low balance',        subject: 'Low balance alert',                          htmlBody: '<p>Your NetLayer balance is ₹{{balance}}. Top up to avoid service interruption.</p>',                              variables: ['balance'] },
    { slug: 'ticket-reply',      name: 'Ticket reply',       subject: 'Re: {{subject}}',                            htmlBody: '<p>Support replied to your ticket:</p><blockquote>{{reply}}</blockquote>',                                       variables: ['subject', 'reply'] },
    { slug: 'maintenance-notice', name: 'Maintenance',       subject: 'Scheduled maintenance — {{region}}',         htmlBody: '<p>Maintenance in <strong>{{region}}</strong> at {{time}}. Expected duration: {{duration}}.</p>',                 variables: ['region', 'time', 'duration'] },
  ]
  for (const t of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: t.slug },
      update: { name: t.name, subject: t.subject, htmlBody: t.htmlBody, variables: j(t.variables) },
      create: { ...t, variables: j(t.variables) },
    })
  }
  console.log(`✓ ${emailTemplates.length} email templates`)

  // ─── SMS TEMPLATES ───────────────────────────────────
  const smsTemplates = [
    { slug: 'otp',             name: 'OTP',             body: 'NetLayer OTP: {{otp}}. Valid for 10 minutes.',           variables: ['otp'] },
    { slug: 'server-ready',    name: 'Server ready',    body: 'NetLayer: Server {{name}} is ready! IP: {{ip}}',         variables: ['name', 'ip'] },
    { slug: 'payment-success', name: 'Payment success', body: 'NetLayer: Payment of {{amount}} received. Thank you!',   variables: ['amount'] },
    { slug: 'low-balance',     name: 'Low balance',     body: 'NetLayer: Low balance alert! Current balance: {{balance}}', variables: ['balance'] },
    { slug: 'maintenance',     name: 'Maintenance',     body: 'NetLayer: Maintenance in {{region}} at {{time}}',        variables: ['region', 'time'] },
  ]
  for (const t of smsTemplates) {
    await prisma.smsTemplate.upsert({
      where: { slug: t.slug },
      update: { name: t.name, body: t.body, variables: j(t.variables) },
      create: { ...t, variables: j(t.variables) },
    })
  }
  console.log(`✓ ${smsTemplates.length} SMS templates`)

  // ─── APP TEMPLATES (Marketplace) ────────────────────
  const appTemplates = [
    {
      slug: 'wordpress', name: 'WordPress',
      description: 'World-class CMS. Pre-installed with NGINX, MariaDB, PHP-FPM, and SSL via Certbot.',
      logo: 'wordpress', category: 'CMS', minPlanSlug: 'c2-medium',
      ports: [80, 443],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y nginx mariadb-server php-fpm php-mysql certbot python3-certbot-nginx unzip
mysql -e "CREATE DATABASE wordpress;"
mysql -e "CREATE USER 'wp'@'localhost' IDENTIFIED BY '$(openssl rand -base64 16)';"
mysql -e "GRANT ALL ON wordpress.* TO 'wp'@'localhost'; FLUSH PRIVILEGES;"
cd /var/www && curl -O https://wordpress.org/latest.tar.gz && tar xzf latest.tar.gz
chown -R www-data:www-data /var/www/wordpress
systemctl enable --now nginx php-fpm`,
    },
    {
      slug: 'lamp', name: 'LAMP Stack',
      description: 'Linux + Apache + MySQL + PHP. Classic LAMP with phpMyAdmin pre-configured.',
      logo: 'apache', category: 'Dev Tools', minPlanSlug: 'c2-small',
      ports: [80, 443],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y apache2 mysql-server php php-mysql phpmyadmin libapache2-mod-php
systemctl enable --now apache2 mysql
ln -s /usr/share/phpmyadmin /var/www/html/phpmyadmin`,
    },
    {
      slug: 'lemp', name: 'LEMP Stack',
      description: 'Linux + NGINX + MySQL + PHP. High-performance LEMP stack ready for production sites.',
      logo: 'nginx', category: 'Dev Tools', minPlanSlug: 'c2-small',
      ports: [80, 443],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y nginx mysql-server php-fpm php-mysql
systemctl enable --now nginx mysql php8.1-fpm`,
    },
    {
      slug: 'nodejs', name: 'Node.js',
      description: 'Latest Node.js LTS with PM2 process manager. Perfect for APIs and SSR apps.',
      logo: 'nodejs', category: 'Dev Tools', minPlanSlug: 'c2-small',
      ports: [80, 443, 3000],
      userDataScript: `#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs build-essential nginx
npm install -g pm2
pm2 startup systemd
mkdir -p /var/www/app && cd /var/www/app && npm init -y`,
    },
    {
      slug: 'docker', name: 'Docker CE',
      description: 'Docker Engine + Compose installed. Spin up containers immediately.',
      logo: 'docker', category: 'Dev Tools', minPlanSlug: 'c2-medium',
      ports: [22],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker`,
    },
    {
      slug: 'minecraft', name: 'Minecraft Server',
      description: 'Latest Minecraft Java Edition server (Paper). Tuned for low latency.',
      logo: 'minecraft', category: 'Games', minPlanSlug: 'c3-large',
      ports: [25565],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y openjdk-17-jre-headless screen
useradd -m -d /opt/minecraft minecraft
cd /opt/minecraft
curl -L -o paper.jar "https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/430/downloads/paper-1.20.4-430.jar"
echo "eula=true" > eula.txt
chown -R minecraft:minecraft /opt/minecraft
cat <<EOF > /etc/systemd/system/minecraft.service
[Unit]
Description=Minecraft
After=network.target
[Service]
User=minecraft
WorkingDirectory=/opt/minecraft
ExecStart=/usr/bin/java -Xms2G -Xmx4G -jar paper.jar nogui
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
systemctl enable --now minecraft`,
    },
    {
      slug: 'vscode', name: 'VS Code Server',
      description: 'Browser-based VS Code (code-server) with Caddy reverse proxy and HTTPS.',
      logo: 'vscode', category: 'Dev Tools', minPlanSlug: 'c2-medium',
      ports: [80, 443, 8080],
      userDataScript: `#!/bin/bash
curl -fsSL https://code-server.dev/install.sh | sh
apt-get install -y caddy
systemctl enable --now code-server@root`,
    },
    {
      slug: 'jupyter', name: 'Jupyter Notebook',
      description: 'JupyterLab + scipy stack pre-installed. Great for data science.',
      logo: 'jupyter', category: 'Dev Tools', minPlanSlug: 'c3-large',
      ports: [8888],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y python3-pip
pip3 install jupyterlab numpy scipy pandas scikit-learn matplotlib
jupyter lab --generate-config`,
    },
    {
      slug: 'ghost', name: 'Ghost Blog',
      description: 'Modern publishing platform. Ghost CLI installed with NGINX + MySQL.',
      logo: 'ghost', category: 'CMS', minPlanSlug: 'c2-medium',
      ports: [80, 443, 2368],
      userDataScript: `#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs nginx mysql-server
npm install -g ghost-cli
useradd -m ghost && su - ghost -c "ghost install"`,
    },
    {
      slug: 'gitlab', name: 'GitLab CE',
      description: 'Self-hosted GitLab Community Edition. Full SCM, CI/CD, and registry.',
      logo: 'gitlab', category: 'Dev Tools', minPlanSlug: 'c3-xlarge',
      ports: [22, 80, 443],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y curl openssh-server ca-certificates tzdata perl
curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | bash
EXTERNAL_URL="http://localhost" apt-get install -y gitlab-ce`,
    },
    {
      slug: 'nextcloud', name: 'Nextcloud',
      description: 'Self-hosted file sync and collaboration platform.',
      logo: 'nextcloud', category: 'Productivity', minPlanSlug: 'c2-medium',
      ports: [80, 443],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y apache2 mariadb-server libapache2-mod-php php-gd php-json php-mysql php-curl php-mbstring php-intl php-imagick php-xml php-zip
cd /var/www && wget https://download.nextcloud.com/server/releases/latest.tar.bz2 && tar xf latest.tar.bz2
chown -R www-data:www-data /var/www/nextcloud
systemctl enable --now apache2 mariadb`,
    },
    {
      slug: 'mastodon', name: 'Mastodon',
      description: 'Decentralised social network server with Postgres + Redis + Sidekiq.',
      logo: 'mastodon', category: 'Productivity', minPlanSlug: 'c3-large',
      ports: [80, 443, 3000, 4000],
      userDataScript: `#!/bin/bash
apt-get update -y && apt-get install -y postgresql redis-server nginx imagemagick libpq-dev libxml2-dev libxslt1-dev file git-core g++ libprotobuf-dev protobuf-compiler pkg-config gcc autoconf bison build-essential libssl-dev libyaml-dev libreadline6-dev zlib1g-dev libncurses5-dev libffi-dev libgdbm-dev nginx redis-server redis-tools certbot python3-certbot-nginx yarn libidn11-dev libicu-dev libjemalloc-dev
useradd -m -s /bin/bash mastodon
echo "Mastodon needs further interactive setup as the mastodon user. See: https://docs.joinmastodon.org/admin/install/"`,
    },
  ]
  for (const a of appTemplates) {
    await prisma.appTemplate.upsert({
      where: { slug: a.slug },
      update: {
        name: a.name, description: a.description, logo: a.logo, category: a.category,
        minPlanSlug: a.minPlanSlug, userDataScript: a.userDataScript,
        ports: j(a.ports), envVars: j([]),
      },
      create: {
        ...a, ports: j(a.ports), envVars: j([]),
      },
    })
  }
  console.log(`✓ ${appTemplates.length} app templates`)

  // ─── CANNED RESPONSES ───────────────────────────────
  const cannedResponses = [
    { title: 'Server unreachable', category: 'technical', content: 'Hi {{firstName}}, thanks for reaching out. I can see your server. Could you please run `ping <ip>` from your local machine and share the output? Also, please check our status page at /status for any ongoing incidents.' },
    { title: 'Refund processed', category: 'billing', content: 'Hi {{firstName}}, your refund has been processed. The amount will reflect in your original payment method within 5-7 business days. The refund reference is {{ref}}.' },
    { title: 'Account suspended notice', category: 'billing', content: 'Hi {{firstName}}, your account has been suspended due to overdue balance. Please add funds at /dashboard/billing to restore service. Servers stopped due to non-payment will resume automatically once paid.' },
    { title: 'Abuse report acknowledgement', category: 'abuse', content: 'Thank you for the abuse report. We have received it and our team will investigate within 24 hours. We will follow up with action taken once review is complete.' },
    { title: 'Welcome new customer', category: 'sales', content: 'Welcome to NetLayer! As a new customer, you have $100 in free credit. Deploy your first server in 60 seconds at /dashboard/deploy. If you need any help, just reply to this ticket.' },
  ]
  for (const c of cannedResponses) {
    const exists = await prisma.cannedResponse.findFirst({ where: { title: c.title } })
    if (!exists) {
      await prisma.cannedResponse.create({
        data: { ...c, createdBy: 'seed' },
      })
    }
  }
  console.log(`✓ ${cannedResponses.length} canned responses`)

  // ─── INITIAL STATUS PAGE STATE ──────────────────────
  // No active incidents at seed time — status page derives "all operational"
  // from the absence of unresolved StatusIncident rows.

  // ─── BLOG POSTS ─────────────────────────────────────
  const posts = [
    {
      slug: 'introducing-netlayer-gpu-cloud',
      title: 'Introducing NetLayer GPU Cloud',
      excerpt:
        'On-demand A100 and H100 instances, billed by the second. Built for ML workloads that need to spin up fast and pay only for what they use.',
      cover: null,
      category: 'product',
      authorName: 'Aman Singh',
      authorRole: 'Product Lead',
      readMinutes: 4,
      tags: ['gpu', 'launch', 'ai-ml'],
      publishedAt: new Date('2026-05-20T09:00:00Z'),
      content: `## What we're shipping

Today we're rolling out **NetLayer GPU Cloud** — A100 and H100 instances available on-demand, billed by the second, in five regions to start (Mumbai, Singapore, Frankfurt, NYC, and São Paulo).

If you've ever waited 20 minutes for a hyperscaler to allocate a single A100, you'll appreciate this part: our average GPU provisioning time on launch day is **38 seconds**. We get there with pre-warmed pools, linked clones, and a scheduler that's aware of NVLink topology.

## Per-second billing, no commitments

A 5-minute fine-tune costs you about $0.30 on a single A100 — not the $30 you'd pay for an hour minimum elsewhere. We round up only when you cross a second boundary, and you can pause an instance to stop billing without losing the snapshot.

## How it's built

Each GPU host runs PCIe passthrough on top of our standard QEMU/KVM stack. NVIDIA drivers, CUDA 12.4, cuDNN, and NCCL are baked into the golden image — your VM boots into a working ML environment with **PyTorch, TensorFlow, and JAX preinstalled**.

For multi-GPU workloads you can ask the scheduler for "8x H100 with NVLink", and we'll co-locate the VM on a host where the topology actually exists. No more debugging \`p2p_bandwidth_test\` results that looked too good to be true.

## What's next

- 4-GPU and 8-GPU "DGX-style" SKUs (June)
- Spot pricing with a 70% discount and 30s preemption notice (July)
- Reserved instances with committed-use discounts (August)

[Try it now → /pricing#gpu](/pricing)`,
    },
    {
      slug: 'bare-metal-vs-vps-for-databases',
      title: 'Bare metal vs VPS: when each one wins for databases',
      excerpt:
        'Virtualisation overhead is small for most workloads, but for databases that saturate the NVMe bus, dedicated hardware wins by a measurable margin. Here\'s the actual benchmark.',
      cover: null,
      category: 'engineering',
      authorName: 'Riya Patel',
      authorRole: 'Senior Infrastructure Engineer',
      readMinutes: 7,
      tags: ['benchmark', 'storage', 'database'],
      publishedAt: new Date('2026-05-12T08:00:00Z'),
      content: `## The myth and the reality

Conventional wisdom says VPSes are "fine for everything that isn't a database". That's not quite true. We benchmarked Postgres 16 on identical hardware — once virtualised, once bare-metal — to see exactly when virtualisation actually costs you.

## Setup

- **Hardware:** AMD EPYC 9354P (32 cores), 256 GB RAM, 4× 3.84 TB NVMe (RAID-10)
- **VPS:** 16 vCPU / 64 GB RAM allocation, NVMe disks passed through with virtio-scsi
- **Workload:** pgbench, scale 1000 (~15 GB), 64 clients, 10 minutes

| Metric                         | Bare metal | VPS (virtio-scsi) | Delta  |
|--------------------------------|-----------:|------------------:|-------:|
| TPS (read-write)               |   42,310   |          37,820   | -10.6% |
| TPS (read-only)                |  118,400   |         115,900   |  -2.1% |
| p99 latency (rw, ms)           |     4.2    |             5.6   | +33%   |
| Crash recovery (1 GB WAL)      |     1.8s   |             2.4s  | +33%   |

## What actually matters

For **read-heavy workloads** the gap is barely noticeable — 2% throughput, no real difference in tail latency. The hypervisor's I/O scheduling rarely matters when the working set fits in cache.

For **write-heavy workloads** the picture flips. Sustained \`fsync\`-heavy traffic exposes the cost of virtio's interrupt mediation, and tail latency suffers more than mean throughput. If your replication lag SLO is under 50 ms or you run a financial ledger, you'll feel this.

## Recommendation

Use VPS for application servers, caches, queues, dev databases, and most analytical workloads. Reach for bare metal when:

1. You're running a **primary OLTP database** with strict tail-latency SLOs.
2. Your WAL throughput exceeds **500 MB/s sustained**.
3. You have **hard compliance requirements** that forbid shared tenancy.

We support both side-by-side, so you can mix freely — put your Postgres primary on bare metal, replicate to two VPS replicas, and run the app tier next to them.`,
    },
    {
      slug: 'how-we-hit-thirty-second-deploys',
      title: 'How we cut VPS deploy time from 90s to 30s',
      excerpt:
        'Linked clones, per-node image caches, cloud-init seed injection, and a smart scheduler. The full story of how we redesigned our control plane.',
      cover: null,
      category: 'engineering',
      authorName: 'Vikram Iyer',
      authorRole: 'Staff Engineer',
      readMinutes: 9,
      tags: ['proxmox', 'performance', 'control-plane'],
      publishedAt: new Date('2026-04-28T11:00:00Z'),
      content: `## The starting point

Six months ago a typical VPS deploy on NetLayer took **88 seconds** end-to-end. That number broke down roughly like this:

- ISO download: 24 s
- VM create + first boot: 38 s
- cloud-init (post-boot): 18 s
- IP allocation + DNS: 8 s

It was fine. It wasn't *good*. Latitude.sh was hitting 30s. Vultr was around 60. We wanted to be the fast option, not the average option.

## What changed

### 1. Golden images via Packer

We replaced ISO installs with **Packer-built qcow2 templates**. Every Friday a CI job rebuilds Ubuntu 22.04, Debian 12, AlmaLinux 9, and Windows Server 2022 against the latest security advisories, then pushes the artifacts to every node's local store.

Result: **24 s saved**, every deploy.

### 2. Linked clones

Instead of full disk copies, we use \`qm clone --full 0\`. The new VM shares the backing disk with the template via copy-on-write. The clone operation itself takes about a second.

Result: **20 s saved** vs the old full-clone path.

### 3. cloud-init seed via SMBIOS

Cloud-init traditionally writes user-data to a NoCloud datasource on a virtual ISO that the VM mounts at boot. Mounting that ISO adds a couple of seconds. We switched to **SMBIOS string injection** — the seed lives in firmware metadata that's already in memory by the time systemd starts.

Result: **3 s saved**, cleaner first boot.

### 4. Async DNS publication

We were waiting for the Cloudflare A-record to propagate before marking the VM \`RUNNING\`. That's not actually required for the deploy to succeed — the VM is reachable by IP immediately. We moved DNS publication to a background reconciler that runs out-of-band.

Result: **6 s saved** from user-perceived deploy time.

### 5. Capacity-aware scheduler

Rather than picking the first node with capacity, the scheduler now ranks candidates by **(free CPU, free RAM, NVMe utilisation, recent deploy queue depth)** and picks the best. That avoids stampedes onto warm nodes during a flash-sale.

Result: **5–10 s avoided** on the long tail.

## The new numbers

P50: **31 s**. P95: **44 s**. P99: **58 s**, mostly because of corner cases where guest-agent reporting is slow. We're still working on the long tail.

## What's next

- Single-digit-second deploys for "cold" customers using **memory-snapshot restore**.
- Pre-allocated **warm pools** for the most common (region, plan) combinations.
- A public **deploy benchmark suite** that anyone can run and contribute results to.

Try it yourself — sign up, hit "Deploy", and watch the timer.`,
    },
  ]
  for (const p of posts) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        excerpt: p.excerpt,
        cover: p.cover,
        category: p.category,
        authorName: p.authorName,
        authorRole: p.authorRole,
        readMinutes: p.readMinutes,
        tags: j(p.tags),
        publishedAt: p.publishedAt,
        content: p.content,
        published: true,
      },
      create: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        cover: p.cover,
        category: p.category,
        authorName: p.authorName,
        authorRole: p.authorRole,
        readMinutes: p.readMinutes,
        tags: j(p.tags),
        publishedAt: p.publishedAt,
        content: p.content,
        published: true,
      },
    })
  }
  console.log(`✓ ${posts.length} blog posts`)

  // ─── ROUND 18: IP POOLS ───────────────────────────
  const expandCidr = (cidr: string): string[] => {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(cidr)
    if (!m) return []
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10), c = parseInt(m[3], 10), d = parseInt(m[4], 10)
    const pfx = parseInt(m[5], 10)
    if (pfx < 16 || pfx > 30) return []
    const base = ((a << 24) | (b << 16) | (c << 8) | d) >>> 0
    const total = Math.pow(2, 32 - pfx)
    const out: string[] = []
    for (let i = 1; i < total - 1; i++) {
      const ip = (base + i) >>> 0
      out.push(`${(ip >>> 24) & 255}.${(ip >>> 16) & 255}.${(ip >>> 8) & 255}.${ip & 255}`)
    }
    return out
  }

  const seedPools = [
    { regionSlug: 'mumbai',    cidr: '103.21.200.0/27', gateway: '103.21.200.1' },
    { regionSlug: 'frankfurt', cidr: '65.20.100.0/27',  gateway: '65.20.100.1'  },
    { regionSlug: 'singapore', cidr: '103.22.50.0/27',  gateway: '103.22.50.1'  },
    { regionSlug: 'new-york',  cidr: '45.77.100.0/27',  gateway: '45.77.100.1'  },
  ]
  let poolsCreated = 0
  for (const p of seedPools) {
    const region = await prisma.region.findUnique({ where: { slug: p.regionSlug } })
    if (!region) continue
    const exists = await prisma.ipPool.findFirst({ where: { cidr: p.cidr } })
    if (exists) continue
    const pool = await prisma.ipPool.create({
      data: { regionId: region.id, cidr: p.cidr, gateway: p.gateway },
    })
    const ips = expandCidr(p.cidr)
    if (ips.length > 0) {
      await prisma.ipAddress.createMany({
        data: ips.map((ip) => ({ ip, poolId: pool.id })),
      }).catch(() => {})
    }
    poolsCreated += 1
  }
  console.log(`✓ ${poolsCreated} IP pool(s) seeded`)

  // ─── ROUND 18: PROMO CODES ────────────────────────
  const promos = [
    { code: 'WELCOME500',   amount: 500,  usageLimit: 1000, expiresAt: new Date('2026-12-31') },
    { code: 'NETLAYER1000', amount: 1000, usageLimit: 100,  expiresAt: new Date('2026-08-31') },
    { code: 'DEVFEST750',   amount: 750,  usageLimit: 500,  expiresAt: new Date('2026-09-30') },
  ]
  for (const p of promos) {
    await prisma.promoCode.upsert({
      where: { code: p.code },
      update: { amount: p.amount, usageLimit: p.usageLimit, expiresAt: p.expiresAt, isActive: true },
      create: { ...p, type: 'credit', currency: 'INR', createdBy: 'seed' },
    })
  }
  console.log(`✓ ${promos.length} promo codes`)

  // ─── ROUND 18: STATUS SERVICE DEFINITIONS ────────
  await prisma.integrationConfig.upsert({
    where: { key: 'status.services' },
    update: {},
    create: {
      key: 'status.services',
      value: JSON.stringify([
        { id: 'api',          name: 'API',            description: 'REST API endpoints' },
        { id: 'dashboard',    name: 'Dashboard',      description: 'Web control panel' },
        { id: 'dns',          name: 'DNS',            description: 'Domain name resolution' },
        { id: 'provisioning', name: 'Provisioning',   description: 'VM deployment pipeline' },
        { id: 'storage',      name: 'Object Storage', description: 'S3-compatible storage' },
        { id: 'billing',      name: 'Billing',        description: 'Payment processing' },
      ]),
    },
  })

  await prisma.integrationConfig.upsert({
    where: { key: 'network.floating_ip_pool' },
    update: {},
    create: { key: 'network.floating_ip_pool', value: JSON.stringify({ pricePerMonth: 50 }) },
  })

  // Round 19: platform meta + public rescue ISO
  await prisma.integrationConfig.upsert({
    where: { key: 'platform.meta' },
    update: {},
    create: {
      key: 'platform.meta',
      value: JSON.stringify({
        name: 'NetLayer Cloud',
        tagline: 'Infrastructure that deploys in seconds',
        supportEmail: 'support@netlayer.com',
        salesEmail: 'sales@netlayer.com',
        legalEmail: 'legal@netlayer.com',
        privacyEmail: 'privacy@netlayer.com',
        twitterUrl: 'https://twitter.com/netlayercloud',
        githubUrl: 'https://github.com/Netlayer-global',
        discordUrl: 'https://discord.gg/netlayer',
        linkedinUrl: 'https://linkedin.com/company/netlayer',
        foundedYear: 2024,
        headquarters: 'Mumbai, India',
      }),
    },
  })

  await prisma.isoImage.upsert({
    where: { id: 'rescue-iso-seed' },
    update: { isPublic: true, status: 'available' },
    create: {
      id: 'rescue-iso-seed',
      name: 'NetLayer Rescue ISO',
      filename: 'netlayer-rescue-amd64.iso',
      status: 'available',
      isPublic: true,
      sizeBytes: BigInt(560 * 1024 * 1024),
      downloadUrl: 'https://example.com/rescue.iso',
    },
  })

  console.log('✓ Round 19 configs (platform.meta + rescue ISO)')

  console.log('✓ Round 18 configs')

  console.log('✅ Seed complete!')
  console.log('')
  console.log('  super@netlayer.com   / Super@123456   (SUPER_ADMIN)')
  console.log('  admin@netlayer.com   / Admin@123456   (ADMIN)')
  console.log('  support@netlayer.com / Support@123456 (SUPPORT)')
  console.log('  billing@netlayer.com / Billing@123456 (BILLING)')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
