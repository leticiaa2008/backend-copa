import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importação dos Controllers
import { login, registrar } from './controllers/authController.js'; 
import { 
    listarProdutosOficiais, 
    listarMeuAlbum, 
    adicionarProdutoAoAlbum, 
    removerProdutoDoAlbum 
} from './controllers/productController.js';

// Middleware de Proteção de Rota (Exemplo básico de checagem JWT)
import { verificarToken } from './middlewares/authMiddleware.js'; 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/registrar', registrar);
app.post('/api/auth/login', login);

// --- ROTAS DO ÁLBUM (PRODUTOS / INVENTÁRIO) ---
app.get('/api/produtos', verificarToken, listarProdutosOficiais);
app.get('/api/meu-album', verificarToken, listarMeuAlbum);
app.post('/api/meu-album/adicionar', verificarToken, adicionarProdutoAoAlbum);

// ATUALIZAÇÃO: Nova rota para desmarcar / subtrair figurinhas do banco
app.post('/api/meu-album/remover', verificarToken, removerProdutoDoAlbum);

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server rodando liso na porta ${PORT}`);
});