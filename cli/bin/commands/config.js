"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommands = configCommands;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
function configCommands(program) {
    const cmd = program.command('config').description('View and update CLI configuration');
    cmd
        .command('show')
        .description('Show current configuration')
        .action(() => {
        const apiKey = config_1.config.get('apiKey');
        const masked = apiKey ? `${apiKey.slice(0, 8)}…` : '(none)';
        console.log(chalk_1.default.bold('NetLayer CLI configuration'));
        console.log(`  api-url:        ${chalk_1.default.cyan(config_1.config.get('apiUrl'))}`);
        console.log(`  api-key:        ${chalk_1.default.cyan(masked)}`);
        console.log(`  default-region: ${chalk_1.default.cyan(config_1.config.get('defaultRegion') || '(none)')}`);
        console.log(chalk_1.default.gray(`  config path:    ${config_1.config.path}`));
    });
    cmd
        .command('set <key> <value>')
        .description('Set a config value (api-url | api-key | default-region)')
        .action((key, value) => {
        const map = {
            'api-url': 'apiUrl',
            'api-key': 'apiKey',
            'default-region': 'defaultRegion',
        };
        const real = map[key];
        if (!real) {
            console.error(chalk_1.default.red(`✗ Unknown key. Use one of: ${Object.keys(map).join(', ')}`));
            process.exit(1);
        }
        config_1.config.set(real, value);
        console.log(chalk_1.default.green(`✓ Saved ${key}`));
    });
}
