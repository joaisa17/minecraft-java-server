import fs from 'node:fs';
import { join } from 'node:path';

import { ServerConfig } from './config';

export interface ServerProperties {
    ['enable-jmx-monitoring']?: boolean;
    ['level-seed']?: string;
    ['gamemode']?: string;
    ['enable-command-block']?: boolean;
    ['enable-query']?: boolean;
    ['generator-settings']?: string;
    ['level-name']?: string;
    ['motd']?: string;
    ['query.port']?: number;
    ['pvp']?: boolean;
    ['generate-structures']?: boolean;
    ['max-chained-neighbor-updates']?: number;
    ['difficulty']?: string;
    ['network-compression-threshold']?: number;
    ['require-resource-pack']?: boolean;
    ['max-tick-time']?: number;
    ['use-native-transport']?: boolean;
    ['max-players']?: number;
    ['online-mode']?: boolean;
    ['enable-status']?: boolean;
    ['allow-flight']?: boolean;
    ['broadcast-rcon-to-ops']?: boolean;
    ['view-distance']?: number;
    ['server-ip']?: string;
    ['resource-pack-prompt']?: boolean;
    ['allow-nether']?: boolean;
    ['sync-chunk-writes']?: boolean;
    ['op-permission-level']?: number;
    ['prevent-proxy-connections']?: boolean;
    ['hide-online-players']?: boolean;
    ['resource-pack']?: string;
    ['entity-broadcast-range-percentage']?: number;
    ['simulation-distance']?: boolean;
    ['player-idle-timeout']?: number;
    ['force-gamemode']?: boolean;
    ['rate-limit']?: number;
    ['hardcore']?: boolean;
    ['white-list']?: boolean;
    ['broadcast-console-to-ops']?: boolean;
    ['spawn-npcs']?: boolean;
    ['spawn-animals']?: boolean;
    ['function-permission-level']?: number;
    ['level-type']?: string;
    ['text-filtering-config']?: string;
    ['spawn-monsters']?: boolean;
    ['enforce-whitelist']?: boolean;
    ['resource-pack-sha1']?: string;
    ['spawn-protection']?: number;
    ['max-world-size']?: number;
}

interface CoreProperties {
    port: number;
    rcon: number,
    password: string;
    enableRcon: boolean;
}

enum CoreKey {
    port = 'server-port',
    rcon = 'rcon.port',
    password = 'rcon.password',
    enableRcon = 'enable-rcon'
};

export default function loadProperties(config: ServerConfig) {
    const filePath = join(config.path, 'server.properties');

    const serverProperties: Partial<Record<CoreKey|keyof ServerProperties, any>> = {};

    const coreProperties: CoreProperties = {
        port: config.port,
        rcon: config.rcon.port,
        password: config.rcon.password,
        enableRcon: true
    };

    Object.keys(config.properties).forEach(key => {
        serverProperties[key] = config.properties[key];
    });
    
    Object.keys(coreProperties).forEach(key => {
        serverProperties[CoreKey[key]] = coreProperties[key];
    });
    
    fs.writeFileSync(filePath,
        Object.keys(serverProperties)
        .map(key => `${key}=${serverProperties[key]}`)
        .join('\n'),

        {
            flag: 'w',
            encoding: 'utf-8'
        }
    );
}