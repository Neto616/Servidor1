import { ctrl_vistas, sensor_response } from './tipos.ts';
import { filter_flags } from "./variables.ts"
import { Context } from 'hono';
import BD from './bd.ts';
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
            console.log(fugas)
            return c.json({ estatus: 1, result: {data: fugas} });
        } catch (error) {
            return c.json({ estatus: 0, result: { info: "Ocurrio un error: "+error}});
        }
    },
    estatus_filter: async (c:Context) => {
        try {
            let filtro: string | undefined;
            const keys = Object.keys(filter_flags) as (keyof typeof filter_flags)[]
            for (const element of keys) {
                if(filter_flags[element]){
                    filtro = element;
                    break;
                }
            }
            const fugas = await consultas.getReporteFugas(filtro);
            
            // console.log(promedio)


            c.status(200);
            return c.json({ estatus: 1, result: { 
                info: "Todo bien en el servidor", 
                filtro,
                data: fugas || [] } })
        } catch (error) {
            c.status(400);
            return c.json({ estatus: 0, result: { info: "Ocurrio un error : "+error}});
        }
    }
}

const graficas = {
    guardar_datos: async (c:Context) => {
        try {
            const body = await c.req.json();
            console.log(body)
            return c.json({ 
                estatus: 1,
                result: {
                    info: "Se han guardado los datos de manera correcta"
                }
            });
        } catch (error) {
            console.log(error);
            return c.json({
                estatus: 0,
                result: {
                    info: "Ha ocurrido un error"
                }
            });
        }
    }
}

export {
    vistas,
    graficas
};