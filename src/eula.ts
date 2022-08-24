import fs from 'node:fs';
import { join } from 'path';
import { ServerConfig } from './config';

export default function loadEula(config: ServerConfig) {
    const filePath = join(config.path, 'eula.txt');

    fs.writeFileSync(filePath, `eula=${config.eula}`, {
        flag: 'w',
        encoding: 'utf-8'
    });
}