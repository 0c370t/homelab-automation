import * as command from "@pulumi/command"
import * as pulumi from "@pulumi/pulumi"
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {buildUrn, UrnDomains} from "../../utils/buildUrn";

import * as squirrelly from "squirrelly";
import {Outputable} from "../../types/outputable";
import {
    ProxmoxDatastore,
    ProxmoxDatastoreRoot,
    ProxmoxRemoteCommandConnection,
    ProxmoxServer,
    ProxmoxTargetNode
} from "../Provider";
import {buildRandomName} from "../../utils/buildRandomName";

export interface CloudConfigArgs {
    commands?: Outputable<string>[]
    extraPackages?: Outputable<string>[]
    hostname: Outputable<string>
    sshKeys: Outputable<string>[]
    defaultUser: Outputable<string>
    trustedCertificateAuthority?: Outputable<string>
}

export class CloudConfig extends pulumi.ComponentResource {
    readonly filepath: string
    readonly filename: string
    readonly fileId: string
    readonly user: Outputable<string>

    constructor(name: string, args: CloudConfigArgs, opts?: pulumi.ComponentResourceOptions) {
        super(buildUrn(UrnDomains.Proxmox, "CloudConfig"), name, {}, opts);

        squirrelly.defaultConfig.autoTrim = false

        const compiledTemplate = pulumi.output(args).apply(a =>
            squirrelly.renderFile(
                `${__dirname}/templates/cloud_config_template.squirrelly`,
                a
            )
        )

        this.filename = buildRandomName()
        this.filepath = `${ProxmoxDatastoreRoot}/snippets/${this.filename}`
        this.fileId = `${ProxmoxDatastore}:snippets/${this.filename}`
        this.user = args.defaultUser

        const test = new command.remote.Command(`${name} test command`, {
            connection: ProxmoxRemoteCommandConnection,
            create: compiledTemplate.apply(content => `echo >${this.filepath} "${content}"`),
            update: compiledTemplate.apply(content => `echo >${this.filepath} "${content}"`)
        }, { parent: this })

        this.registerOutputs([
            this.filepath,
            this.filename,
            this.fileId
        ])
    }
}
