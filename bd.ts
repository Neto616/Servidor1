import mysql, { RowDataPacket } from "npm:mysql2@^2.3.3/promise"
import { sensor_response, data_real_time } from './tipos.ts';
import Connection, { FieldPacket } from "npm:mysql2@^2.3.3";


const connectDB = async (): Promise<any> => {
    const pool = await mysql.createPool({
      host: Deno.env.get("HOST"),
      user: Deno.env.get("USER"),
      port: parseInt(Deno.env.get("PORT")?.toString() || "3306"),
      password: Deno.env.get("PASS"),
      database: Deno.env.get("DB"),
      waitForConnections: true,
      connectionLimit: 10
    });
  
    console.log("✅ Conexión exitosa a MySQL");
    return pool;
};

class BD {
  private bd!:  mysql.Pool;

  constructor() {}

  public async initDB(): Promise<void>{
    try {
      this.bd = await connectDB();
      return
    } catch (error) {
      console.log("Error al conectar con la BD: ", error)
      return
    }
  }

  public async getFugas(): Promise<sensor_response> {
    try {
      const dataTable= await this.bd.query(
        `SELECT 
          id as id, 
          tiempo_inicial as tiempo_inicial,
          tiempo_final as tiempo_final 
        FROM fuga_gas`)
      return dataTable[0] as sensor_response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async getReporteDiaAnterior(): Promise<any> {
    try {
      const dataTable = await this.bd.query(
        `SELECT
          HOUR(df.tiempo) as label,
          AVG(df.ppm) as ppm_total
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
          fg.tiempo_inicial >= DATE(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
            AND fg.tiempo_inicial < DATE(CURDATE())
            OR fg.tiempo_final > DATE(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
            AND fg.tiempo_final <= DATE(CURDATE())
            OR fg.tiempo_inicial <= DATE(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
            AND fg.tiempo_final >= DATE(CURDATE())
        group by HOUR(df.tiempo)
        ORDER BY label;
        `
      )

      return dataTable[0]
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getReporteSemanaAnterior(): Promise<any>{
    try {
      const dataTable = await this.bd.query(
        `
        SELECT
          day(df.tiempo) as label,
          AVG(df.ppm) as ppm_total,
          count(*) as total
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
          (fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
          AND fg.tiempo_inicial < DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
          OR (fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
          AND fg.tiempo_final <= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
          OR (fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
          AND fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
        group by day(df.tiempo)
        ORDER BY label
        `
      )
      return dataTable[0]
    } catch (error) {
      console.log(error);
      return []
    }
  }
  
  private async getReporteTresMeses(): Promise<any> {
    try {
      const dataTable = await this.bd.query(
        `
        SELECT
          MONTH(df.tiempo) as label,
          AVG(df.ppm) as ppm_total
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
          fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            AND fg.tiempo_inicial < CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            AND fg.tiempo_final <= CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            AND fg.tiempo_final >= CURDATE() + INTERVAL 1 DAY
        group by month(df.tiempo)
        order by label
        `
      )

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getReporteSeisMeses(): Promise<any> {
    try {
      const dataTable = await this.bd.query(
        `
        SELECT
          MONTH(df.tiempo) as label,
          AVG(df.ppm) as ppm_total
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
          fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND fg.tiempo_inicial < CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND fg.tiempo_final <= CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND fg.tiempo_final >= CURDATE() + INTERVAL 1 DAY
        group by month(df.tiempo)
        order by label
        `
      )

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getReporteAnioAnterior(): Promise<any> {
    try {
      const dataTable = await this.bd.query(
        `
        SELECT
          MONTH(df.tiempo) as label,
            year(df.tiempo) as anio,
            AVG(df.ppm) as ppm_total
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
          fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            AND fg.tiempo_inicial < CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            AND fg.tiempo_final <= CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            AND fg.tiempo_final >= CURDATE() + INTERVAL 1 DAY
        group by month(df.tiempo), year(df.tiempo)
        order by mes, label asc
        `
      )

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async getDatoEnvivo() {
    try {
      const [rows] = await this.bd.query(
        `
        SELECT 
          COALESCE(ppm, 0) AS ppm, 
          tiempo
        FROM detalles_fuga
        WHERE tiempo >= NOW() - INTERVAL 1 SECOND
        ORDER BY id_fuga DESC
        LIMIT 1;
        `) as unknown as  data_real_time[];

        return rows[0]?.ppm ?? 0;
    } catch (error) {
      console.log(error);
      return 0
    }
  }

  public async getReporteFugas(filter?: string) {
    console.log(filter)
    if(filter === "ultimo_dia") return await this.getReporteDiaAnterior();
    if(filter === "tres_meses") return await this.getReporteTresMeses();
    if(filter === "seis_meses") return await this.getReporteSeisMeses();
    if(filter === "ultimo_anio") return await this.getReporteAnioAnterior()
    else return await this.getReporteSemanaAnterior();
  }

  public async getReporteFugasDeskApp(filter?:string){
    try {
      const [rows] = await this.bd.query(
        `SELECT
          df.tiempo as tiempo,
          df.ppm as ppm
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
        ${filter == "ultimo_dia" ? `fg.tiempo_inicial >= DATE(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
          AND fg.tiempo_inicial < DATE(CURDATE())
          OR fg.tiempo_final > DATE(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
          AND fg.tiempo_final <= DATE(CURDATE())
          OR fg.tiempo_inicial <= DATE(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
          AND fg.tiempo_final >= DATE(CURDATE())`
          : filter =="tres_meses" ? `fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          AND fg.tiempo_inicial < CURDATE() + INTERVAL 1 DAY
          OR fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          AND fg.tiempo_final <= CURDATE() + INTERVAL 1 DAY
          OR fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          AND fg.tiempo_final >= CURDATE() + INTERVAL 1 DAY`
          : filter === "seis_meses" ? `fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            AND fg.tiempo_inicial < CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            AND fg.tiempo_final <= CURDATE() + INTERVAL 1 DAY
            OR fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            AND fg.tiempo_final >= CURDATE() + INTERVAL 1 DAY
        group by month(df.tiempo), year(df.tiempo)`
          : filter === "ultimo_anio" ? `` 
          : `(fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
          AND fg.tiempo_inicial < DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
          OR (fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
          AND fg.tiempo_final <= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
          OR (fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
          AND fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))`}
          `
      )

      return rows;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  
}

export default BD;