/**
 * Seeds one mock Proxmox node per region so deploys can land anywhere
 * during local development. Idempotent — re-running is safe.
 *
 *   npx ts-node scripts/seed-nodes.ts
 */
import prisma from '../src/utils/prisma'

async function main() {
  const regions = await prisma.region.findMany({ orderBy: { city: 'asc' } })
  console.log(`Found ${regions.length} regions`)

  let created = 0
  let skipped = 0

  for (const r of regions) {
    const existing = await prisma.node.findFirst({
      where: { regionId: r.id, isActive: true },
    })
    if (existing) {
      skipped++
      console.log(`  ↷ ${r.city.padEnd(14)} already has node "${existing.name}"`)
      continue
    }

    const slug = `${r.slug}-node-01`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const ipBase = 100 + Math.floor(Math.random() * 100)

    await prisma.node.create({
      data: {
        name: `${r.city} Node 01`,
        slug,
        regionId: r.id,
        proxmoxHost: 'https://mock.netlayer.com:8006',
        proxmoxNode: 'pve',
        proxmoxTokenId: 'netlayer@pam!api',
        proxmoxTokenSecret: 'mock-secret',
        totalCpu: 32,
        totalRamGB: 128,
        totalDiskGB: 3840,
        usedCpu: 0,
        usedRamGB: 0,
        usedDiskGB: 0,
        maxVMs: 50,
        currentVMs: 0,
        status: 'ONLINE',
        isActive: true,
        networkGbps: 10,
        ipRanges: JSON.stringify([`103.21.${ipBase}.0/24`]),
        lastSyncAt: new Date(),
      },
    })
    created++
    console.log(`  ✓ ${r.city.padEnd(14)} ${r.flag} created mock node`)
  }

  console.log()
  console.log(`Done — ${created} created, ${skipped} skipped`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
