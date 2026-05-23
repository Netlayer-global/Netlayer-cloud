"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverCommands = serverCommands;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const client_1 = require("../client");
const STATUS_COLOR = {
    RUNNING: chalk_1.default.green,
    STOPPED: chalk_1.default.gray,
    BUILDING: chalk_1.default.yellow,
    PENDING: chalk_1.default.yellow,
    ERROR: chalk_1.default.red,
    DELETING: chalk_1.default.red,
    REBOOTING: chalk_1.default.yellow,
    DELETED: chalk_1.default.gray,
};
const fmtStatus = (s) => (STATUS_COLOR[s] || chalk_1.default.white)(s.toLowerCase());
const padR = (s, n) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
function serverCommands(program) {
    const cmd = program.command('server').alias('servers').description('Manage cloud servers');
    cmd
        .command('list')
        .alias('ls')
        .description('List your servers')
        .action(async () => {
        const spinner = (0, ora_1.default)('Loading servers…').start();
        try {
            const c = (0, client_1.makeClient)();
            const r = await c.get('/servers');
            spinner.stop();
            const servers = r.data.data || [];
            if (servers.length === 0) {
                console.log(chalk_1.default.gray('No servers yet. Try:'));
                console.log(chalk_1.default.cyan('  nl server create'));
                return;
            }
            console.log();
            console.log(chalk_1.default.bold(padR('ID', 12) + padR('NAME', 20) + padR('IP', 16) + padR('REGION', 10) + padR('PLAN', 14) + 'STATUS'));
            for (const s of servers) {
                console.log(padR(s.id.slice(0, 10), 12) +
                    padR(s.name, 20) +
                    padR(s.ipv4 || '—', 16) +
                    padR(s.region?.slug || '—', 10) +
                    padR(s.plan?.name || '—', 14) +
                    fmtStatus(s.status));
            }
            console.log();
        }
        catch (e) {
            spinner.fail('Failed to load servers');
            (0, client_1.handleError)(e);
        }
    });
    cmd
        .command('get <id>')
        .description('Show details for one server')
        .action(async (id) => {
        const spinner = (0, ora_1.default)('Loading…').start();
        try {
            const c = (0, client_1.makeClient)();
            const r = await c.get(`/servers/${id}`);
            spinner.stop();
            const s = r.data.data;
            console.log();
            console.log(chalk_1.default.bold(s.name) + chalk_1.default.gray(`  ${s.id}`));
            console.log(`  hostname: ${chalk_1.default.cyan(s.hostname)}`);
            console.log(`  ipv4:     ${chalk_1.default.cyan(s.ipv4 || '—')}`);
            console.log(`  ipv6:     ${chalk_1.default.cyan(s.ipv6 || '—')}`);
            console.log(`  region:   ${chalk_1.default.cyan(s.region?.city)} (${s.region?.slug})`);
            console.log(`  plan:     ${chalk_1.default.cyan(s.plan?.name)}`);
            console.log(`  os:       ${chalk_1.default.cyan(s.osTemplate?.name)} ${s.osTemplate?.version}`);
            console.log(`  status:   ${fmtStatus(s.status)}`);
            console.log(`  created:  ${chalk_1.default.gray(new Date(s.createdAt).toLocaleString())}`);
            console.log();
        }
        catch (e) {
            spinner.fail('Failed to load server');
            (0, client_1.handleError)(e);
        }
    });
    cmd
        .command('create')
        .description('Deploy a new server (interactive)')
        .option('-n, --name <name>', 'server name')
        .option('-r, --region <slug>', 'region slug (e.g. bom1)')
        .option('-p, --plan <slug>', 'plan slug (e.g. c3.large)')
        .option('-o, --os <slug>', 'OS template slug (e.g. ubuntu-22-04)')
        .option('--ssh-key <id>', 'SSH key id')
        .action(async (opts) => {
        const c = (0, client_1.makeClient)();
        const [plansRes, regionsRes, osRes] = await Promise.all([
            c.get('/plans'), c.get('/regions'), c.get('/os'),
        ]);
        const plans = plansRes.data.data;
        const regions = regionsRes.data.data;
        const oses = osRes.data.data;
        const answers = await inquirer_1.default.prompt([
            {
                name: 'name',
                message: 'Server name:',
                when: !opts.name,
                default: 'web-server-01',
            },
            {
                name: 'region',
                message: 'Region:',
                type: 'list',
                when: !opts.region,
                choices: regions.map((r) => ({
                    name: `${r.flag} ${r.city} (${r.slug})`,
                    value: r.slug,
                })),
            },
            {
                name: 'plan',
                message: 'Plan:',
                type: 'list',
                when: !opts.plan,
                choices: plans.map((p) => ({
                    name: `${p.name}  ${p.cpu} vCPU · ${p.ramGB} GB RAM · ${p.diskGB} GB NVMe  — ₹${p.priceMonthly}/mo`,
                    value: p.slug,
                })),
            },
            {
                name: 'os',
                message: 'OS template:',
                type: 'list',
                when: !opts.os,
                choices: oses.map((o) => ({
                    name: `${o.name} ${o.version}`,
                    value: o.slug,
                })),
            },
        ]);
        const name = opts.name ?? answers.name;
        const regionSlug = opts.region ?? answers.region;
        const planSlug = opts.plan ?? answers.plan;
        const osSlug = opts.os ?? answers.os;
        const region = regions.find((r) => r.slug === regionSlug);
        const plan = plans.find((p) => p.slug === planSlug);
        const os = oses.find((o) => o.slug === osSlug);
        if (!region || !plan || !os) {
            console.error(chalk_1.default.red('✗ Could not resolve region/plan/os from the provided slugs'));
            process.exit(1);
        }
        const spinner = (0, ora_1.default)(`Deploying ${chalk_1.default.cyan(name)} in ${chalk_1.default.cyan(region.city)}…`).start();
        try {
            const r = await c.post('/servers', {
                name,
                regionId: region.id,
                planId: plan.id,
                osTemplateId: os.id,
                ...(opts.sshKey ? { sshKeyId: opts.sshKey } : {}),
            });
            const server = r.data.data;
            spinner.succeed(`Deployment queued: ${chalk_1.default.cyan(server.id)}`);
            console.log(chalk_1.default.gray('Run:'));
            console.log(chalk_1.default.cyan(`  nl server get ${server.id}`));
        }
        catch (e) {
            spinner.fail('Deploy failed');
            (0, client_1.handleError)(e);
        }
    });
    cmd
        .command('power <id> <action>')
        .description('Power action: start | stop | restart')
        .action(async (id, action) => {
        const valid = ['start', 'stop', 'restart'];
        if (!valid.includes(action)) {
            console.error(chalk_1.default.red(`✗ Invalid action. Choose: ${valid.join(', ')}`));
            process.exit(1);
        }
        const spinner = (0, ora_1.default)(`${action[0].toUpperCase() + action.slice(1)}ing ${id}…`).start();
        try {
            const c = (0, client_1.makeClient)();
            await c.post(`/servers/${id}/power`, { action });
            spinner.succeed(`Server ${action} queued`);
        }
        catch (e) {
            spinner.fail('Power action failed');
            (0, client_1.handleError)(e);
        }
    });
    cmd
        .command('destroy <id>')
        .alias('delete')
        .description('Permanently delete a server')
        .option('-y, --yes', 'skip confirmation')
        .action(async (id, opts) => {
        if (!opts.yes) {
            const { confirm } = await inquirer_1.default.prompt([
                {
                    name: 'confirm', type: 'confirm', default: false,
                    message: `Permanently destroy server ${chalk_1.default.red(id)}? This cannot be undone.`,
                },
            ]);
            if (!confirm) {
                console.log(chalk_1.default.gray('Aborted.'));
                return;
            }
        }
        const spinner = (0, ora_1.default)('Destroying…').start();
        try {
            const c = (0, client_1.makeClient)();
            await c.delete(`/servers/${id}`);
            spinner.succeed('Server destroyed');
        }
        catch (e) {
            spinner.fail('Destroy failed');
            (0, client_1.handleError)(e);
        }
    });
}
