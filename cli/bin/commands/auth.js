"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCommands = authCommands;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const client_1 = require("../client");
async function persistAndVerify(apiKey) {
    const spinner = (0, ora_1.default)('Verifying API key…').start();
    try {
        const url = `${config_1.config.get('apiUrl').replace(/\/$/, '')}/auth/me`;
        const r = await axios_1.default.get(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
        });
        const u = r.data.data;
        config_1.config.set('apiKey', apiKey);
        spinner.succeed(`Logged in as ${chalk_1.default.cyan(u.email)} ${chalk_1.default.gray('(' + u.role + ')')}`);
        console.log(chalk_1.default.gray(`Saved to ${config_1.config.path}`));
    }
    catch (e) {
        spinner.fail('API key rejected');
        if (e.response?.status === 401) {
            console.error(chalk_1.default.red('✗ The server says this key is invalid or expired.'));
            console.error(chalk_1.default.gray('  Generate a new one at') + chalk_1.default.cyan(' /dashboard/api-keys'));
        }
        else if (e.code === 'ECONNREFUSED') {
            console.error(chalk_1.default.red('✗ Could not reach the API at ' + config_1.config.get('apiUrl')));
            console.error(chalk_1.default.gray('  Is the backend running? Or run:'));
            console.error(chalk_1.default.cyan('  nl config set api-url <url>'));
        }
        else {
            console.error(chalk_1.default.red(`✗ ${e.response?.data?.error || e.message}`));
        }
        process.exit(1);
    }
}
function authCommands(program) {
    program
        .command('login')
        .description('Authenticate with NetLayer Cloud')
        .option('--api-url <url>', 'override API URL')
        .option('--api-key <key>', 'use a saved API key non-interactively')
        .action(async (opts) => {
        // Always let the user confirm/update the API URL first — most local
        // installs use 127.0.0.1:5000, while production uses api.netlayer.com.
        let apiUrl = opts.apiUrl ?? config_1.config.get('apiUrl');
        if (!opts.apiUrl && !opts.apiKey) {
            const r = await inquirer_1.default.prompt([
                { name: 'apiUrl', message: 'API URL:', default: apiUrl },
            ]);
            apiUrl = r.apiUrl;
        }
        config_1.config.set('apiUrl', apiUrl);
        if (opts.apiKey) {
            const trimmed = String(opts.apiKey).trim();
            if (!trimmed) {
                console.error(chalk_1.default.red('✗ Empty API key'));
                process.exit(1);
            }
            await persistAndVerify(trimmed);
            return;
        }
        const { method } = await inquirer_1.default.prompt([
            {
                name: 'method',
                message: 'How do you want to authenticate?',
                type: 'list',
                choices: [
                    { name: 'API key (recommended — long-lived, starts with nl_)', value: 'apiKey' },
                    { name: 'Email + password (issues a 15-minute access token)', value: 'password' },
                ],
            },
        ]);
        if (method === 'apiKey') {
            const { apiKey } = await inquirer_1.default.prompt([
                {
                    name: 'apiKey',
                    message: 'Paste your API key (starts with nl_):',
                    // Note: not `type: password` — paste-into-hidden-input on Windows
                    // is unreliable across terminals (we hit this exact bug).
                    type: 'input',
                    validate: (v) => {
                        const t = v.trim();
                        if (!t)
                            return 'API key is required';
                        if (!t.startsWith('nl_') && !t.startsWith('nlt_')) {
                            return 'Expected key to start with nl_ — get one from /dashboard/api-keys';
                        }
                        if (t.length < 16)
                            return 'API key looks too short';
                        return true;
                    },
                },
            ]);
            await persistAndVerify(apiKey.trim());
            return;
        }
        const { email, password } = await inquirer_1.default.prompt([
            {
                name: 'email',
                message: 'Email:',
                validate: (v) => (v.trim() ? true : 'Email is required'),
            },
            {
                name: 'password',
                message: 'Password:',
                type: 'password',
                mask: '*',
                validate: (v) => (v ? true : 'Password is required'),
            },
        ]);
        const spinner = (0, ora_1.default)('Authenticating…').start();
        try {
            const anon = (0, client_1.makeAnonClient)();
            const r = await anon.post('/auth/login', { email, password });
            const token = r.data.data.accessToken;
            config_1.config.set('apiKey', token);
            spinner.succeed('Logged in as ' + chalk_1.default.cyan(email));
            console.log(chalk_1.default.gray('Note: this is a 15-minute access token. For long-running automation, run'));
            console.log(chalk_1.default.cyan('  nl login') + chalk_1.default.gray(' and choose API key, or generate one at /dashboard/api-keys'));
        }
        catch (e) {
            spinner.fail('Login failed');
            (0, client_1.handleError)(e);
        }
    });
    program
        .command('logout')
        .description('Clear local credentials')
        .action(() => {
        config_1.config.set('apiKey', '');
        console.log(chalk_1.default.green('✓ Credentials cleared'));
    });
    program
        .command('whoami')
        .description('Show the currently authenticated user')
        .action(async () => {
        const spinner = (0, ora_1.default)('Loading user…').start();
        try {
            const c = (0, client_1.makeClient)();
            const r = await c.get('/auth/me');
            const u = r.data.data;
            spinner.stop();
            console.log(chalk_1.default.bold(`${u.firstName} ${u.lastName}`));
            console.log(`  email:   ${chalk_1.default.cyan(u.email)}`);
            console.log(`  role:    ${chalk_1.default.cyan(u.role)}`);
            console.log(`  balance: ${chalk_1.default.cyan(`${u.currency} ${u.balance.toFixed(2)}`)}`);
            console.log(chalk_1.default.gray(`  api:     ${config_1.config.get('apiUrl')}`));
        }
        catch (e) {
            spinner.fail('Failed to load user');
            (0, client_1.handleError)(e);
        }
    });
}
