import prisma from '../utils/prisma'
import { emitToUser } from './socket.service'
import logger from '../utils/logger'

/**
 * Round 19 — central notify helper.
 *
 * Always create the in-app notification first (durable), then push to the
 * user's socket room. We never throw from here: notification failures must
 * not break the calling business flow. Falls back to logger.warn.
 *
 * Existing places that did a direct `prisma.notification.create` still work
 * untouched; this helper is for new emit-on-create flows (alerts, deploy
 * milestones, billing events).
 */

export interface NotifyArgs {
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
}

export async function notify(args: NotifyArgs): Promise<void> {
  try {
    const created = await prisma.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        message: args.message,
        link: args.link ?? null,
      },
    })

    emitToUser(args.userId, 'notification', {
      id: created.id,
      type: created.type,
      title: created.title,
      message: created.message,
      link: created.link,
      isRead: false,
      createdAt: created.createdAt,
    })
  } catch (e: any) {
    logger.warn({ err: e.message, userId: args.userId, type: args.type }, 'notify failed')
  }
}

/** Convenience: bulk fan-out to many users (e.g. status incident broadcasts). */
export async function notifyMany(userIds: string[], payload: Omit<NotifyArgs, 'userId'>): Promise<void> {
  await Promise.all(userIds.map((userId) => notify({ ...payload, userId })))
}
