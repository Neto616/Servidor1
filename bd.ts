import mysql, { RowDataPacket } from "npm:mysql2@^2.3.3/promise"
import { sensor_response, data_real_time, configuracion_repsonse } from './tipos.ts';
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

  public async getUmbralEstatus() {
    try {
      const dataTable= await this.bd.query(
        `SELECT 
          *
        from configuraciones`)
      return dataTable[0] as configuracion_repsonse;
    } catch (error) {
      console.log(error);
      throw error;
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

  private async getReporteDiaAnterior(gas?: string): Promise<any> {
    try {
      const dataTable = await this.bd.query(
        `WITH RECURSIVE horas_dia AS (
          SELECT 0 AS hora
          UNION ALL
          SELECT hora + 1 FROM horas_dia WHERE hora + 1 < 24), datos AS ( SELECT HOUR(df.tiempo) AS label,
            AVG(df.ppm) AS ppm_total,
            COUNT(*) AS total
          FROM 
          detalles_fuga df
          INNER JOIN 
          fuga_gas fg ON df.id_fuga = fg.id
          WHERE
            (fg.tiempo_inicial >= CURDATE() - INTERVAL 1 DAY OR fg.tiempo_final >= CURDATE() - INTERVAL 1 DAY)
            AND fg.tipo_gas = ? 
          GROUP BY 
          HOUR(df.tiempo))
          
          SELECT
            h.hora as label,
            IFNULL(datos.ppm_total, 0) AS ppm_total,
            IFNULL(datos.total, 0) AS total
          FROM 
            horas_dia h
            LEFT JOIN datos ON h.hora = datos.label
          ORDER BY h.hora;`, [gas]);

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getReporteSemanaAnterior(gas?: string): Promise<any>{
    try {
      const dataTable = await this.bd.query(`WITH RECURSIVE dias_semana AS ( 
        SELECT CURDATE() - INTERVAL 6 DAY AS fecha
        UNION ALL 
        SELECT fecha + INTERVAL 1 DAY FROM dias_semana WHERE fecha + INTERVAL 1 DAY <= CURDATE()), datos AS ( SELECT
          DATE(df.tiempo) AS label,
          AVG(df.ppm) AS ppm_total,
          COUNT(*) AS total
        FROM 
          detalles_fuga df
          INNER JOIN fuga_gas fg ON df.id_fuga = fg.id
        WHERE (fg.tiempo_inicial >= CURDATE() - INTERVAL 6 DAY OR fg.tiempo_final >= CURDATE() - INTERVAL 6 DAY)
        AND fg.tipo_gas = ? 
    GROUP BY  DATE(df.tiempo))
    
    SELECT
      d.fecha as label,
      IFNULL(datos.ppm_total, 0) AS ppm_total,
      IFNULL(datos.total, 0) AS total
    FROM 
      dias_semana d
      LEFT JOIN datos ON d.fecha = datos.label -- datos.label refers to DATE(df.tiempo) from the subquery
    ORDER BY d.fecha;`, [gas]);

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return []
    }
  }
  
  private async getReporteTresMeses(gas?: string): Promise<any> {
    try {
      const dataTable = await this.bd.query(`WITH RECURSIVE meses AS (
        SELECT DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-01') AS mes
        UNION ALL
        SELECT DATE_ADD(mes, INTERVAL 1 MONTH)
        FROM meses
        WHERE DATE_ADD(mes, INTERVAL 1 MONTH) <= DATE_FORMAT(CURDATE(), '%Y-%m-01')), datos AS (SELECT 
            DATE_FORMAT(df.tiempo, '%Y-%m-01') AS mes, 
            AVG(df.ppm) AS ppm_total
          FROM 
            detalles_fuga df
            INNER JOIN fuga_gas fg ON df.id_fuga = fg.id
          WHERE (fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) OR fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH))
          AND fg.tipo_gas = ? 
      GROUP BY DATE_FORMAT(df.tiempo, '%Y-%m-01'))
      
      SELECT
        m.mes as label,
        IFNULL(d.ppm_total, 0) AS ppm_total
      FROM 
        meses m
        LEFT JOIN datos d ON m.mes = d.mes
      ORDER BY m.mes;`, [gas]);

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getReporteSeisMeses(gas?: string): Promise<any> {
    try {
      const dataTable = await this.bd.query(`WITH RECURSIVE meses AS (
        SELECT DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01') AS mes
        UNION ALL
        SELECT DATE_ADD(mes, INTERVAL 1 MONTH)
        FROM 
          meses
        WHERE DATE_ADD(mes, INTERVAL 1 MONTH) <= DATE_FORMAT(CURDATE(), '%Y-%m-01')), datos AS ( SELECT 
          DATE_FORMAT(df.tiempo, '%Y-%m-01') AS mes, 
          AVG(df.ppm) AS ppm_total
        FROM 
          detalles_fuga df
          INNER JOIN fuga_gas fg ON df.id_fuga = fg.id
        WHERE (fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) OR fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
        AND fg.tipo_gas = ? 
    GROUP BY DATE_FORMAT(df.tiempo, '%Y-%m-01'))
    
    SELECT
      m.mes as label,
      IFNULL(d.ppm_total, 0) AS ppm_total
    FROM 
      meses m
      LEFT JOIN datos d ON m.mes = d.mes
    ORDER BY m.mes;`, [gas]);

      return dataTable[0];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  private async getReporteAnioAnterior(gas?: string): Promise<any> {
    try {
      const dataTable = await this.bd.query(`WITH RECURSIVE meses AS (SELECT 
        DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01') AS mes
        UNION ALL
        SELECT DATE_ADD(mes, INTERVAL 1 MONTH)
        FROM 
          meses
        WHERE DATE_ADD(mes, INTERVAL 1 MONTH) <= DATE_FORMAT(CURDATE(), '%Y-%m-01')), datos AS (
        SELECT
          DATE_FORMAT(df.tiempo, '%Y-%m') AS label,
          AVG(df.ppm) AS ppm_total
        FROM 
          detalles_fuga df
          INNER JOIN fuga_gas fg ON df.id_fuga = fg.id
        WHERE (fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) OR fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR))
        AND fg.tipo_gas = ? 
    GROUP BY DATE_FORMAT(df.tiempo, '%Y-%m'))
    
    SELECT
      DATE_FORMAT(m.mes, '%Y-%m') AS label,
      IFNULL(d.ppm_total, 0) AS ppm_total
    FROM 
      meses m
      LEFT JOIN datos d ON DATE_FORMAT(m.mes, '%Y-%m') = d.label
    ORDER BY label;`, [gas]);

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

  public async getReporteFugas(filter?: string, gas?:string) {
    console.log(filter)
    if(filter === "ultimo_dia") return await this.getReporteDiaAnterior(gas);
    if(filter === "tres_meses") return await this.getReporteTresMeses(gas);
    if(filter === "seis_meses") return await this.getReporteSeisMeses(gas);
    if(filter === "ultimo_anio") return await this.getReporteAnioAnterior(gas)
    else return await this.getReporteSemanaAnterior(gas);
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