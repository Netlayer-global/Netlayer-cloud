# Ceph storage cluster — bootstrap

Distributed object storage and RBD block storage for NetLayer Cloud's compute
hosts. This directory holds the cluster bootstrap manifests.

## Layout

```
infra/storage/ceph/
  cluster.yaml              cephadm bootstrap spec (mons, mgrs, osds, mds, rgw)
  pools.yaml                Ceph pool definitions (replication factor, PGs)
  rbd-snapshot-policy.yaml  scheduled snapshot + retention policy
  cephadm-bootstrap.sh      one-shot bootstrap on the seed node
  README.md                 this file
```

## What you get

- **3 monitors + 3 managers** for HA control plane
- **OSDs** auto-provisioned from every empty disk on every Ceph host
- **3-replica replicated pool** for VM root disks (RBD)
- **EC 4+2 pool** for backups + snapshots (cheaper, slower)
- **CephFS** for shared marketplace image cache
- **RGW** (S3 gateway) on a dedicated pair of nodes — feeds NetLayer Object
  Storage when MinIO mode isn't desired

## Bring it up (real cluster)

```bash
# On the bootstrap node:
cd infra/storage/ceph
sudo ./cephadm-bootstrap.sh --mon-ip <ip-of-this-node>

# Add additional Ceph hosts:
ceph orch host add ceph-02 10.0.10.12
ceph orch host add ceph-03 10.0.10.13

# Apply specs:
ceph orch apply -i cluster.yaml
ceph osd pool create vms 128 128 replicated
ceph osd pool set vms size 3
rados -p vms ls

# Apply pool configuration:
ceph orch apply -i pools.yaml
```

## Integration with NetLayer

The compute service uses Ceph RBD as the backing store for VM root disks
when `STORAGE_BACKEND=ceph` is set. The default is local LVM storage on
each node — fine for single-node dev, not for production.

```env
# backend/.env (production)
STORAGE_BACKEND=ceph
CEPH_CLUSTER_NAME=netlayer
CEPH_MON_HOSTS=10.0.10.11:6789,10.0.10.12:6789,10.0.10.13:6789
CEPH_USERNAME=netlayer
CEPH_KEYRING=/etc/ceph/ceph.client.netlayer.keyring
CEPH_RBD_POOL=vms
```
