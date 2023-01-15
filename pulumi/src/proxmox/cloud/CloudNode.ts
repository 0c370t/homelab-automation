import * as command from "@pulumi/command"
import * as pulumi from "@pulumi/pulumi"
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {buildUrn, UrnDomains} from "../../utils/buildUrn";
import {CloudImageTemplate} from "./CloudImageTemplate";
import {ProxmoxServer} from "../Provider";
import {BuildVmOptions} from "./BuildVmOptions";
import {Outputable} from "../../types/outputable";
import {CloudConfig, CloudConfigArgs} from "./CloudConfig";
import {CertificateAuthorityCrt} from "../../utils/CertificateAuthority";
import {StackSSHCredentials} from "../../utils/StackSSHCredentials";
import {IgnoreableVmProperties} from "./constants";

export interface CloudNodeArgs {
    cloudImageTemplate: CloudImageTemplate,
    hostname: string,
    vmId: Outputable<number>,
    publicKeys: Outputable<string>[]
    cloudConfig?: Partial<CloudConfigArgs>
}

export class CloudNode extends pulumi.ComponentResource {

    readonly virtualMachine: proxmox.vm.VirtualMachine
    readonly cloudConfig: CloudConfig
    readonly connectionParams: command.remote.CommandArgs["connection"]

    constructor(name: string, args: CloudNodeArgs, opts: pulumi.ComponentResourceOptions) {
        super(buildUrn(UrnDomains.Proxmox, "ManagerNode"), name, {}, opts);

        this.cloudConfig = new CloudConfig(`${name} Cloud Config`, {
            hostname: args.hostname,
            sshKeys: args.publicKeys,
            defaultUser: "root",
            trustedCertificateAuthority: CertificateAuthorityCrt,
            ...args.cloudConfig
        })

        this.virtualMachine = new proxmox.vm.VirtualMachine(`${name} Virtual Machine`,
            BuildVmOptions({
                cloneFrom: args.cloudImageTemplate,
                cores: 4,
                driveSize: 32,
                isTemplate: false,
                memory: 4096,
                hostname: args.hostname,
                publicKeys: args.publicKeys,
                startOnCreate: true,
                userConfigFileId: this.cloudConfig.fileId,
                vmId: args.vmId
            }), {parent: this, provider: ProxmoxServer, ignoreChanges: IgnoreableVmProperties}
        )

        this.connectionParams = {
            privateKey: StackSSHCredentials.privKey,
            host: this.virtualMachine.ipv4Addresses[1][0],
            user: this.cloudConfig.user
        }
    }
}
