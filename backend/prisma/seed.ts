import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const j = (v: unknown) => JSON.stringify(v)

async function main() {
  console.log('🌱 Seeding NetLayer database...')

  // ─── PLANS ───────────────────────────────────────────
  const plans = [
    { name: 'c2.small',   slug: 'c2-small',   cpu: 1,  ramGB: 2,  diskGB: 40,   bandwidthTB: 1,  priceMonthly: 199,  priceHourly: 0.27, priceInr: 199,  isPopular: false, sortOrder: 1 },
    { name: 'c2.medium',  slug: 'c2-medium',  cpu: 2,  ramGB: 4,  diskGB: 80,   bandwidthTB: 2,  priceMonthly: 399,  priceHourly: 0.54, priceInr: 399,  isPopular: false, sortOrder: 2 },
    { name: 'c3.large',   slug: 'c3-large',   cpu: 4,  ramGB: 8,  diskGB: 160,  bandwidthTB: 3,  priceMonthly: 799,  priceHourly: 1.09, priceInr: 799,  isPopular: true,  sortOrder: 3 },
    { name: 'c3.xlarge',  slug: 'c3-xlarge',  cpu: 8,  ramGB: 16, diskGB: 320,  bandwidthTB: 5,  priceMonthly: 1499, priceHourly: 2.05, priceInr: 1499, isPopular: false, sortOrder: 4 },
    { name: 'c4.2xlarge', slug: 'c4-2xlarge', cpu: 16, ramGB: 32, diskGB: 640,  bandwidthTB: 8,  priceMonthly: 2999, priceHourly: 4.10, priceInr: 2999, isPopular: false, sortOrder: 5 },
    { name: 'c4.4xlarge', slug: 'c4-4xlarge', cpu: 32, ramGB: 64, diskGB: 1280, bandwidthTB: 10, priceMonthly: 5999, priceHourly: 8.21, priceInr: 5999, isPopular: false, sortOrder: 6 },
  ]
  for (const p of plans) await prisma.plan.upsert({ where: { slug: p.slug }, update: p, create: p })
  console.log(`✓ ${plans.length} plans`)

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
  const seedUsers = [
    { email: 'super@netlayer.com',   password: 'Super@123456',   firstName: 'Super',   lastName: 'Admin',   role: 'SUPER_ADMIN', balance: 100000, country: 'IN' },
    { email: 'admin@netlayer.com',   password: 'Admin@123456',   firstName: 'Admin',   lastName: 'NetLayer', role: 'ADMIN',       balance: 10000,  country: 'IN' },
    { email: 'support@netlayer.com', password: 'Support@123456', firstName: 'Support', lastName: 'Agent',    role: 'SUPPORT',     balance: 0,      country: 'IN' },
    { email: 'billing@netlayer.com', password: 'Billing@123456', firstName: 'Billing', lastName: 'Agent',    role: 'BILLING',     balance: 0,      country: 'IN' },
  ]
  for (const u of seedUsers) {
    const passwordHash = await bcrypt.hash(u.password, 12)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, balance: u.balance, country: u.country },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        emailVerified: true,
        balance: u.balance,
        country: u.country,
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
