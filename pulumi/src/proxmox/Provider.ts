import * as pulumi from "@pulumi/pulumi"
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import * as command from "@pulumi/command";

const config = new pulumi.Config()

export const ProxmoxTargetNode = config.require("proxmoxNode")
export const ProxmoxDatastore = config.require("proxmoxDatastore")
export const ProxmoxDatastoreRoot = config.require("proxmoxDatastoreRoot")
export const ProxmoxEndpoint = config.require("proxmoxVeEndpoint")
export const ProxmoxUser = config.requireSecret("proxmoxUsername")
export const ProxmoxPassword = config.requireSecret("proxmoxPassword")
export const ProxmoxPublicKey = config.get("proxmoxPublicKey")
export const ProxmoxServer = new proxmox.Provider('Homelab Proxmox Provider', {
    virtualEnvironment: {
        endpoint: ProxmoxEndpoint,
        insecure: config.requireBoolean('proxmoxVeInsecure'),
        username: ProxmoxUser,
        password: ProxmoxPassword
    }
})

/**
 * Credentials for executing remote commands against Proxmox Host
 */
export const ProxmoxRemoteCommandConnection: command.remote.CommandArgs["connection"] = {
    host: new URL(ProxmoxEndpoint).host,
    port: 22,
    user: ProxmoxUser.apply(u => u.split("@")[0]),
    password: ProxmoxPassword
};


// Assert that the expected data store exists
export const DatastoreAvailable: pulumi.Output<boolean> = pulumi.all([
    proxmox.storage.getDatastoresOutput({nodeName: ProxmoxTargetNode}, {provider: ProxmoxServer}),
    ProxmoxDatastore
]).apply(([datastores, targetDatastoreId]) => {
    const targetDatastoreIdx = datastores.datastoreIds.indexOf(targetDatastoreId)
    if (targetDatastoreIdx < 0) {
        throw new Error(`Expected ${targetDatastoreId} to exist on ${datastores.nodeName}`)
    }
    if (!datastores.contentTypes[targetDatastoreIdx].includes("snippets")) {
        throw new Error(`Expected ${targetDatastoreId} to have "snippets" content type`)
    }
    return true
})


