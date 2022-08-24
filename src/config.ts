import { ServerProperties } from './properties';

interface IEventPatterns {
    start: RegExp;
    stop: RegExp;

    crash: RegExp;
    eula: RegExp;
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

        crash: /^\[.+? ERROR\]: (Exception stopping the server)|(Encountered an unexpected exception)/,

        eula: /^\[.+?\]: You need to agree to the EULA in order to run the server. Go to eula.txt for more info./
    },

    paper: {
        start: /^\[.+?\]: Done/,
        stop: /^\[.+?\]: ThreadedAnvilChunkStorage: All dimensions are saved/,

        crash: /^\[.+? ERROR\]: (Exception stopping the server)|(Encountered an unexpected exception)/,

        eula: /^\[.+?\]: You need to agree to the EULA in order to run the server. Go to eula.txt for more info./
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