import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { makeClient, handleError } from '../client'

const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

const KEY_HINTS = [
  '~/.ssh/id_ed25519.pub',
  '~/.ssh/id_rsa.pub',
  '~/.ssh/id_ecdsa.pub',
]

export function sshKeyCommands(program: Command) {
  const cmd = program.command('ssh-key').alias('ssh-keys').description('Manage your SSH public keys')

  cmd
    .command('list').alias('ls')
    .action(async () => {
      const spinner = ora('Loading…').start()
      try {
        const r = await makeClient().get('/ssh-keys')
        spinner.stop()
        const keys = r.data.data || []
        if (keys.length === 0) {
          console.log(chalk.gray('No SSH keys. Try:') + chalk.cyan(' nl ssh-key add'))
          return
        }
        console.log()
        console.log(chalk.bold(padR('ID', 12) + padR('NAME', 24) + 'FINGERPRINT'))
        for (const k of keys) {
          console.log(
            padR(k.id.slice(0, 10), 12) +
            padR(k.name, 24) +
            chalk.gray(k.fingerprint)
          )
        }
        console.log()
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('add')
    .description('Add an SSH public key (reads from a file or pastes inline)')
    .option('-n, --name <name>', 'key name')
    .option('-f, --file <path>', 'path to public key file (e.g. ~/.ssh/id_ed25519.pub)')
    .action(async (opts) => {
      const a: any = {}
      if (!opts.name) {
        const r = await inquirer.prompt([
          { name: 'name', message: 'Name:', default: 'my-laptop', validate: (v: string) => !!v.trim() || 'Required' },
        ])
        a.name = r.name
      }
      let publicKey: string
      if (opts.file) {
        const path = opts.file.replace(/^~/, homedir())
        try { publicKey = readFileSync(path, 'utf-8').trim() }
        catch (e: any) { console.error(chalk.red(`✗ Cannot read ${path}: ${e.message}`)); process.exit(1) }
      } else {
        const r = await inquirer.prompt([
          {
            name: 'mode', message: 'How do you want to provide the key?', type: 'list',
            choices: [
              ...KEY_HINTS
                .filter((h) => {
                  try { readFileSync(h.replace(/^~/, homedir())); return true } catch { return false }
                })
                .map((h) => ({ name: `Read from ${h}`, value: `file:${h}` })),
              { name: 'Paste public key inline', value: 'paste' },
            ],
          },
        ])
        if (String(r.mode).startsWith('file:')) {
          const path = r.mode.replace(/^file:/, '').replace(/^~/, homedir())
          publicKey = readFileSync(path, 'utf-8').trim()
        } else {
          const p = await inquirer.prompt([
            {
              name: 'publicKey', message: 'Paste your public key (single line):',
              type: 'input',
              validate: (v: string) =>
                /^(ssh-rsa|ssh-ed25519|ecdsa-sha2)/.test(v.trim()) ||
                'Must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2',
            },
          ])
          publicKey = p.publicKey.trim()
        }
      }

      const spinner = ora('Adding key…').start()
      try {
        const r = await makeClient().post('/ssh-keys', {
          name: opts.name ?? a.name,
          publicKey,
        })
        spinner.succeed(`SSH key added: ${chalk.cyan(r.data.data.fingerprint)}`)
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })

  cmd
    .command('delete <id>').alias('rm')
    .option('-y, --yes', 'skip confirmation')
    .action(async (id, opts) => {
      if (!opts.yes) {
        const { confirm } = await inquirer.prompt([
          { name: 'confirm', type: 'confirm', default: false, message: `Delete SSH key ${chalk.red(id)}?` },
        ])
        if (!confirm) return
      }
      const spinner = ora('Deleting…').start()
      try {
        await makeClient().delete(`/ssh-keys/${id}`)
        spinner.succeed('SSH key deleted')
      } catch (e: any) { spinner.fail('Failed'); handleError(e) }
    })
}

// Default Windows path that Conf.path uses — referenced for help text only
void join
