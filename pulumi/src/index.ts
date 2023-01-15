import * as pulumi from "@pulumi/pulumi"
import * as command from "@pulumi/command"
import * as docker from "@pulumi/docker"
import "./proxmox/Provider"
import {CloudImageTemplate} from "./proxmox/cloud/CloudImageTemplate";
import {ProxmoxPublicKey} from "./proxmox/Provider";
import {CloudNode} from "./proxmox//cloud/CloudNode";
import {CloudConfig} from "./proxmox/cloud/CloudConfig";
import {StackSSHCredentials} from "./utils/StackSSHCredentials";

const pubKeys = [StackSSHCredentials.pubKey, ProxmoxPublicKey].filter(Boolean) as pulumi.Output<string>[]

const cloudImage = new CloudImageTemplate("Debian Cloud Template", {
    publicKeys: pubKeys
})

const cloudConfig = new CloudConfig("Test Cloud Config", {
    hostname: "Computer One",
    sshKeys: pubKeys,
    defaultUser: "root",
})

const virtualMachine = new CloudNode("Manager 1", {
    cloudConfig: {
        commands: [
            "wget -qO- https://get.docker.com/ | sh",
        ]
    },
    cloudImageTemplate: cloudImage,
    hostname: "test-machine",
    publicKeys: pubKeys,
    vmId: cloudImage.templateVm.vmId.apply(x => x! + 1)
}, {})

virtualMachine.virtualMachine.ipv4Addresses.apply(v => console.log(v[1][0]))

const dockerManagerCreation = new command.remote.Command("Initialize docker swarm", {
    connection: virtualMachine.connectionParams,
    create: "docker swarm init",
    delete: "docker swarm leave"
}, {})

const dockerWorkerToken = new command.remote.Command("Docker Worker Token", {
    connection: virtualMachine.connectionParams,
    create: "docker swarm join-token worker --quiet",
}, { dependsOn: [dockerManagerCreation]}).stdout
const dockerManagerToken = new command.remote.Command("Docker Manager Token", {
    connection: virtualMachine.connectionParams,
    create: "docker swarm join-token manager --quiet",
}, { dependsOn: [dockerManagerCreation]}).stdout

const swarmTokens = pulumi.all([dockerWorkerToken, dockerManagerToken]).apply(([worker, manager]) => ({worker, manager}))
swarmTokens.apply(console.log)
