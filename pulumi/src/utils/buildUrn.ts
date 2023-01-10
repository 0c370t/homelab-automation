export enum UrnDomains {
    Proxmox = "Proxmox",
    Utilities = "Utilities"
}

export function buildUrn(domain: UrnDomains, resource: string): string {
    if (resource.includes(":")) {
        throw new Error("Resource must not include reserved character ':'")
    }
    return `HomeLab:${domain}:${resource}`
}
