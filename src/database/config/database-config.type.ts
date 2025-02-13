export type DatabaseConfig = {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    synchronize?: boolean;
    maxConnections?: number;
};
