import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { makeClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

export function lbCommands(program: Command) {
  const cmd = program.command('lb').alias('load-balancer').description('Manage load balancers')

  cmd
    .command('list').alias('ls')
    .description('List load balancers')
    .action(async () => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get('/load-balancers')
        spinner.stop()
        const lbs = r.data.data || []
        if (lbs.length === 0) {
          console.log(chalk.gray('No load balancers. Try:') + chalk.cyan(' nl lb create'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('ID', 12) + padR('NAME', 22) + padR('REGION', 10) + padR('ENDPOINT', 24) + padR('TARGETS', 10) + 'STATUS'))
        for (const lb of lbs) {
          const healthy = (lb.targets || []).filter((t: any) => t.isHealthy).length
          const total = (lb.targets || []).length
          console.log(
            padR(lb.id.slice(0, 10), 12) +
            padR(lb.name, 22) +
            padR(lb.region, 10) +
            padR(`${lb.protocol.toLowerCase()}://${lb.ipv4}:${lb.port}`, 24) +
            padR(`${healthy}/${total}`, 10) +
            (lb.status === 'active' ? chalk.green(lb.status) : chalk.yellow(lb.status))
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('create')
    .description('Create a new load balancer')
    .action(async () => {
      const c = makeClient()
      const regionsRes = await c.get('/regions')
      const regions = regionsRes.data.data
      const answers = await inquirer.prompt([
        { name: 'name', message: 'Name:', default: 'web-lb-01' },
        {
          name: 'region', message: 'Region:', type: 'list',
          choices: regions.map((r: any) => ({ name: `${r.flag} ${r.city} (${r.slug})`, value: r.slug })),
        },
        {
          name: 'protocol', message: 'Protocol:', type: 'list',
          choices: ['HTTP', 'HTTPS', 'TCP'], default: 'HTTP',
        },
        { name: 'port', message: 'Port:', default: 80, validate: (v: any) => Number(v) > 0 },
        {
          name: 'algorithm', message: 'Algorithm:', type: 'list',
          choices: ['round_robin', 'least_connections', 'ip_hash'], default: 'round_robin',
        },
      ])
      const spinner = ora('Creating…').start()
      try {
        const r = await c.post('/load-balancers', { ...answers, port: Number(answers.port) })
        spinner.succeed(`LB created: ${chalk.cyan(r.data.data.id)} at ${chalk.cyan(r.data.data.ipv4)}`)
      } catch (e: any) { spinner.fail('Create failed'); handleError(e) }
    })

  cmd
    .command('add-target <lbId> <serverId>')
    .description('Add a server target to an LB')
    .option('--port <port>', 'target port', '80')
    .option('--weight <w>', 'weight (1-100)', '1')
    .action(async (lbId, serverId, opts) => {
      const spinner = ora('Adding…').start()
      try {
        await makeClient().post(`/load-balancers/${lbId}/targets`, {
          serverId, port: Number(opts.port), weight: Number(opts.weight),
        })
        spinner.succeed('Target added')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('delete <id>').alias('rm')
    .description('Delete a load balancer')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          { name: 'confirm', type: 'confirm', default: false, message: `Delete LB ${chalk.red(id)}?` },
        ])
        if (!confirm) return
      }
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/load-balancers/${id}`)
        spinner.succeed('Load balancer deleted')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })
}
