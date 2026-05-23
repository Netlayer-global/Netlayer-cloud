import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { config } from '../config'
import { makeAnonClient, makeClient, handleError } from '../client'

export function authCommands(program: Command) {
  program
    .command('login')
    .description('Authenticate with NetLayer Cloud')
    .option('--api-url <url>', 'override API URL')
    .option('--api-key <key>', 'use a saved API key non-interactively')
    .action(async (opts) => {
      if (opts.apiUrl) config.set('apiUrl', opts.apiUrl)

      if (opts.apiKey) {
        config.set('apiKey', opts.apiKey)
        console.log(chalk.green('✓ API key saved'))
        return
      }

      const { method } = await inquirer.prompt([
        {
          name: 'method',
          message: 'How do you want to authenticate?',
          type: 'list',
          choices: [
            { name: 'API key (recommended)', value: 'apiKey' },
            { name: 'Email + password', value: 'password' },
          ],
        },
      ])

      if (method === 'apiKey') {
        const { apiKey } = await inquirer.prompt([
          { name: 'apiKey', message: 'Paste your API key:', type: 'password' },
        ])
        config.set('apiKey', apiKey.trim())
        console.log(chalk.green('✓ API key saved to') + chalk.gray(` ${config.path}`))
        return
      }

      const { email, password } = await inquirer.prompt([
        { name: 'email', message: 'Email:' },
        { name: 'password', message: 'Password:', type: 'password' },
      ])
      const spinner = ora('Authenticating…').start()
      try {
        const anon = makeAnonClient()
        const r = await anon.post('/auth/login', { email, password })
        config.set('apiKey', r.data.data.accessToken)
        spinner.succeed('Logged in')
        console.log(chalk.gray(`Token saved to ${config.path}`))
        console.log(chalk.gray('Note: access tokens expire in 15m. For long-running automation, create a permanent API key from the dashboard.'))
      } catch (e: any) {
        spinner.fail('Login failed')
        handleError(e)
      }
    })

  program
    .command('logout')
    .description('Clear local credentials')
    .action(() => {
      config.set('apiKey', '')
      console.log(chalk.green('✓ Credentials cleared'))
    })

  program
    .command('whoami')
    .description('Show the currently authenticated user')
    .action(async () => {
      const spinner = ora('Loading user…').start()
      try {
        const c = makeClient()
        const r = await c.get('/auth/me')
        const u = r.data.data
        spinner.stop()
        console.log(chalk.bold(`${u.firstName} ${u.lastName}`))
        console.log(`  email:   ${chalk.cyan(u.email)}`)
        console.log(`  role:    ${chalk.cyan(u.role)}`)
        console.log(`  balance: ${chalk.cyan(`${u.currency} ${u.balance.toFixed(2)}`)}`)
        console.log(chalk.gray(`  api:     ${config.get('apiUrl')}`))
      } catch (e: any) {
        spinner.fail('Failed to load user')
        handleError(e)
      }
    })
}
