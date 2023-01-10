import * as pulumi from "@pulumi/pulumi"
import * as command from "@pulumi/command"
import * as tls from "@pulumi/tls"
import {buildUrn, UrnDomains} from "../utils/buildUrn";

export interface SSHKeyPairArgs {

}

export class SSHKeyPair extends pulumi.ComponentResource {

    private readonly key: tls.PrivateKey

    readonly privKey: pulumi.Output<string>
    readonly pubKey: pulumi.Output<string>
    constructor(name: string, args?: SSHKeyPairArgs, opts?: pulumi.ComponentResourceOptions) {
        super(buildUrn(UrnDomains.Utilities, 'SSHKeyPair'), name, {}, opts)

        this.key = new tls.PrivateKey(`${name} Private Key`, {
            algorithm: "ED25519"
        }, { parent: this })

        this.privKey = this.key.privateKeyOpenssh
        this.pubKey = this.key.publicKeyOpenssh
    }
}
