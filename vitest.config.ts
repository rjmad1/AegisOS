import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    env: {
      DATABASE_URL: 'file:./databases/dev.db',
      NODE_ENV: 'test',
      AUTH_SECRET: 'console_jwt_session_auth_secret_dev_secure_120938',
      OPS_JWT_SECRET: 'secrets_encryption_key_dev_secure_901283',
      OPS_ADMIN_USERNAME: 'console_admin_dev',
      OPS_ADMIN_PASSWORD: 'DevConsolePassword9023!',
      GOOGLE_CLIENT_ID: 'google_oauth_client_id_dev_secure_890123',
      GOOGLE_CLIENT_SECRET: 'google_oauth_client_secret_dev_secure_890123'
    }
  }
});
