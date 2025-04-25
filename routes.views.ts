import { Hono } from 'hono'
import { vistas, graficas } from "./ctrl.vista.ts";

const route:Hono = new Hono();

route.get("/", vistas.inicio);
route.get("/reporte_fugas", vistas.fugas);
route.get("/estatus_filter", vistas.estatus_filter);
route.get("/mostrar_datos", graficas.mostrar_datos);
route.post("/guardar_datos", graficas.guardar_datos);

export default route;