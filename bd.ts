import mysql, { RowDataPacket } from "npm:mysql2@^2.3.3/promise"
import { sensor_response } from './tipos.ts';


const connectDB = async (): Promise<mysql.Pool> => {
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

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void>{
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
        FROM fuga_gas
        order by id`)
      return dataTable[0] as sensor_response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getAvgDatos(){
    try {
      const dataTable = await this.bd.query(
        `SELECT
    df.id_fuga,
    AVG(df.ppm) AS promedio_ppm
FROM detalles_fuga df
INNER JOIN fuga_gas fg ON df.id_fuga = fg.id
WHERE
    (fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 12) DAY)
     AND fg.tiempo_inicial < DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
    OR
    (fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 12) DAY)
     AND fg.tiempo_final <= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
    OR
    (fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 12) DAY)
     AND fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
GROUP BY df.id_fuga;
        `);
      return dataTable[0]
    } catch (error) {
      console.log(error);
      return;
    }

  }

  public async getReporteFugas(filtro ?: string): Promise<any> {
    try {
      const dataTable = await this.bd.query(
        `SELECT
        df.*
        from detalles_fuga df
        inner join fuga_gas fg on df.id_fuga = fg.id
        where
        (fg.tiempo_inicial >= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
        AND fg.tiempo_inicial < DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
        OR
        (fg.tiempo_final > DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
        AND fg.tiempo_final <= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY))
        OR
        (fg.tiempo_inicial <= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 6) DAY)
        AND fg.tiempo_final >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) DAY));
        `
      )

      return dataTable[0]
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}

export default BD;