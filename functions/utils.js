import { createHash } from "crypto";


export const getUserColor = (displayName) => {
    return `#${(createHash('md5').update(displayName).digest('hex').slice(26))}`
}