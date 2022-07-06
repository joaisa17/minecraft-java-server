import eventEmitter from './emitter';
import Net, { Socket} from 'net';

import { RconConfig, LoadDefaults } from './config';
import { DefaultConfig } from './server';

export enum RequestType {
    Auth = 0x03,
    Exec = 0x02
}

export enum RequestId {
    Auth = 0x123,
    Exec = 0x321
}

export enum ResponseType {
    Auth = 0x02,
    Exec = 0x00
}

type ConnectionError = Error & { code: string };

interface Events {
    connect: void;
    disconnect: void;
    error: string;
    warn: string;
}

export function encode(type: RequestType, id: RequestId, body: string) {
    const size = Buffer.byteLength(body) + 14;
    const buffer = Buffer.alloc(size);

    buffer.writeInt32LE(size - 4, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(type, 8);
    buffer.write(body, 12, size - 2);
    buffer.writeInt16LE(0, size - 2);

    return buffer;
}

export function decode(chunk: Uint8Array) {
    const buffer = Buffer.from(chunk);

    return {
        size: buffer.readInt32LE(0),
        id: buffer.readInt32LE(4),
        type: buffer.readInt32LE(8),
        body: buffer.toString('utf8', 12, buffer.length - 1)
    }
}

type RconPromise = [(value: string) => void, (error: string) => void];

export class Rcon {
    public config: RconConfig;

    private socket?: Socket;
    private authenticated: boolean = false;

    private queue: [string, ...RconPromise][] = [];
    private promises: { [execId: number]: RconPromise } = {};
    private execId: number = RequestId.Exec;

    private tickInterval?: NodeJS.Timer;
    
    private emitter = eventEmitter<Events>();
    public on = this.emitter.on;
    public off = this.emitter.off;
    
    private nextExecId() {
        return (this.execId += 1);
    }
    
    private listen() {
        this.socket?.on('data', chunk => {
            const packet = decode(chunk);
            
            switch(packet.type) {
                case ResponseType.Auth:
                    this.authenticated = true;
                    this.emitter.emit('connect');
                    break;
                    
                case ResponseType.Exec:
                    this.promises[packet.id]?.[0](packet.body);
                    break;
                    
                default:
                    console.warn('Unknown packet type\n', packet);
                    break;
            }
        });
    }
                
    private tick() {
        if (this.socket && this.authenticated && this.queue.length) {
            const [msg, resolve, reject] = this.queue.shift();

            const execId = this.nextExecId();
            this.promises[execId] = [resolve, reject];
            
            this.socket.write(encode(RequestType.Exec, execId, msg));
        }
    }
    
    public send(msg: string) {
        return new Promise<string>((res, rej) => {
            this.queue.push([msg, res, rej]);
        });
    }

    public connect(maxAttempts: number = 10, attempts: number = 0) {
        if (this.authenticated) throw new Error('Already connected');
        this.socket?.destroy();

        attempts += 1;

        this.socket = Net.connect({
            host: this.config.host,
            port: this.config.port
        }, () => {
            this.listen();
            this.socket?.write(
                encode(RequestType.Auth, RequestId.Auth, this.config.password)
            );
        });

        this.socket.on('error', (err: ConnectionError) => {
            if (maxAttempts && err.code === 'ECONNREFUSED') {
                if (attempts > maxAttempts) return this.emitter.emit('error', `Failed to connect ${maxAttempts} times`);

                this.emitter.emit('warn', 'Failed to connect. Retrying...');
                return setTimeout(() => this.connect(maxAttempts, attempts));
            }

            this.emitter.emit('error', `Failed to connect: ${err.message}`);
        });

        this.tickInterval && clearInterval(this.tickInterval);
        this.tickInterval = setInterval(() => this.tick(), this.config.buffer);
    }

    public disconnect() {
        this.socket?.destroy();
        this.socket = undefined;

        this.authenticated = false;

        this.queue = [];
        this.promises = {};

        this.tickInterval && clearInterval(this.tickInterval);

        Object.keys(this.promises).forEach(execId => {
            this.promises[execId][1]('Disconnected');
        });

        this.queue.forEach(promise => promise[2]('Disconnected'));

        this.emitter.emit('disconnect');
    }

    constructor(config: RconConfig) {
        this.config = LoadDefaults<RconConfig>(config, DefaultConfig.rcon);
    }
}