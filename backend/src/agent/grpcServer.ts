/**
 * Control-plane gRPC server for NetLayer Agent.
 *
 * Implements the `AgentBus.Connect` bidirectional stream defined in
 * agent/proto/agent/v1/agent.proto. Each connected agent is tracked in an
 * in-memory registry; commands sent to an agent are queued and pushed
 * down its outbound stream.
 *
 * The server is OPTIONAL: it only starts when AGENT_GRPC_PORT is set in
 * the env. Mock-mode platforms keep using the existing direct-Proxmox
 * path; production switches to gRPC by setting AGENT_GRPC_PORT and
 * generating the proto stubs (`make proto` in agent/).
 *
 * Why dynamic require: the @grpc/grpc-js package is heavy (~6 MB).
 * Loading it only when the server is actually starting keeps the dev
 * experience snappy and the npm install fast.
 */

import path from 'path'
import logger from '../utils/logger'
import * as eventBus from '../events/bus'
import { EVENTS } from '../events/bus'

interface ConnectedAgent {
  agentId: string
  hostname: string
  version: string
  connectedAt: Date
  lastHeartbeat: Date
  send: (msg: any) => void
}

const agents = new Map<string, ConnectedAgent>()

export function listConnectedAgents() {
  return Array.from(agents.values()).map((a) => ({
    agentId: a.agentId,
    hostname: a.hostname,
    version: a.version,
    connectedAt: a.connectedAt,
    lastHeartbeat: a.lastHeartbeat,
    secondsSinceHeartbeat: Math.round((Date.now() - a.lastHeartbeat.getTime()) / 1000),
  }))
}

export function sendCommand(agentId: string, cmd: any): boolean {
  const a = agents.get(agentId)
  if (!a) return false
  a.send({ payload: { command: cmd } })
  return true
}

export async function startGrpcServer(): Promise<void> {
  const port = process.env.AGENT_GRPC_PORT
  if (!port) {
    logger.info('Agent gRPC server disabled (no AGENT_GRPC_PORT set)')
    return
  }

  // Dynamic require so platforms that don't need gRPC don't pay the cost.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const dynamicRequire = new Function('m', 'return require(m)') as (m: string) => any

  let grpc: any
  let protoLoader: any
  try {
    grpc = dynamicRequire('@grpc/grpc-js')
    protoLoader = dynamicRequire('@grpc/proto-loader')
  } catch (e: any) {
    logger.warn(
      { err: e.message },
      'Agent gRPC dependencies not installed. Run: npm i @grpc/grpc-js @grpc/proto-loader'
    )
    return
  }

  const protoPath = path.resolve(
    process.cwd(),
    '..',
    'agent',
    'proto',
    'agent',
    'v1',
    'agent.proto'
  )
  const definition = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: Number,
    defaults: true,
    oneofs: true,
  })
  const pkg: any = grpc.loadPackageDefinition(definition).netlayer.agent.v1

  const server = new grpc.Server()
  server.addService(pkg.AgentBus.service, {
    Connect: (call: any) => {
      let agentId: string | undefined

      const send = (msg: any) => {
        try {
          call.write(msg)
        } catch (err: any) {
          logger.warn({ err: err.message, agentId }, 'agent stream write failed')
        }
      }

      call.on('data', (msg: any) => {
        const ts = new Date()
        if (msg.hello) {
          agentId = msg.hello.agentId
          if (!agentId) return
          agents.set(agentId, {
            agentId,
            hostname: msg.hello.hostname || agentId,
            version: msg.hello.version || 'unknown',
            connectedAt: ts,
            lastHeartbeat: ts,
            send,
          })
          send({ payload: { welcome: { agentId, heartbeatIntervalSeconds: 30, telemetryIntervalSeconds: 60 } } })
          logger.info({ agentId, hostname: msg.hello.hostname, version: msg.hello.version }, 'agent connected')
          void eventBus.publish('agent.connected', { agentId, hostname: msg.hello.hostname, version: msg.hello.version })
        } else if (msg.heartbeat && agentId) {
          const a = agents.get(agentId)
          if (a) a.lastHeartbeat = ts
        } else if (msg.telemetry && agentId) {
          // Persist or aggregate telemetry as needed; for now we just emit
          // an event the metrics collector can subscribe to.
          void eventBus.publish('agent.telemetry', { agentId, ...msg.telemetry })
        } else if (msg.ack && agentId) {
          void eventBus.publish('agent.command_ack', {
            agentId,
            commandId: msg.ack.commandId,
            success: msg.ack.success,
            error: msg.ack.error,
          })
        } else if (msg.vmEvent && agentId) {
          void eventBus.publish(EVENTS.SERVER_RUNNING, {
            agentId,
            vmId: msg.vmEvent.vmId,
            eventType: msg.vmEvent.eventType,
            detail: msg.vmEvent.detail,
          })
        }
      })

      call.on('end', () => {
        if (agentId) {
          agents.delete(agentId)
          logger.info({ agentId }, 'agent disconnected')
          void eventBus.publish('agent.disconnected', { agentId })
          call.end()
        }
      })

      call.on('error', (err: any) => {
        logger.warn({ err: err.message, agentId }, 'agent stream error')
        if (agentId) agents.delete(agentId)
      })
    },
  })

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err: any) => {
      if (err) return reject(err)
      logger.info(`Agent gRPC server listening on 0.0.0.0:${port}`)
      resolve()
    })
  })
}
