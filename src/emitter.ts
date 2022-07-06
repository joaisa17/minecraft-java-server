type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (param: T) => void;

interface Emitter<T extends EventMap> {
    on<K extends EventKey<T>>
        (name: K, callback: EventReceiver<T[K]>): void;
    
    off<K extends EventKey<T>>
        (name: K, callback: EventReceiver<T[K]>): void;

    emit<K extends EventKey<T>>
        (name: K, data?: T[K]): void;
}

export default function eventEmitter<T extends EventMap>(): Emitter<T> {
    const listeners: {
        [K in keyof EventMap]?: Array<(p: EventMap[K]) => void>;
    } = {};

    return {
        on(key, fn) {
            listeners[key] = (listeners[key] || []).concat(fn);
        },

        off(key, fn) {
            listeners[key] = (listeners[key] || []).filter(f => f !== fn);
        },

        emit(key, data) {
            (listeners[key] || []).forEach(function(fn) {
                fn(data);
            });
        }
    }
}