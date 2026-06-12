import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importação de Controllers e Middlewares
import { registrar, login } from './controllers/authController.js';
import { listarCategorias } from './controllers/categoryController.js';

import {
    listarProdutosOficiais,
    obterMeuAlbum,
    adicionarProdutoAoAlbum,
    removerProdutoDoAlbum
} from './controllers/productController.js';

import {
    proporTroca,
    listarMercadoDeTrocas
} from './controllers/tradeController.js';

import { verificarToken } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Rota de Diagnóstico
app.get('/', (req, res) => {
    res.json({
        status: "API do Álbum da Copa 2026 ativa no modelo Produtos/Categorias!"
    });
});

// =========================
// AUTENTICAÇÃO
// =========================
app.post('/api/auth/registrar', registrar);
app.post('/api/auth/login', login);

// =========================
// CATEGORIAS
// =========================
app.get(
    '/api/categorias',
    verificarToken,
    listarCategorias
);

// =========================
// ÁLBUM / PRODUTOS
// =========================
app.get(
    '/api/produtos',
    verificarToken,
    listarProdutosOficiais
);

app.get(
    '/api/meu-album',
    verificarToken,
    obterMeuAlbum
);

app.post(
    '/api/meu-album/adicionar',
    verificarToken,
    adicionarProdutoAoAlbum
);

app.post(
    '/api/meu-album/remover',
    verificarToken,
    removerProdutoDoAlbum
);

// =========================
// TROCAS
// =========================
app.post(
    '/api/trocas/propor',
    verificarToken,
    proporTroca
);

app.get(
    '/api/trocas/mercado',
    verificarToken,
    listarMercadoDeTrocas
);

// =========================
// INICIAR SERVIDOR
// =========================
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando perfeitamente na porta ${PORT}`);
});