import { Hono, Context } from 'https://deno.land/x/hono@v4.1.6/mod.ts';
import { cors } from "https://deno.land/x/hono@v4.1.6/middleware.ts"
import {default as vistas} from './routes.views.ts';
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { serveStatic } from "https://deno.land/x/hono@v4.1.6/middleware.ts";

const app = new Hono()
app.use(cors())
app.use("*", serveStatic({ root: "./build" }));
app.route('/', vistas)
app.get('/*', (c: Context): Response => c.json({ etatus: 0, data: { info: "La ruta no existe" }}))

Deno.serve({port: 3001}, app.fetch)
