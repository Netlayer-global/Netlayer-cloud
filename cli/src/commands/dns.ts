import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { makeClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

export function dnsCommands(program: Command) {
  const cmd = program.command('dns').description('Manage DNS zones and records')

  cmd
    .command('zones')
    .description('List your DNS zones')
    .action(async () => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get('/dns/zones')
        spinner.stop()
        const zones = r.data.data || []
        if (zones.length === 0) {
          console.log(chalk.gray('No zones. Try:') + chalk.cyan(' nl dns add-zone'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('DOMAIN', 32) + padR('STATUS', 12) + 'RECORDS'))
        for (const z of zones) {
          console.log(
            padR(z.domain, 32) +
            padR(z.status, 12) +
            chalk.cyan(z._count?.records ?? 0)
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('add-zone <domain>')
    .description('Add a domain')
    .action(async (domain) => {
      const spinner = ora('Adding…').start()
      try {
        await makeClient().post('/dns/zones', { domain })
        spinner.succeed(`Zone added: ${chalk.cyan(domain)}`)
        console.log(chalk.gray('Point your domain to:'))
        console.log(chalk.cyan('  ns1.netlayer.cloud'))
        console.log(chalk.cyan('  ns2.netlayer.cloud'))
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('records <zoneId>')
    .description('List records in a zone')
    .action(async (zoneId) => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get(`/dns/zones/${zoneId}`)
        spinner.stop()
        const records = r.data.data.records || []
        if (records.length === 0) {
          console.log(chalk.gray('No records. Try:') + chalk.cyan(' nl dns add-record <zoneId>'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('TYPE', 8) + padR('NAME', 28) + padR('CONTENT', 36) + 'TTL'))
        for (const rec of records) {
          console.log(
            padR(rec.type, 8) +
            padR(rec.name, 28) +
            padR(rec.content.slice(0, 34), 36) +
            rec.ttl
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('add-record <zoneId>')
    .description('Add a DNS record (interactive)')
    .action(async (zoneId) => {
      const a = await inquirer.prompt([
        {
          name: 'type', message: 'Type:', type: 'list',
          choices: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'],
        },
        { name: 'name', message: 'Name (@ for root):', default: '@' },
        { name: 'content', message: 'Content:' },
        { name: 'ttl', message: 'TTL (seconds):', default: 300 },
      ])
      const body: any = { ...a, ttl: Number(a.ttl) }
      if (a.type === 'MX' || a.type === 'SRV') {
        const p = await inquirer.prompt([
          { name: 'priority', message: 'Priority:', default: 10 },
        ])
        body.priority = Number(p.priority)
      }
      const spinner = ora('Adding…').start()
      try {
        await makeClient().post(`/dns/zones/${zoneId}/records`, body)
        spinner.succeed('Record added')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('delete-record <zoneId> <recordId>')
    .description('Delete a record')
    .action(async (zoneId, recordId) => {
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/dns/zones/${zoneId}/records/${recordId}`)
        spinner.succeed('Record deleted')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('delete-zone <id>')
    .description('Delete an entire zone (and all records)')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          { name: 'confirm', type: 'confirm', default: false, message: `Delete zone ${chalk.red(id)} and ALL records?` },
        ])
        if (!confirm) return
      }
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/dns/zones/${id}`)
        spinner.succeed('Zone deleted')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })
}
