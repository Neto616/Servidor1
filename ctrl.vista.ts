import { ctrl_vistas, sensor_response, filtros, data } from './tipos.ts';
import { Context } from 'https://deno.land/x/hono@v4.1.6/mod.ts';
import BD from './bd.ts';
import "https://deno.land/std@0.187.0/dotenv/load.ts";
import { fromFileUrl, join } from "https://deno.land/std@0.187.0/path/mod.ts";
import { exists } from 'https://deno.land/std/fs/mod.ts';

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
    inicio: async (c: Context) => {
        const indexPath = join('./build', 'index.html');
        if (await exists(indexPath)) {
            console.log("Si existe el html")
            const indexContent = await Deno.readTextFile(indexPath);
            console.log(indexContent)
            return c.html(indexContent);
        }
        return c.notFound();

    },
    fugas: async(c: Context): Promise<Response> => {
        try {
            await consultas.initDB()
            const fugas: sensor_response = await consultas.getFugas();
            console.log(fugas)
            return c.json({ estatus: 1, result: {data: fugas} });
        } catch (error) {
            return c.json({ estatus: 0, result: { info: "Ocurrio un error: "+error}});
        }
    },
    estatus_filter: async (c:Context) => {
        try {
            await consultas.initDB();
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
    },
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
            const { filtro } = c.req.header();
            console.log("Filtro del header", filtro)
            await consultas.initDB();
            const result = await consultas.getReporteFugas(filtro);

            console.log(result)

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
    },
    mostrar_datos_envivo: async (c: Context) => {
        try {
            await consultas.initDB()

            const ppm = await consultas.getDatoEnvivo();

            return c.json({
                estatus: 1,
                info: {
                    message: "Datos en vivo",
                    data: {
                        ppm: ppm
                    }
                }
            })
        } catch (error) {
            console.log(error);
            return c.json({
                estatus: 0,
                info: {
                    message: "Ha ocurrido un error"
                }
            })
        }
    }
}

export {
    vistas,
    graficas
};