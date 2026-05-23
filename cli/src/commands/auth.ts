import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import axios from 'axios'
import { config } from '../config'
import { makeAnonClient, makeClient, handleError } from '../client'

async function persistAndVerify(apiKey: string): Promise<void> {
  const spinner = ora('Verifying API key…').start()
  try {
    const url = `${config.get('apiUrl').replace(/\/$/, '')}/auth/me`
    const r = await axios.get(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10_000,
    })
    const u = r.data.data
    config.set('apiKey', apiKey)
    spinner.succeed(`Logged in as ${chalk.cyan(u.email)} ${chalk.gray('(' + u.role + ')')}`)
    console.log(chalk.gray(`Saved to ${config.path}`))
  } catch (e: any) {
    spinner.fail('API key rejected')
    if (e.response?.status === 401) {
      console.error(chalk.red('✗ The server says this key is invalid or expired.'))
      console.error(chalk.gray('  Generate a new one at') + chalk.cyan(' /dashboard/api-keys'))
    } else if (e.code === 'ECONNREFUSED') {
      console.error(chalk.red('✗ Could not reach the API at ' + config.get('apiUrl')))
      console.error(chalk.gray('  Is the backend running? Or run:'))
      console.error(chalk.cyan('  nl config set api-url <url>'))
    } else {
      console.error(chalk.red(`✗ ${e.response?.data?.error || e.message}`))
    }
    process.exit(1)
  }
}

export function authCommands(program: Command) {
  program
    .command('login')
    .description('Authenticate with NetLayer Cloud')
    .option('--api-url <url>', 'override API URL')
    .option('--api-key <key>', 'use a saved API key non-interactively')
    .action(async (opts) => {
      // Always let the user confirm/update the API URL first — most local
      // installs use 127.0.0.1:5000, while production uses api.netlayer.com.
      let apiUrl = opts.apiUrl ?? config.get('apiUrl')
      if (!opts.apiUrl && !opts.apiKey) {
        const r = await inquirer.prompt([
          { name: 'apiUrl', message: 'API URL:', default: apiUrl },
        ])
        apiUrl = r.apiUrl
      }
      config.set('apiUrl', apiUrl)

      if (opts.apiKey) {
        const trimmed = String(opts.apiKey).trim()
        if (!trimmed) {
          console.error(chalk.red('✗ Empty API key'))
          process.exit(1)
        }
        await persistAndVerify(trimmed)
        return
      }

      const { method } = await inquirer.prompt([
        {
          name: 'method',
          message: 'How do you want to authenticate?',
          type: 'list',
          choices: [
            { name: 'API key (recommended — long-lived, starts with nl_)', value: 'apiKey' },
            { name: 'Email + password (issues a 15-minute access token)', value: 'password' },
          ],
        },
      ])

      if (method === 'apiKey') {
        const { apiKey } = await inquirer.prompt([
          {
            name: 'apiKey',
            message: 'Paste your API key (starts with nl_):',
            // Note: not `type: password` — paste-into-hidden-input on Windows
            // is unreliable across terminals (we hit this exact bug).
            type: 'input',
            validate: (v: string) => {
              const t = v.trim()
              if (!t) return 'API key is required'
              if (!t.startsWith('nl_') && !t.startsWith('nlt_')) {
                return 'Expected key to start with nl_ — get one from /dashboard/api-keys'
              }
              if (t.length < 16) return 'API key looks too short'
              return true
            },
          },
        ])
        await persistAndVerify(apiKey.trim())
        return
      }

      const { email, password } = await inquirer.prompt([
        {
          name: 'email',
          message: 'Email:',
          validate: (v: string) => (v.trim() ? true : 'Email is required'),
        },
        {
          name: 'password',
          message: 'Password:',
          type: 'password',
          mask: '*',
          validate: (v: string) => (v ? true : 'Password is required'),
        },
      ])
      const spinner = ora('Authenticating…').start()
      try {
        const anon = makeAnonClient()
        const r = await anon.post('/auth/login', { email, password })
        const token = r.data.data.accessToken
        config.set('apiKey', token)
        spinner.succeed('Logged in as ' + chalk.cyan(email))
        console.log(chalk.gray('Note: this is a 15-minute access token. For long-running automation, run'))
        console.log(chalk.cyan('  nl login') + chalk.gray(' and choose API key, or generate one at /dashboard/api-keys'))
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
