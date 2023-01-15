import * as pulumi from "@pulumi/pulumi"


type Outputable<T> = (T | pulumi.Output<T>)

