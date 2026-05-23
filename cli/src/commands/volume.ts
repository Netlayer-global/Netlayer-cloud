import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { makeClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

const STATUS_COLOR: Record<string, (s: string) => string> = {
  available: chalk.green,
  attached: chalk.cyan,
  detaching: chalk.yellow,
  deleting: chalk.red,
}
const fmtStatus = (s: string) => (STATUS_COLOR[s] || chalk.white)(s)

export function volumeCommands(program: Command) {
  const cmd = program.command('volume').alias('volumes').description('Manage block volumes')

  cmd
    .command('list')
    .alias('ls')
    .description('List your volumes')
    .action(async () => {
      const spinner = ora('Loading volumes…').start()
      try {
        const c = makeClient()
        const r = await c.get('/volumes')
        spinner.stop()
        const vols = r.data.data || []
        if (vols.length === 0) {
          console.log(chalk.gray('No volumes. Try:') + chalk.cyan(' nl volume create'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('ID', 12) + padR('NAME', 22) + padR('SIZE', 8) + padR('REGION', 10) + padR('ATTACHED', 18) + 'STATUS'))
        for (const v of vols) {
          console.log(
            padR(v.id.slice(0, 10), 12) +
            padR(v.name, 22) +
            padR(`${v.sizeGB} GB`, 8) +
            padR(v.region, 10) +
            padR(v.server?.name || '—', 18) +
            fmtStatus(v.status)
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('create')
    .description('Create a new block volume')
    .option('-n, --name <name>', 'volume name')
    .option('-s, --size <gb>', 'size in GB', (v) => parseInt(v, 10))
    .option('-r, --region <slug>', 'region slug')
    .action(async (opts) => {
      const c = makeClient()
      const regionsRes = await c.get('/regions')
      const regions = regionsRes.data.data

      const answers = await inquirer.prompt([
        { name: 'name', message: 'Volume name:', when: !opts.name, default: 'data-disk-01' },
        {
          name: 'sizeGB', message: 'Size (GB):', when: !opts.size, default: 100,
          validate: (v: any) => (Number(v) >= 10 ? true : 'Min 10 GB'),
        },
        {
          name: 'region', message: 'Region:', type: 'list', when: !opts.region,
          choices: regions.map((r: any) => ({ name: `${r.flag} ${r.city} (${r.slug})`, value: r.slug })),
        },
      ])

      const spinner = ora('Creating volume…').start()
      try {
        const r = await c.post('/volumes', {
          name: opts.name ?? answers.name,
          sizeGB: opts.size ?? Number(answers.sizeGB),
          region: opts.region ?? answers.region,
        })
        spinner.succeed(`Volume created: ${chalk.cyan(r.data.data.id)}`)
      } catch (e: any) { spinner.fail('Create failed'); handleError(e) }
    })

  cmd
    .command('attach <id> <serverId>')
    .description('Attach a volume to a server (must be in same region)')
    .action(async (id, serverId) => {
      const spinner = ora('Attaching…').start()
      try {
        await makeClient().post(`/volumes/${id}/attach`, { serverId })
        spinner.succeed('Attached')
      } catch (e: any) { spinner.fail('Attach failed'); handleError(e) }
    })

  cmd
    .command('detach <id>')
    .description('Detach a volume from its server')
    .action(async (id) => {
      const spinner = ora('Detaching…').start()
      try {
        await makeClient().post(`/volumes/${id}/detach`)
        spinner.succeed('Detached')
      } catch (e: any) { spinner.fail('Detach failed'); handleError(e) }
    })

  cmd
    .command('delete <id>')
    .alias('rm')
    .description('Delete a volume (must be detached first)')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          { name: 'confirm', type: 'confirm', default: false, message: `Delete volume ${chalk.red(id)}?` },
        ])
        if (!confirm) return
      }
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/volumes/${id}`)
        spinner.succeed('Volume deleted')
      } catch (e: any) { spinner.fail('Delete failed'); handleError(e) }
    })
}
