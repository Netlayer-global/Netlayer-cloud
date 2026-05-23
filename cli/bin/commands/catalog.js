"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogCommands = catalogCommands;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const client_1 = require("../client");
const padR = (s, n) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
function catalogCommands(program) {
    program
        .command('plans')
        .description('List available plans (no auth required)')
        .action(async () => {
        const spinner = (0, ora_1.default)('Loading plans…').start();
        try {
            const r = await (0, client_1.makeAnonClient)().get('/plans');
            spinner.stop();
            console.log();
            console.log(chalk_1.default.bold(padR('SLUG', 14) + padR('vCPU', 6) + padR('RAM', 8) + padR('DISK', 10) + padR('BW', 8) + 'PRICE'));
            for (const p of r.data.data) {
                console.log(padR(p.slug, 14) +
                    padR(`${p.cpu}`, 6) +
                    padR(`${p.ramGB} GB`, 8) +
                    padR(`${p.diskGB} GB`, 10) +
                    padR(`${p.bandwidthTB} TB`, 8) +
                    chalk_1.default.cyan(`₹${p.priceMonthly}/mo`) +
                    (p.isPopular ? chalk_1.default.green('  ★ popular') : ''));
            }
            console.log();
        }
        catch (e) {
            spinner.fail('Failed to load plans');
            (0, client_1.handleError)(e);
        }
    });
    program
        .command('regions')
        .description('List active regions (no auth required)')
        .action(async () => {
        const spinner = (0, ora_1.default)('Loading regions…').start();
        try {
            const r = await (0, client_1.makeAnonClient)().get('/regions');
            spinner.stop();
            console.log();
            console.log(chalk_1.default.bold(padR('SLUG', 8) + padR('CITY', 18) + padR('COUNTRY', 14) + 'FLAG'));
            for (const reg of r.data.data) {
                console.log(padR(reg.slug, 8) +
                    padR(reg.city, 18) +
                    padR(reg.country, 14) +
                    (reg.flag || ''));
            }
            console.log();
        }
        catch (e) {
            spinner.fail('Failed to load regions');
            (0, client_1.handleError)(e);
        }
    });
    program
        .command('os')
        .description('List active OS templates')
        .action(async () => {
        const spinner = (0, ora_1.default)('Loading OS templates…').start();
        try {
            const r = await (0, client_1.makeAnonClient)().get('/os');
            spinner.stop();
            console.log();
            console.log(chalk_1.default.bold(padR('SLUG', 22) + padR('NAME', 22) + 'VERSION'));
            for (const o of r.data.data) {
                console.log(padR(o.slug, 22) + padR(o.name, 22) + chalk_1.default.cyan(o.version));
            }
            console.log();
        }
        catch (e) {
            spinner.fail('Failed to load OS templates');
            (0, client_1.handleError)(e);
        }
    });
}
