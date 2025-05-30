import { Context } from 'https://deno.land/x/hono@v4.1.6/mod.ts';

export type ctrl_vistas = {
    inicio: (c: Context) => Promise<any>,
    fugas: (c: Context) => Promise<Response>,
    estatus_filter: (c:Context) => Promise<Response>
};

export type sensor_response = Array<{id: number, tiempo_inicial: Date, tiempo_final: Date}> | [];
export type configuracion_repsonse = Array<{ppm_limite_inicial: number, ppm_limite_final: number, gas: string, estatus: number, fueraUmbra: number}> | [];

export type data_real_time = { ppm: number, time: Date }

export type filtros = {
    ultimo_dia: boolean, //Ultimo dia
    ultima_semana: boolean, //Ultima semana
    tres_meses: boolean,
    seis_meses: boolean,
    ultimo_anio: boolean,
}

export type data = {
    filtro: string,
    promedio: number
}
