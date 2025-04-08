import { Context } from 'hono';

export type ctrl_vistas = {
    inicio: (c: Context) => Response,
    fugas: (c: Context) => Promise<Response>
};

export type sensor_response = Array<{id: number, dato:number, segundo: number}> | void