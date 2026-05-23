import axios, { AxiosInstance } from 'axios'
import chalk from 'chalk'
import { config } from './config'

export function makeClient(): AxiosInstance {
  const apiUrl = config.get('apiUrl')
  const apiKey = config.get('apiKey')

  if (!apiKey) {
    console.error(chalk.red('No API key configured. Run:'))
    console.error(chalk.cyan('  nl login'))
    process.exit(1)
  }

  return axios.create({
    baseURL: apiUrl,
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30_000,
  })
}

export function makeAnonClient(apiUrl?: string): AxiosInstance {
  return axios.create({
    baseURL: apiUrl || config.get('apiUrl'),
    timeout: 30_000,
  })
}

export function handleError(err: any): never {
  const status = err.response?.status
  const data = err.response?.data
  if (data?.error) {
    console.error(chalk.red(`✗ ${data.error}`) + (data.code ? chalk.gray(` [${data.code}]`) : ''))
  } else if (status) {
    console.error(chalk.red(`✗ HTTP ${status}: ${err.message}`))
  } else {
    console.error(chalk.red(`✗ ${err.message || 'Unknown error'}`))
  }
  process.exit(1)
}
