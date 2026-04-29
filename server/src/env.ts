import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega variáveis do .env na raiz do projeto (um nível acima de server/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


