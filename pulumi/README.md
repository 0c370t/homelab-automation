# ⚠ Warning ⚠
This is currently using modified versions of several packages that haven't been updated and/or included in this repository.
It will not work locally until that is sorted.

Modified Packages:
  - **@muhlba91/pulumi-proxmoxve**  
    This was modified to use a newer version of the underlying terraform provider [bpg/terraform-provider-proxmox](https://github.com/bpg/terraform-provider-proxmox)  
    which itself was modified to fix [this issue](https://github.com/bpg/terraform-provider-proxmox/issues/203).

# Required Configuration Values

| Value                      | Description                                                            | Secret | Required | Example Value                   | 
|----------------------------|------------------------------------------------------------------------|--------|----------|---------------------------------|
| proxmoxVeEndpoint          | Proxmox API Endpoint                                                   | ✅      | ✅        | `http://proxmox-host.com:8006/` |
| proxmoxVeInsecure          | ???                                                                    | ❌      | ✅        | `true`                          |
| proxmoxUsername            | Username for Proxmox Auth                                              | ✅      | ✅        | `user@realm`                    |
| proxmoxPassword            | Password for Proxmox Auth                                              | ✅      | ✅        | `some-password`                 |
| proxmoxDatastore           | Datastore to use for configuration files                               | ❌      | ✅        | `local`                         |
| proxmoxDatastoreRoot       | Filesystem root for the preferred datastore                            | ✅      | ✅        | `/var/lib/vz`                   |
| proxmoxNode                | Proxmox Node to interact with                                          | ❌      | ✅        | `proxmox-host`                  |
| proxmoxPublicKey           | Public Key to access created VMs                                       | ❌      | ❌        |                                 |
| certificateAuthorityCrtUrl | URL to download the .crt file for a self-managed certificate authority | ✅      | ❌        |                                 |

# Proxmox User Configuration

## Setup:

### Simple Configuration:

- Set configuration `proxmoxVeEndpoint` (secret)
    - This should be the same URL as the web interface, i.e. http://proxmox-host:8006
- Set configuration `proxmoxVeInsecure`
    - Set `true` if you are using a self-signed / untrusted certificate, false if you have a trusted CA/cert
    - If you aren't sure, you probably want `true`
- Set the configuration `proxmoxPreferredDatastore` to the name of the storage provider you want to use
    - A common choice would be `local`, however if you have a cluster, some sort of shared storage is going to make life
      easier
- Set the configuration `proxmoxNode`

### Network Setup

- You must ensure that you have a CIDR/Gateway set for the node `proxmoxNode`; otherwise certain operations fail.
    - This can be configured under `NodeName/System/Network/vmbr0`

### User / Group Setup

- Create a user (You _must_ use `pam`, as certain aspects rely on SSH)
    - Add to pulumi config as `proxmoxUsername` (secret)
- Create a password
    - Add to pulumi config as `proxmoxPassword` (secret)
- Assign the [Required Permissions](#required-permissions)

### Host Configuration

You should _never_ plug in root credentials to anything (memorize, don't compromise).
As a result, there is some manual configuration that we need to do.

1. Create a spot for qcow templates

```bash
# Create the directory
mkdir -p /var/lib/vz/template/qcow
# TODO: Make this more secure.
# We are going to place a debian cloud image here; and our user needs write permissions
chmod 777 /var/lib/vz/template/qcow 
```

### Required Permissions

#### Path `/`

Suggested Role Title: `Pulumi-Cluster-Audit`

- `Sys.Audit`
- `Datastore.Audit`

#### Path `/storage/$YOUR_STORAGE_ID`

Suggested Role Title: `Pulumi-Storage-Edit`

- ``

#### Path `/node/$YOUR_NODE_ID`

Suggested Role Title: `Pulumi-VM-Manage`

- `VM.Allocate`
- `VM.Audit`
- `VM.Clone`
- `VM.Config.CDROM`
- `VM.Config.CPU`
- `VM.Config.Cloudinit`
- `VM.Config.Disk`
- `VM.Config.HWType`
- `VM.Config.Memory`
- `VM.Config.Network`
- `VM.Config.Options`
- `VM.PowerMgmt`
- `VM.Snapshot`
- `VM.Snapshot.Rollback`
