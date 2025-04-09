import { Client } from "https://deno.land/x/mysql/mod.ts";
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
        FROM fuga_gas`)
      console.log("Dato en tabla: ", dataTable[0])
      return dataTable[0] as sensor_response;
    } catch (error) {
      console.log(error);
      return []
    }
  }
}

export default BD;