import { Command } from 'commander'
import chalk from 'chalk'
import { config } from '../config'

export function configCommands(program: Command) {
  const cmd = program.command('config').description('View and update CLI configuration')

  cmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const apiKey = config.get('apiKey')
      const masked = apiKey ? `${apiKey.slice(0, 8)}…` : '(none)'
      console.log(chalk.bold('NetLayer CLI configuration'))
      console.log(`  api-url:        ${chalk.cyan(config.get('apiUrl'))}`)
      console.log(`  api-key:        ${chalk.cyan(masked)}`)
      console.log(`  default-region: ${chalk.cyan(config.get('defaultRegion') || '(none)')}`)
      console.log(chalk.gray(`  config path:    ${config.path}`))
    })

  cmd
    .command('set <key> <value>')
    .description('Set a config value (api-url | api-key | default-region)')
    .action((key: string, value: string) => {
      const map: Record<string, 'apiUrl' | 'apiKey' | 'defaultRegion'> = {
        'api-url': 'apiUrl',
        'api-key': 'apiKey',
        'default-region': 'defaultRegion',
      }
      const real = map[key]
      if (!real) {
        console.error(chalk.red(`✗ Unknown key. Use one of: ${Object.keys(map).join(', ')}`))
        process.exit(1)
      }
      config.set(real, value)
      console.log(chalk.green(`✓ Saved ${key}`))
    })
}
