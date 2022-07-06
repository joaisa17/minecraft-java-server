import { ServerProperties } from './properties';

interface IEventPatterns {
    start: RegExp;
    stop: RegExp;
    crash: RegExp;
}

export interface RconConfig {
    host: string;
    port: number;
    password: string;
    buffer: number;
}

export interface ServerConfig {
    jar: string;
    type: string;

    path: string;
    executable: string;
    args: string[];
    
    eula: boolean;

    properties: ServerProperties;

    pipeStdout: boolean;
    pipeStdin: boolean;

    eventPatterns: IEventPatterns;

    port: number;
    rcon: RconConfig;
}

export const EventPatterns: Record<string, IEventPatterns> = {
    vanilla: {
        start: /^\[.+?\]: Done/,
        stop: /^\[.+?\]: ThreadedAnvilChunkStorage: All dimensions are saved/,
        crash: /Crashed/
    },

    paper: {
        start: /^\[.+?\]: Done/,
        stop: /^\[.+?\]: ThreadedAnvilChunkStorage: All dimensions are saved/,
        crash: /Paper Crashed/
    }
}

export function LoadDefaults<T>(config: Partial<T>, defaults: T) {
    const loadObject = <OT>(obj: Partial<OT>, defaultObj: OT) => {
        Object.keys(defaultObj).forEach(key => {
            if (typeof obj[key] !== typeof defaultObj[key]) {
                obj[key] = defaultObj[key];
                return;
            }
            
            if (typeof obj[key] === 'object') loadObject(obj[key], defaultObj[key]);
        });

        return obj;
    }

    return loadObject<T>(config, defaults) as T;
}