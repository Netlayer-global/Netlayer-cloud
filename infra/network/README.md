# NetLayer network — VXLAN EVPN with FRRouting

Tenant-isolated overlay networking. Each VPC gets its own VNI; tenant traffic
is encapsulated in VXLAN and routed via EVPN BGP between leaf switches /
hypervisor hosts.

## Layout

```
infra/network/
  frr/                FRRouting configs
    frr.conf          Leaf-switch BGP+EVPN template
    frr-spine.conf    Spine route reflector template
  ovs/                Open vSwitch bring-up scripts
    init-vtep.sh      Configure each compute host as a VTEP
    add-vpc.sh        Create per-tenant VLAN + VNI mapping
  ansible/            Ansible playbook for the whole fleet
    playbook.yml
    roles/
  README.md           this file
```

## What this achieves

- **Tenant isolation**: VMs in different VPCs cannot reach each other across
  the underlay
- **Layer-2 stretching**: a VPC's subnet can span multiple racks/hosts
- **No SDN controller required** — vanilla FRR + OVS, BGP-EVPN does control plane
- **Anti-spoofing** via OVS flow rules; only the assigned MAC/IP can egress

## Bring up a leaf switch

```bash
# On each compute host (acts as VTEP):
sudo apt install -y frr frr-pythontools openvswitch-switch
sudo cp infra/network/frr/frr.conf /etc/frr/frr.conf
# substitute placeholders, see top of file
sudo systemctl enable --now frr
sudo bash infra/network/ovs/init-vtep.sh <loopback-ip>
```

## Wire a new VPC

When the API creates a new VPC, the workflow engine runs:

```bash
infra/network/ovs/add-vpc.sh <vni> <vlan> <cidr> <gateway>
```

on every compute host in the VPC's region. The script idempotently:

1. Adds the VLAN tag to br-int
2. Maps it to the VNI on br-vxlan
3. Pushes the gateway IP to a per-VPC SVI

The mapping is also stored in the API's `VPC` table so the next host added
to the region picks up the same VNI.

## Anti-spoofing

OVS pipeline:

```
table=0 → priority=100 anti-spoofing in_port=tap1 actions=resubmit(,1)
table=1 → priority=200 dl_src=<vm-mac>,nw_src=<vm-ip> actions=resubmit(,2)
table=1 → priority=10  actions=drop                        # default deny
table=2 → priority=100 actions=normal                      # tenant pipeline
```

`add-vpc.sh` installs the anti-spoof flows for each VM at port-attach time.
