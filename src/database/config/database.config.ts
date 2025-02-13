import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
dotenvConfig({ path: '.env' });

const config: TypeOrmModuleOptions = {
    type: 'mysql',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [join(process.cwd(), 'dist', '**', '*.entity{.ts,.js}')],
    migrations: [join(process.cwd(), 'dist', 'database', 'migrations', '*{.ts,.js}')],
    autoLoadEntities: true,
    synchronize: false,
    retryAttempts: 10,
    retryDelay: 3000
}
export default registerAs('database', (): TypeOrmModuleOptions => config); // to register config for app connection database

export const AppDataSource = new DataSource(config as DataSourceOptions); // to use for migrations
