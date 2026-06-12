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

// Diminuir a quantidade ou remover um produto (figurinha) do álbum do usuário
export const removerProdutoDoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    try {
        // Verificar se o usuário realmente tem o produto no inventário
        const { data: itemExistente } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .single();

        if (!itemExistente) {
            return res.status(404).json({ error: 'Você não possui este produto no seu inventário.' });
        }

        if (itemExistente.quantidade > 1) {
            // Se ele tem mais de 1 (repetida), diminui a quantidade
            const { data, error } = await supabase
                .from('inventario')
                .update({ quantidade: itemExistente.quantidade - 1 })
                .eq('id', itemExistente.id)
                .select();
            
            if (error) throw error;
            return res.status(200).json({ message: 'Uma unidade foi removida!', data });
        } else {
            // Se ele só tem 1 unidade, deleta o registro para voltar a ser "Faltante"
            const { error } = await supabase
                .from('inventario')
                .delete()
                .eq('id', itemExistente.id);

            if (error) throw error;
            return res.status(200).json({ message: 'Produto removido do seu álbum!' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};