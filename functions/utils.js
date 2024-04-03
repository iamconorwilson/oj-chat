import { createHash } from "crypto";


export const getUserColor = (displayName) => {
    return `#${(createHash('md5').update(displayName).digest('hex').slice(26))}`
}

export const debug = {
    log: (message) => {
        // THIS WOULD BE GOOD TO FIX, BUT NOT ESSENTIAL
        // if (process.env.NODE_ENV === 'development') {
        //     console.log(message);
        // }
        // console.info(JSON.stringify(message));
        return;
    }
}