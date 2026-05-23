import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { makeClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

const STATUS_COLOR: Record<string, (s: string) => string> = {
  available: chalk.green,
  creating: chalk.yellow,
  deleting: chalk.red,
  error: chalk.red,
}
const fmtStatus = (s: string) => (STATUS_COLOR[s] || chalk.white)(s)

export function dbCommands(program: Command) {
  const cmd = program.command('db').alias('database').description('Manage managed databases')

  cmd
    .command('list').alias('ls')
    .action(async () => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get('/databases')
        spinner.stop()
        const dbs = r.data.data || []
        if (dbs.length === 0) {
          console.log(chalk.gray('No databases. Try:') + chalk.cyan(' nl db create'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('ID', 12) + padR('NAME', 20) + padR('ENGINE', 16) + padR('REGION', 10) + 'STATUS'))
        for (const d of dbs) {
          console.log(
            padR(d.id.slice(0, 10), 12) +
            padR(d.name, 20) +
            padR(`${d.engine} ${d.version}`, 16) +
            padR(d.region, 10) +
            fmtStatus(d.status)
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('get <id>')
    .description('Show database details (incl. connection string)')
    .action(async (id) => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get(`/databases/${id}`)
        spinner.stop()
        const d = r.data.data
        console.log()
        console.log(chalk.bold(d.name) + chalk.gray(`  ${d.id}`))
        console.log(`  engine:   ${chalk.cyan(d.engine)} ${d.version}`)
        console.log(`  region:   ${chalk.cyan(d.region)}`)
        console.log(`  status:   ${fmtStatus(d.status)}`)
        console.log(`  host:     ${chalk.cyan(d.host || '— provisioning —')}`)
        console.log(`  port:     ${chalk.cyan(d.port || '—')}`)
        console.log(`  database: ${chalk.cyan(d.database || '—')}`)
        console.log(`  username: ${chalk.cyan(d.username || '—')}`)
        if (d.connectionString) {
          console.log()
          console.log(chalk.gray('Connection string:'))
          console.log(chalk.cyan(d.connectionString))
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('create')
    .description('Create a new managed database')
    .action(async () => {
      const c = makeClient()
      const [enginesRes, regionsRes, plansRes] = await Promise.all([
        c.get('/databases/engines'), c.get('/regions'), c.get('/plans'),
      ])
      const engines = enginesRes.data.data
      const regions = regionsRes.data.data
      const plans = plansRes.data.data

      const eng = await inquirer.prompt([
        {
          name: 'engine', message: 'Engine:', type: 'list',
          choices: engines.map((e: any) => e.engine),
        },
      ])
      const versions = engines.find((e: any) => e.engine === eng.engine)?.versions || []
      const rest = await inquirer.prompt([
        { name: 'name', message: 'Name:', default: `prod-${eng.engine}` },
        { name: 'version', message: 'Version:', type: 'list', choices: versions },
        {
          name: 'planId', message: 'Plan:', type: 'list',
          choices: plans.map((p: any) => ({ name: `${p.name}  ${p.cpu} vCPU · ${p.ramGB} GB`, value: p.id })),
        },
        {
          name: 'region', message: 'Region:', type: 'list',
          choices: regions.map((r: any) => ({ name: `${r.flag} ${r.city} (${r.slug})`, value: r.slug })),
        },
        { name: 'backupEnabled', message: 'Daily backups?', type: 'confirm', default: true },
      ])
      const spinner = ora('Creating database…').start()
      try {
        const r = await c.post('/databases', { ...eng, ...rest })
        spinner.succeed(`Database queued: ${chalk.cyan(r.data.data.id)}`)
        console.log(chalk.gray(`Run: nl db get ${r.data.data.id}`))
      } catch (e: any) { spinner.fail('Create failed'); handleError(e) }
    })

  cmd
    .command('rotate-password <id>')
    .description('Rotate the database password')
    .action(async (id) => {
      const spinner = ora('Rotating…').start()
      try {
        const r = await makeClient().post(`/databases/${id}/rotate-password`)
        spinner.succeed('Password rotated')
        console.log(chalk.gray('New password is in the connection string:'))
        console.log(chalk.cyan(r.data.data.connectionString))
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('delete <id>').alias('rm')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          { name: 'confirm', type: 'confirm', default: false, message: `Delete database ${chalk.red(id)}? All data lost.` },
        ])
        if (!confirm) return
      }
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/databases/${id}`)
        spinner.succeed('Database deleted')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })
}
