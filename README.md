# Minecraft Java Server
This library helps you run and manage your
Minecraft Java Edition server through a node.js environment.
It supports type declarations with Typescript, meaning you don't need to install any @types library.

It is heavily inspired by [@scriptserver/core](https://npmjs.com/package/@scriptserver/core). I created it after discovering a missing feature in the library, and decided to make my own, both to learn, and to be able to continue what I was working on.

The library utilizes Minecraft's rcon feature. It allows you to securely send commands through networking, and receive the output text through the response.

## Usage
### Installation
Run the following command in your project's root directory:
```bat
npm install minecraft-java-server --save
```
### Basic Usage
```js
import { MinecraftServer } from 'minecraft-java-server';

const server = new MinecraftServer({
    jar: 'server.jar',
    path: 'C:/path/to/your/minecraft/server/directory',

    args: ['-Xms4G', '-Xmx4G'],

    // Minecraft's eula must be agreed to using this value
    eula: true,

    // every property is the equivalent of server.properties, except for vital ones
    properties: {
        motd: "Minecraft server hosted with minecraft-java-server",
        "max-players": 10
    }
});

// Start event
server.on('start', () => {
    console.log('Server started');
});

// Stop event
server.on('stop', () => {
    console.log('Server stopped');
});

// Start the server
server.start();

server.send('ban herobrine').then(response => {
    console.log('Command result: ', response);
}).catch(err => console.log('Failed to run command', err));
```
Since server.send returns a promise, this also works in an asynchronous context using await.
The promise is rejected if the server disconnects after queueing the command.