import { Client } from "https://deno.land/x/mysql/mod.ts";
import mysql from "npm:mysql2@^2.3.3/promise";
import { sensor_response } from './tipos.ts';


const connectDB = async (): Promise<any> => {
    const client = await mysql.createPool({
      host: Deno.env.get("HOST"),
      user: Deno.env.get("USER"),
      port: parseInt(Deno.env.get("PORT")?.toString() || "3306"),
      password: Deno.env.get("PASS"),
      database: Deno.env.get("DB"),
      waitForConnections: true,
      connectionLimit: 10
    });
  
    console.log("✅ Conexión exitosa a MySQL");
    return client;
};

class BD {
  private bd!: Client;

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
      const dataTable= await this.bd.query(`SELECT * FROM fuga_gas`)
      console.log("Dato en tabla: ", dataTable[0])
      return dataTable[0]
    } catch (error) {
      console.log(error);
      return
    }
  }
}

export default BD;