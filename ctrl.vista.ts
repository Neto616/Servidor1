import { ctrl_vistas } from './tipos.ts';
import { Context } from 'hono';
import BD from './bd.ts';
import { exists } from "https://deno.land/std@0.104.0/fs/exists.ts";
import { sensor_response } from './tipos.ts';
import "https://deno.land/std@0.187.0/dotenv/load.ts";

const consultas: BD = new BD();

const vistas: ctrl_vistas = {
    inicio: (c: Context): Response => {
        try {
            console.log("Bienvenido desde consola");
            return c.json({ estatus: 1, result: {info: "Bienvenido"}});
        } catch (error) {
            return c.json({ estatus: 0, result: { info: error }});
        }
    },
    fugas: async(c: Context): Promise<Response> => {
        try {
            const fugas: sensor_response = await consultas.getFugas();
            const existFolder: boolean = await exists("./archivo");

            if(!existFolder) Deno.mkdirSync("./archivo", {recursive: true})
            await Deno.writeTextFile("./archivo/usuarios.json", JSON.stringify(fugas));

            return c.json({ estatus: 1, result: {data: fugas} });
        } catch (error) {
            return c.json({ estatus: 0, result: { info: "Ocurrio un error: "+error}});
        }
    }
}

export default vistas;