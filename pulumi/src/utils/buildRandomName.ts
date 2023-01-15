import { uniqueNamesGenerator, Config, adjectives, animals } from "unique-names-generator";

const cfg: Config = {
    dictionaries: [adjectives, animals],
    length: 2,
    separator: '-',
    seed: "0c370t/Homelab-Automation",
    style: "lowerCase"
}

export const buildRandomName = () => uniqueNamesGenerator(cfg)
