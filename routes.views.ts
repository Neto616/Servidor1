import { Hono, Next } from 'https://deno.land/x/hono@v4.1.6/mod.ts';
import { vistas, graficas, umbral } from "./ctrl.vista.ts";
import { Context } from "node:vm";
import BD from "./bd.ts";
import { configuracion_repsonse } from "./tipos.ts";

const route:Hono = new Hono();
const consultas: BD = new BD();
await consultas.initDB()

async function umbralMdw (c:Context, next: Next) {
    try {
         const resultado: configuracion_repsonse = await consultas.getUmbralEstatus();
         if(!(resultado[0]?.fueraUmbra ?? 0)) return c.json({ estatus: -1, info: {message: "No esta en el umbral de peligro"}});

         return await next()

    } catch (error) {
        console.error("Ha ocurrido un error: ", error);

    }
}

route.get("/", vistas.inicio);
route.get("/reporte_fugas", vistas.fugas);
route.get("/estatus_filter", vistas.estatus_filter);
route.get("/mostrar_datos", graficas.mostrar_datos);
route.get("/mostrar_datos_envivo", graficas.mostrar_datos_envivo);
route.get("/zona_peligro", graficas.zona_peligro);
route.get("/umbral", umbral.obtener);

route.post("/guardar_datos", graficas.guardar_datos);

export default route;