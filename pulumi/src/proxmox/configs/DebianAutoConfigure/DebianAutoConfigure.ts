import * as pulumi from "@pulumi/pulumi"
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import * as random from "@pulumi/random"
import {readFileSync} from "fs"
import {ProxmoxDatastore, ProxmoxServer, ProxmoxTargetNode} from "../../Provider";
import * as handlebars from "handlebars";
//@ts-ignore
import crypt3 from "unix-crypt-td-js"

console.log(crypt3)

/**
 * Variables to be passed to handlebars when processing the preseed file
 */
export interface DebianAutoConfigureVariables {
    hostname: string;
    /**
     * Password for root account (as a crypt3 string)
     */
    rootPasswordCrypt3: string;
}

/**
 * Arguments to be passed to the pulumi class
 */
export interface DebianAutoConfigureArgs {
    hostname: string,
}

const PreseedTemplate = handlebars.compile(readFileSync(`${__dirname}/preseed.handlebars`).toString())

export class DebianAutoConfigure extends pulumi.ComponentResource {
    readonly file: proxmox.storage.File
    private readonly rootPassword: random.RandomPassword
    private readonly rootHash: random.RandomPassword

    constructor(name: string, args: DebianAutoConfigureArgs, opts?: pulumi.ComponentResourceOptions) {
        super("Homelab:Proxmox:DebianAutoConfiguration", name, {}, opts)
        this.rootPassword = new random.RandomPassword(`${name}-root-pw`, {
            length: 128
        }, {parent: this})

        this.rootHash = new random.RandomPassword(`${name}-root-hash`, {
            length: 128
        }, {parent: this})

        this.file = new proxmox.storage.File(`${name}-file`, {
            datastoreId: ProxmoxDatastore, nodeName: ProxmoxTargetNode, sourceRaw: {
                data: pulumi.all([this.rootPassword.result, this.rootHash.result]).apply(([pw, h]) => PreseedTemplate({
                    hostname: args.hostname,
                    rootPasswordCrypt3: crypt3(pw, h)
                })),
                fileName: `${name}.cfg`
            },
            contentType: "snippets"
        }, {
            provider: ProxmoxServer,
            parent: this
        })
    }
}
