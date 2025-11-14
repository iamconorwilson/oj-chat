interface Pronoun {
    display: string;
    name: string;
}

export class PronounCache {
    private static instance: PronounCache;
    private pronounCache: Pronoun[] = [];
    private constructor() {
        this.initialize();
    }
    public static getInstance(): PronounCache {
        if (!PronounCache.instance) {
            PronounCache.instance = new PronounCache();
        }
        return PronounCache.instance;
    }
    private async initialize() {
        try {
            const response = await fetch('https://pronouns.alejo.io/api/pronouns');
            const data = await response.json();
            this.pronounCache = data;
        } catch (err) {
            console.error('Error fetching pronoun cache:', err);
        }
    }

    public getPronouns(): Pronoun[] {
        return this.pronounCache;
    }
}