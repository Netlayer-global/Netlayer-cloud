import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { makeClient, handleError } from '../client'

const STATUS_COLOR: Record<string, (s: string) => string> = {
  RUNNING: chalk.green,
  STOPPED: chalk.gray,
  BUILDING: chalk.yellow,
  PENDING: chalk.yellow,
  ERROR: chalk.red,
  DELETING: chalk.red,
  REBOOTING: chalk.yellow,
  DELETED: chalk.gray,
}

const fmtStatus = (s: string) => (STATUS_COLOR[s] || chalk.white)(s.toLowerCase())

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

export function serverCommands(program: Command) {
  const cmd = program.command('server').alias('servers').description('Manage cloud servers')

  cmd
    .command('list')
    .alias('ls')
    .description('List your servers')
    .action(async () => {
      const spinner = ora('Loading servers…').start()
      try {
        const c = makeClient()
        const r = await c.get('/servers')
        spinner.stop()
        const servers = r.data.data || []
        if (servers.length === 0) {
          console.log(chalk.gray('No servers yet. Try:'))
          console.log(chalk.cyan('  nl server create'))
          return
        }
        console.log()
        console.log(
          chalk.bold(padR('ID', 12) + padR('NAME', 20) + padR('IP', 16) + padR('REGION', 10) + padR('PLAN', 14) + 'STATUS')
        )
        for (const s of servers) {
          console.log(
            padR(s.id.slice(0, 10), 12) +
            padR(s.name, 20) +
            padR(s.ipv4 || '—', 16) +
            padR(s.region?.slug || '—', 10) +
            padR(s.plan?.name || '—', 14) +
            fmtStatus(s.status)
          )
        }
        console.log()
      } catch (e: any) {
        spinner.fail('Failed to load servers')
        handleError(e)
      }
    })

  cmd
    .command('get <id>')
    .description('Show details for one server')
    .action(async (id) => {
      const spinner = ora('Loading…').start()
      try {
        const c = makeClient()
        const r = await c.get(`/servers/${id}`)
        spinner.stop()
        const s = r.data.data
        console.log()
        console.log(chalk.bold(s.name) + chalk.gray(`  ${s.id}`))
        console.log(`  hostname: ${chalk.cyan(s.hostname)}`)
        console.log(`  ipv4:     ${chalk.cyan(s.ipv4 || '—')}`)
        console.log(`  ipv6:     ${chalk.cyan(s.ipv6 || '—')}`)
        console.log(`  region:   ${chalk.cyan(s.region?.city)} (${s.region?.slug})`)
        console.log(`  plan:     ${chalk.cyan(s.plan?.name)}`)
        console.log(`  os:       ${chalk.cyan(s.osTemplate?.name)} ${s.osTemplate?.version}`)
        console.log(`  status:   ${fmtStatus(s.status)}`)
        console.log(`  created:  ${chalk.gray(new Date(s.createdAt).toLocaleString())}`)
        console.log()
      } catch (e: any) {
        spinner.fail('Failed to load server')
        handleError(e)
      }
    })

  cmd
    .command('create')
    .description('Deploy a new server (interactive)')
    .option('-n, --name <name>', 'server name')
    .option('-r, --region <slug>', 'region slug (e.g. bom1)')
    .option('-p, --plan <slug>', 'plan slug (e.g. c3.large)')
    .option('-o, --os <slug>', 'OS template slug (e.g. ubuntu-22-04)')
    .option('--ssh-key <id>', 'SSH key id')
    .action(async (opts) => {
      const c = makeClient()
      const [plansRes, regionsRes, osRes] = await Promise.all([
        c.get('/plans'), c.get('/regions'), c.get('/os'),
      ])
      const plans = plansRes.data.data
      const regions = regionsRes.data.data
      const oses = osRes.data.data

      const answers = await inquirer.prompt([
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
          choices: regions.map((r: any) => ({
            name: `${r.flag} ${r.city} (${r.slug})`,
            value: r.slug,
          })),
        },
        {
          name: 'plan',
          message: 'Plan:',
          type: 'list',
          when: !opts.plan,
          choices: plans.map((p: any) => ({
            name: `${p.name}  ${p.cpu} vCPU · ${p.ramGB} GB RAM · ${p.diskGB} GB NVMe  — ₹${p.priceMonthly}/mo`,
            value: p.slug,
          })),
        },
        {
          name: 'os',
          message: 'OS template:',
          type: 'list',
          when: !opts.os,
          choices: oses.map((o: any) => ({
            name: `${o.name} ${o.version}`,
            value: o.slug,
          })),
        },
      ])

      const name = opts.name ?? answers.name
      const regionSlug = opts.region ?? answers.region
      const planSlug = opts.plan ?? answers.plan
      const osSlug = opts.os ?? answers.os

      const region = regions.find((r: any) => r.slug === regionSlug)
      const plan = plans.find((p: any) => p.slug === planSlug)
      const os = oses.find((o: any) => o.slug === osSlug)

      if (!region || !plan || !os) {
        console.error(chalk.red('✗ Could not resolve region/plan/os from the provided slugs'))
        process.exit(1)
      }

      const spinner = ora(`Deploying ${chalk.cyan(name)} in ${chalk.cyan(region.city)}…`).start()
      try {
        const r = await c.post('/servers', {
          name,
          regionId: region.id,
          planId: plan.id,
          osTemplateId: os.id,
          ...(opts.sshKey ? { sshKeyId: opts.sshKey } : {}),
        })
        const server = r.data.data
        spinner.succeed(`Deployment queued: ${chalk.cyan(server.id)}`)
        console.log(chalk.gray('Run:'))
        console.log(chalk.cyan(`  nl server get ${server.id}`))
      } catch (e: any) {
        spinner.fail('Deploy failed')
        handleError(e)
      }
    })

  cmd
    .command('power <id> <action>')
    .description('Power action: start | stop | restart')
    .action(async (id, action) => {
      const valid = ['start', 'stop', 'restart']
      if (!valid.includes(action)) {
        console.error(chalk.red(`✗ Invalid action. Choose: ${valid.join(', ')}`))
        process.exit(1)
      }
      const spinner = ora(`${action[0].toUpperCase() + action.slice(1)}ing ${id}…`).start()
      try {
        const c = makeClient()
        await c.post(`/servers/${id}/power`, { action })
        spinner.succeed(`Server ${action} queued`)
      } catch (e: any) {
        spinner.fail('Power action failed')
        handleError(e)
      }
    })

  cmd
    .command('destroy <id>')
    .alias('delete')
    .description('Permanently delete a server')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          {
            name: 'confirm', type: 'confirm', default: false,
            message: `Permanently destroy server ${chalk.red(id)}? This cannot be undone.`,
          },
        ])
        if (!confirm) {
          console.log(chalk.gray('Aborted.'))
          return
        }
      }
      const spinner = ora('Destroying…').start()
      try {
        const c = makeClient()
        await c.delete(`/servers/${id}`)
        spinner.succeed('Server destroyed')
      } catch (e: any) {
        spinner.fail('Destroy failed')
        handleError(e)
      }
    })
}
