import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { makeClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

const formatBytes = (n: number) => {
  if (n === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(k))
  return `${(n / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function bucketCommands(program: Command) {
  const cmd = program.command('bucket').alias('buckets').description('Manage object-storage buckets')

  cmd
    .command('list').alias('ls')
    .action(async () => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get('/storage/buckets')
        spinner.stop()
        const buckets = r.data.data || []
        if (buckets.length === 0) {
          console.log(chalk.gray('No buckets. Try:') + chalk.cyan(' nl bucket create'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('NAME', 28) + padR('REGION', 10) + padR('OBJECTS', 10) + padR('SIZE', 12) + 'ACCESS'))
        for (const b of buckets) {
          console.log(
            padR(b.name, 28) +
            padR(b.region, 10) +
            padR(`${b.objects}`, 10) +
            padR(formatBytes(b.sizeBytes), 12) +
            (b.isPublic ? chalk.yellow('public') : chalk.green('private'))
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('create')
    .description('Create a new bucket')
    .action(async () => {
      const c = makeClient()
      const a = await inquirer.prompt([
        { name: 'name', message: 'Bucket name (lowercase, hyphens):' },
        {
          name: 'region', message: 'Region:', default: 'us-east-1',
          type: 'list',
          choices: ['us-east-1', 'us-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1'],
        },
        { name: 'isPublic', message: 'Public access?', type: 'confirm', default: false },
      ])
      const spinner = ora('Creating…').start()
      try {
        const r = await c.post('/storage/buckets', a)
        spinner.succeed(`Bucket created: ${chalk.cyan(r.data.data.name)}`)
        if (a.isPublic) console.log(chalk.yellow('  Note: bucket is publicly accessible.'))
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('objects <bucketId>')
    .description('List objects in a bucket')
    .option('--prefix <prefix>', 'filter by prefix', '')
    .action(async (bucketId, opts) => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get(`/storage/buckets/${bucketId}/objects?prefix=${encodeURIComponent(opts.prefix || '')}`)
        spinner.stop()
        const objects = r.data.data || []
        if (objects.length === 0) {
          console.log(chalk.gray('Empty.'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('KEY', 50) + padR('SIZE', 12) + 'MODIFIED'))
        for (const o of objects) {
          console.log(
            padR(o.key.slice(0, 48), 50) +
            padR(formatBytes(o.size), 12) +
            chalk.gray(new Date(o.lastModified).toLocaleString())
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('delete <id>').alias('rm')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          { name: 'confirm', type: 'confirm', default: false, message: `Delete bucket ${chalk.red(id)} and ALL objects?` },
        ])
        if (!confirm) return
      }
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/storage/buckets/${id}`)
        spinner.succeed('Bucket deleted')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })
}
