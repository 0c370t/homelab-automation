import * as pulumi from "@pulumi/pulumi"
import {Command} from "@pulumi/command/local";

const config = new pulumi.Config()

export const CertificateAuthorityCrtUrl = config.getSecret<string>("certificateAuthorityCrtUrl")

export const CertificateAuthorityCrt =
    CertificateAuthorityCrtUrl ?
        new Command("Self Managed Certificate Authority crt", {
            create: CertificateAuthorityCrtUrl.apply(url => `wget -qO- ${url}`)
        }).stdout : undefined
