import * as pulumi from "@pulumi/pulumi"
import "./proxmox/Provider"
import {SSHKeyPair} from "./services/SSHKeyPair";
import {CloudImageTemplate} from "./proxmox/cloud/CloudImageTemplate";
import {ProxmoxPublicKey} from "./proxmox/Provider";

// const test = new DebianAutoConfigure("test-auto-configuration", {
//     hostname: "Test-VM"
// })
const keys = new SSHKeyPair("Cloud VM SSH Keys")
const cloudImage = new CloudImageTemplate("Debian Cloud Template", {
    publicKeys: [keys.pubKey, ProxmoxPublicKey].filter(Boolean) as pulumi.Output<string>[]
})
