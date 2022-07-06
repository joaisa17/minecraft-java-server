import { spawn } from 'child_process';
import eventEmitter from './emitter';
import { ChildProcess } from 'node:child_process';
import { EventPatterns, ServerConfig, LoadDefaults } from './config';
import { Rcon } from './rcon';
import loadProperties from './properties';

export const DefaultConfig: ServerConfig = {
    jar: 'server.jar',
    type: 'vanilla',

    path: '.',
    executable: 'java',
    args: ['-Xms1G', '-Xmx1G'],

    eula: false,

    properties: {},

    pipeStdout: true,
    pipeStdin: true,

    eventPatterns: EventPatterns.vanilla,

    port: 25565,
    rcon: {
        host: 'localhost',
        port: 25575,
        password: 'password',
        buffer: 200
    }
};

interface Events {
    console: string;
    start: void;
    stop: void;
    crash: void;
}

export class MinecraftServer {
    public config: ServerConfig;
    private process?: ChildProcess;
    public rcon: Rcon;

    private emitter = eventEmitter<Events>();
    public on = this.emitter.on;
    public off = this.emitter.off;

    public start() {
        if (this.process) throw new Error('Server already running');
        loadProperties(this.config);

        this.on('start', () => { this.rcon?.connect() });
        this.on('stop', () => { this.rcon?.disconnect() });

        this.process = spawn(
            this.config.executable,
            [...this.config.args, '-jar', this.config.jar, 'nogui'],
            {
                cwd: this.config.path,
                stdio: ['pipe', 'pipe', 'pipe']
            }
        );

        if (this.config.pipeStdout) {
            this.process.stdout?.pipe(process.stdout);
            this.process.stderr?.pipe(process.stdout);
        }

        if (this.config.pipeStdin) process.stdin.pipe(this.process.stdin);

        this.process.stdout?.on('data', (chunk: Buffer) => {
            chunk
                .toString()
                .trim()
                .split(/\n/)
                .forEach(msg => this.emitter.emit('console', msg));
        });

        process.on('exit', () => { this.stop() });
        this.process.on('exit', () => { this.stop() });
    }

    public stop() {
        this.process?.kill();
        this.process = undefined;
    }

    public send(msg: string) {
        if (!this.process) throw new Error('Server not running');
        return this.rcon?.send(msg);
    }

    constructor(config: Partial<ServerConfig>) {
        config.eventPatterns ??= EventPatterns[config.type || 'vanilla'] || EventPatterns.vanilla;
        this.config = LoadDefaults<ServerConfig>(config, DefaultConfig);

        this.rcon = new Rcon(this.config.rcon);
        
        const eventPatterns = this.config.eventPatterns;
        this.emitter.on('console', msg => {
            Object.keys(eventPatterns).forEach((key: keyof Events) => {
                if (msg.match(eventPatterns[key])) {
                    this.emitter.emit(key, msg);
                }
            });
        });

        console.log(this.config);
    }
}