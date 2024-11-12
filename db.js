import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

(async () => {
    try {
        const exists = await db.schema.hasTable('users');
        if (!exists) {
            await db.schema.createTable('users', table => {
                table.increments('id').primary();
                table.string('name');
                table.string('fcm_device_token');
            });
            console.log('Table "users" created.');
        }
    } catch (error) {
        console.error('Error creating table:', error);
    }
})();

export default db;