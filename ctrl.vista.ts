import { ctrl_vistas, sensor_response, filtros, data } from './tipos.ts';
import { Context } from 'hono';
import BD from './bd.ts';
import "https://deno.land/std@0.187.0/dotenv/load.ts";

let filter_flags: filtros = {
    ultimo_dia: false, //Ultimo dia
    ultima_semana: true, //Ultima semana
    tres_meses: false,
    seis_meses: false,
    ultimo_anio: false,
}

let datos: data = {
    filtro: "",
    promedio: 0
}

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
            const { filter } = await c.req.header();
            let filtro: string | undefined;
            const keys = Object.keys(filter_flags) as (keyof typeof filter_flags)[]
            for (const element of keys) {
                if(element == filter){
                    filtro = element;
                    filter_flags[element] = true;
                }
                filter_flags[element] = false;
            }

            const fugas = await consultas.getReporteFugas(filtro);

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
            const {filtro, promedio} = await c.req.json();

            datos={filtro, promedio}

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
    },
    mostrar_datos: async(c: Context) => {
        try {
            const dbObject = new BD();
            const result = await dbObject.getReporteFugas(datos.filtro);

            return c.json({ 
                estatus: 1, 
                info: {
                    message: "Datos para la grafica",
                    data: result || []
                }
            });
        } catch (error) {
            return c.json({ estatus: 0, info: { message: "Ha ocurrido un error: "+error }});
        }
    }
}

export {
    vistas,
    graficas
};