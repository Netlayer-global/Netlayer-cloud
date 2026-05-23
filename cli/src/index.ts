#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import pkg from '../package.json'
import { authCommands } from './commands/auth'
import { catalogCommands } from './commands/catalog'
import { serverCommands } from './commands/server'
import { configCommands } from './commands/config'

const program = new Command()

program
  .name('netlayer')
  .description(chalk.bold('NetLayer Cloud CLI') + chalk.gray(' — manage your infrastructure from the terminal'))
  .version(pkg.version, '-v, --version')
  .helpOption('-h, --help', 'Show help')

authCommands(program)
catalogCommands(program)
serverCommands(program)
configCommands(program)

program
  .command('docs')
  .description('Open the developer documentation in your browser')
  .action(() => {
    console.log(chalk.cyan('Visit: https://docs.netlayer.com'))
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(`✗ ${err.message || err}`))
  process.exit(1)
})
