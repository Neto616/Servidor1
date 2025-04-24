import { Hono, Context } from 'hono'
import { prettyJSON } from "https://deno.land/x/hono@v4.3.11/middleware/pretty-json/index.ts";
import {default as vistas} from './routes.views.ts';

const app = new Hono()
// app.use(prettyJSON())
app.route('/', vistas)
app.get('/*', (c: Context): Response => c.json({ etatus: 0, data: { info: "La ruta no existe" }}))

Deno.serve({port: 3001}, app.fetch)
