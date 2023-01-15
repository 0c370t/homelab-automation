import * as pulumi from "@pulumi/pulumi"
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {ProxmoxDatastore, ProxmoxTargetNode} from "../Provider";
import {CloudImageTemplate} from "./CloudImageTemplate";
import {Outputable} from "../../types/outputable";

export interface BuildVmOptionsArgs {
    cloneFrom?: Outputable<CloudImageTemplate>
    cores: Outputable<number>,
    description?: Outputable<string>,
    driveSize: Outputable<number>,
    driveFileId?: Outputable<string>,
    isTemplate?: Outputable<boolean>,
    memory: Outputable<number>,
    hostname: Outputable<string>,
    publicKeys: Outputable<string>[],
    startOnCreate?: Outputable<boolean>,
    tags?: Outputable<string>[],
    targetNode?: Outputable<string>,
    userConfigFileId?: Outputable<string>,
    vmId: Outputable<number>,
}

export const BuildVmOptions: (args: BuildVmOptionsArgs) => proxmox.vm.VirtualMachineArgs = (args) => ({
        agent: {enabled: true},
        audioDevice: {enabled: false, device: "intel-hda", driver: "spice"},
        cdrom: {enabled: false},
        clone: args.cloneFrom ? {
            datastoreId: ProxmoxDatastore,
            full: true,
            nodeName: args.targetNode ?? ProxmoxTargetNode,
            retries: 0,
            vmId: args.cloneFrom.templateVm.vmId as pulumi.Output<number>
        } : undefined,
        cpu: {
            sockets: 1,
            cores: args.cores
        },
        description: args.description ?? "This is a basic VM",
        disks: [
            {
                interface: "scsi0",
                datastoreId: ProxmoxDatastore,
                fileId: args.driveFileId,
                fileFormat: "qcow2",
                size: args.driveSize,
                speed: {
                    read: 0,
                    readBurstable: 0,
                    write: 0,
                    writeBurstable: 0
                }
            }
        ],
        hostpcis: [],
        // Cloud Init Configuration
        initialization: {
            datastoreId: ProxmoxDatastore,
            userAccount: {
                username: "root",
                keys: args.publicKeys
            },
            userDataFileId: args.userConfigFileId,
            ipConfigs: [{
                ipv4: {
                    address: "dhcp",
                }
            }],
            type: "nocloud",
        },
        memory: {
            dedicated: args.memory,
            shared: args.memory
        },
        name: args.hostname,
        networkDevices: [{
            bridge: "vmbr0",
            enabled: true,
        }],
        nodeName: args.targetNode ?? ProxmoxTargetNode,
        operatingSystem: {type: "l26"},
        started: Boolean(args.startOnCreate),
        serialDevices: [{device: "socket"}],
        template: args.isTemplate,
        tags: ["pulumi-managed"],
        vga: {
            enabled: false,
            memory: 16,
            type: "std"
        },
        vmId: args.vmId,
    }
)
