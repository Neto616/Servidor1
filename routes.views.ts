import { Hono } from 'https://deno.land/x/hono@v4.1.6/mod.ts';
import { vistas, graficas, umbral } from "./ctrl.vista.ts";

const route:Hono = new Hono();

route.get("/", vistas.inicio);
route.get("/reporte_fugas", vistas.fugas);
route.get("/estatus_filter", vistas.estatus_filter);
route.get("/mostrar_datos", graficas.mostrar_datos);
route.get("/mostrar_datos_envivo", graficas.mostrar_datos_envivo);
route.get("/umbral", umbral.obtener);

route.post("/guardar_datos", graficas.guardar_datos);

export default route;