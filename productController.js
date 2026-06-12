import { supabase } from '../config/supabase.js';

// Listar todos os produtos (jogadores) com os dados da sua respectiva categoria (time)
export const listarProdutosOficiais = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select(`
                id, nome, posicao, foto_url, raridade, numero_figurinha,
                categorias (id, nome, grupo)
            `);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obter o álbum do usuário logado (quais produtos ele tem e quantidades)
export const obterMeuAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const { data, error } = await supabase
            .from('inventario')
            .select(`
                id,
                quantidade,
                produtos (
                    id, nome, posicao, foto_url, raridade, numero_figurinha,
                    categorias (id, nome)
                )
            `)
            .eq('usuario_id', usuarioId);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Adicionar um produto (ganhar figurinha) ao inventário do usuário
export const adicionarProdutoAoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    if (!produtoId) {
        return res.status(400).json({ error: 'ID do produto não fornecido.' });
    }

    try {
        // Verificar se o usuário já tem esse produto no inventário
        const { data: itemExistente } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .single();

        if (itemExistente) {
            // Se já tem, incrementa a quantidade (gerando repetida)
            const { data, error } = await supabase
                .from('inventario')
                .update({ quantidade: itemExistente.quantidade + 1 })
                .eq('id', itemExistente.id)
                .select();
            
            if (error) throw error;
            return res.status(200).json({ message: 'Produto repetido adicionado ao inventário!', data });
        } else {
            // Se não tem, insere o produto no álbum
            const { data, error } = await supabase
                .from('inventario')
                .insert([{ usuario_id: usuarioId, produto_id: produtoId, quantidade: 1 }])
                .select();

            if (error) throw error;
            return res.status(201).json({ message: 'Novo produto colado no álbum!', data });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remover um produto (desmarcar figurinha) do inventário do usuário
export const removerProdutoDoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    if (!produtoId) {
        return res.status(400).json({ error: 'ID do produto não fornecido.' });
    }

    try {
        // Verificar se o usuário realmente possui essa figurinha no inventário
        const { data: itemExistente } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .single();

        if (!itemExistente) {
            return res.status(404).json({ error: 'Você não possui essa figurinha no seu inventário.' });
        }

        if (itemExistente.quantidade > 1) {
            // Se possui mais de uma unidade (repetida), apenas diminui a quantidade
            const { data, error } = await supabase
                .from('inventario')
                .update({ quantidade: itemExistente.quantidade - 1 })
                .eq('id', itemExistente.id)
                .select();
            
            if (error) throw error;
            return res.status(200).json({ message: 'Uma unidade da figurinha foi removida!', data });
        } else {
            // Se possui apenas 1 unidade, exclui o registro completamente da tabela inventario
            const { error } = await supabase
                .from('inventario')
                .delete()
                .eq('id', itemExistente.id);

            if (error) throw error;
            return res.status(200).json({ message: 'Figurinha removida do seu álbum com sucesso!' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};