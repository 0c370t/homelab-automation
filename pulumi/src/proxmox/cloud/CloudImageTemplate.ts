import * as pulumi from "@pulumi/pulumi"
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import * as command from "@pulumi/command"
import {buildUrn, UrnDomains} from "../../utils/buildUrn";
import {ProxmoxDatastore, ProxmoxServer, ProxmoxTargetNode,} from "../Provider";

/**
 * Default URL for a cloud image
 */
const UBUNTU_CLOUD_IMAGE_URL = "https://cloud-images.ubuntu.com/bionic/current/bionic-server-cloudimg-amd64.img"

// const DEBIAN_CLOUD_IMAGE_URL = "https://cdimage.debian.org/cdimage/cloud/buster/20221224-1239/debian-10-genericcloud-amd64-20221224-1239.qcow2"

export interface CloudImageTemplateArgs {
    /**
     * Public keys to install by default
     */
    publicKeys: (string | pulumi.Output<string>)[]
    /**
     * Must be a qcow2 url
     */
    cloudImageUrl?: string
}

export class CloudImageTemplate extends pulumi.ComponentResource {

    static readonly defaultUrl = "https://cloud-images.ubuntu.com/bionic/current/bionic-server-cloudimg-amd64.img"

    readonly templateVm: proxmox.vm.VirtualMachine
    readonly cloudImage: proxmox.storage.File

    constructor(name: string, {
        publicKeys,
        cloudImageUrl = CloudImageTemplate.defaultUrl
    }: CloudImageTemplateArgs, opts?: pulumi.ComponentResourceOptions) {
        super(buildUrn(UrnDomains.Proxmox, "CloudImageTemplate"), name, {}, opts)

        this.cloudImage = new proxmox.storage.File(`${name} Template Cloud Image`, {
            contentType: "iso",
            datastoreId: ProxmoxDatastore,
            nodeName: ProxmoxTargetNode,
            sourceFile: {
                path: cloudImageUrl,
            }
        }, {parent: this, provider: ProxmoxServer, ignoreChanges: ["sourceFile"]})
        this.cloudImage.id.apply(console.log)

        this.templateVm = new proxmox.vm.VirtualMachine(`${name} Template Virtual Machine`, {
            agent: {enabled: true},
            audioDevice: { enabled: false },
            cdrom: {enabled: false},
            cpu: {
                sockets: 1,
                cores: 4
            },
            description: "This virtual machine should **never** be started; it is used to clone and create other VMs with cloud init",
            disks: [
                {
                    interface: "scsi0",
                    datastoreId: ProxmoxDatastore,
                    fileId: this.cloudImage.id,
                    fileFormat: "qcow2",
                    size: 32,
                }
            ],
            // Cloud Init Configuration
            initialization: {
                datastoreId: ProxmoxDatastore,
                userAccount: {
                    username: "root",
                    keys: publicKeys
                },
                ipConfigs: [{
                    ipv4: {
                        address: "dhcp",
                    }
                }],
                type: "nocloud",
            },
            memory: {
                dedicated: 4096,
                shared: 4096
            },
            name: "Debian-Cloud-Template",
            networkDevices: [{
                bridge: "vmbr0",
                enabled: true,
            }],
            nodeName: ProxmoxTargetNode,
            operatingSystem: {type: "l26"},
            started: false,
            serialDevices: [{ device: "socket" }],
            template: true,
            tags: ["pulumi-managed"],
            vga: {
                enabled: false
            },
            vmId: 10000000,
        }, {provider: ProxmoxServer, parent: this})
    }
}
