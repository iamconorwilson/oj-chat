import { createHash } from "crypto";


export const getUserColor = (displayName: string) => {
    return `#${(createHash('md5').update(displayName).digest('hex').slice(26))}`
}