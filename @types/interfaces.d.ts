// EMOTES
interface Emote {
    id: string;
    name: string;
    isZeroWidth: boolean;
}

interface SevenTvEmote {
    data: {
        id: string;
        name: string;
    };
    flags: number;
}

interface SevenTvEmoteWS {
    value: {
        id: string;
        name: string;
        flags: number;
    },
    old_value?: {
        id: string;
    }
}

interface SevenTvChannelEmoteSet {
    data: {
        emote_set: {
            id: string;
            emotes: SevenTvEmote[];
        }
    }
}


interface SevenTvGlobalEmoteSet {
    data: {
        id: string;
        emotes: SevenTvEmote[];
    }
}

// PRONOUNS
interface Pronoun {
    display: string;
    name: string;
}

// QUEUE
interface QueueItem {
    target: string;
    message: any;
}