import { ctrl_vistas, sensor_response, filtros, data, configuracion_repsonse } from './tipos.ts';
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

let list_dipositivos: Record<string, any>= {}

const consultas: BD = new BD();
await consultas.initDB()

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
            
            const fugas: sensor_response = await consultas.getFugas();
            console.log(fugas)
            return c.json({ estatus: 1, result: {data: fugas} });
        } catch (error) {
            return c.json({ estatus: 0, result: { info: "Ocurrio un error: "+error}});
        }
    },
    estatus_filter: async (c:Context) => {
        try {
            ;
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
            console.log(filter_flags)
            const fugas = await consultas.getReporteFugasDeskApp();

            c.status(200);
            return c.json({ estatus: 1, result: { 
                info: "Todo bien en el servidor", 
                filtro: filtro ?? "ultima_semana",
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
            const gases: Record<number, string> = {
                1: "Metano",
                2: "Propano",
                3: "Amoníaco",
                4: "Sulfuro de Hidrógeno",
                5: "Monóxido de Carbono",
            }

            const { filtro } = c.req.header();
            const { gas } = c.req.query();
            const idGas = parseInt(gas || "5");
            console.log("Filtro del header", filtro);
            const result = await consultas.getReporteFugas(filtro, (gases[idGas] || "Monóxido de Carbono"));

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
    },
    zona_peligro: async (c: Context) => {
        try {
            const ppm = await consultas.getDatoEnvivo();
            const data = await consultas.getUmbralEstatus();

            return c.json({
                estatus: 1,
                info: {
                    message: "Datos en vivo",
                    data: {
                        ppm: ppm,
                        limite: data[0]?.ppm_limite_final
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

const umbral = {
    obtener: async (c: Context) => {
        try {
            const result: configuracion_repsonse = await consultas.getUmbralEstatus();

             return c.json({
                estatus: 1,
                info: {
                    message: "Obtener la inforamción sobre el umbral",
                    umbral: result[0]?.fueraUmbra ?? 0
                }
            });
        } catch (error) {
            console.log("[Obtener Umbral] Ha ocurrido un error: ", error);
            return c.json({ estatus: 0, info: {
                message: "Ha ocurrido un error"
            }});
        }
    }
}

const telegram = {
    dispositivos: async (c:Context) => {
        try {
            const body_request = await c.req.json();

            if(!Object.keys(body_request).length) return c.json({ estatus: 0, info: {message: "Favor de llenar los datos necesarios", data: {response: ""}}});
            const nombreDispositivo: string = body_request.dispositivo as string;
            list_dipositivos[nombreDispositivo] = body_request.estatus;

            return c.json({ estatus: 1, info: {
                message: "Ha cambiado el estado de un dispositivo",
                data: {
                    response: `${nombreDispositivo} ha cambiado su estatus actualmente se encuentra: ${body_request.estatus}`
                }
            }})

        } catch (error) {
            console.log(error);
            return c.json({ estatus: 0, info: {
                message: "Ha ocurrido un error",
                data: {
                    response: error
                }
            }});
        }
    },
    ultimas_fugas: async (c:Context) => {
        try {
            const resultado = await consultas.getFugasRecientes(3);
            
            return c.json({ estatus: 1, info: {
                message: "Datos de las ultimas tres fugas",
                data: {
                    response: resultado || []
                }
            }});
        } catch (error) {
            console.log(error);
            return c.json({ estatus: 0, info: {
                message: "Ha ocurrido un error al intentar obtener los ultimos registros de las fugas",
                data: {
                    response: []
                }
            }});
1        }
    }
}

export {
    vistas,
    graficas,
    umbral,
    telegram
};