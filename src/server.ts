import { spawn, ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';

import { Rcon } from './rcon';
import eventEmitter from './emitter';

import { EventPatterns, ServerConfig, LoadDefaults } from './config';

import loadProperties from './properties';
import loadEula from './eula';

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

    eula: string;
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

        loadEula(this.config);
        loadProperties(this.config);

        this.on('start', () => { this.rcon?.connect(); });

        this.on('stop', () => {
            this.rcon?.disconnect();
            this.process?.kill('SIGKILL');
        });

        this.on('crash', () => {
            this.rcon?.disconnect();
            this.process?.kill('SIGKILL');
        });

        this.process = spawn(
            this.config.executable,
            [...this.config.args, '-jar', this.config.jar, 'nogui'],
            {
                cwd: this.config.path,
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
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

        process.on('exit', () => { this.stop(); });
        this.process.on('exit', () => { this.stop(); });
    }

    public stop() {
        this.send('stop')
        .catch(() => this.process?.kill());
    }

    public send(msg: string) {
        if (!this.process) throw new Error('Server not running');
        return this.rcon?.send(msg);
    }

    constructor(config: Partial<ServerConfig>) {
        config.eventPatterns ??= EventPatterns[config.type || 'vanilla'] || EventPatterns.vanilla;
        this.config = LoadDefaults<ServerConfig>(config, DefaultConfig);

        if (!existsSync(this.config.path)) throw new Error(`Path '${this.config.path}' does not exist`);
        if (!existsSync(`${this.config.path}/${this.config.jar}`)) throw new Error(`Jarfile '${this.config.jar}' does not exist`);

        this.rcon = new Rcon(this.config.rcon);
        
        const eventPatterns = this.config.eventPatterns;

        this.emitter.on('console', msg => {
            Object.keys(eventPatterns).forEach((key: keyof Events) => {
                if (msg.match(eventPatterns[key])) {
                    this.emitter.emit(key, msg);
                }
            });
        });
    }
}