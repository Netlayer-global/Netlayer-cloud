import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { makeAnonClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

export function catalogCommands(program: Command) {
  program
    .command('plans')
    .description('List available plans (no auth required)')
    .action(async () => {
      const spinner = ora('Loading plans…').start()
      try {
        const r = await makeAnonClient().get('/plans')
        spinner.stop()
        console.log()
        console.log(chalk.bold(padR('SLUG', 14) + padR('vCPU', 6) + padR('RAM', 8) + padR('DISK', 10) + padR('BW', 8) + 'PRICE'))
        for (const p of r.data.data) {
          console.log(
            padR(p.slug, 14) +
            padR(`${p.cpu}`, 6) +
            padR(`${p.ramGB} GB`, 8) +
            padR(`${p.diskGB} GB`, 10) +
            padR(`${p.bandwidthTB} TB`, 8) +
            chalk.cyan(`₹${p.priceMonthly}/mo`) +
            (p.isPopular ? chalk.green('  ★ popular') : '')
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed to load plans'); handleError(e) }
    })

  program
    .command('regions')
    .description('List active regions (no auth required)')
    .action(async () => {
      const spinner = ora('Loading regions…').start()
      try {
        const r = await makeAnonClient().get('/regions')
        spinner.stop()
        console.log()
        console.log(chalk.bold(padR('SLUG', 8) + padR('CITY', 18) + padR('COUNTRY', 14) + 'FLAG'))
        for (const reg of r.data.data) {
          console.log(
            padR(reg.slug, 8) +
            padR(reg.city, 18) +
            padR(reg.country, 14) +
            (reg.flag || '')
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed to load regions'); handleError(e) }
    })

  program
    .command('os')
    .description('List active OS templates')
    .action(async () => {
      const spinner = ora('Loading OS templates…').start()
      try {
        const r = await makeAnonClient().get('/os')
        spinner.stop()
        console.log()
        console.log(chalk.bold(padR('SLUG', 22) + padR('NAME', 22) + 'VERSION'))
        for (const o of r.data.data) {
          console.log(padR(o.slug, 22) + padR(o.name, 22) + chalk.cyan(o.version))
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed to load OS templates'); handleError(e) }
    })
}
