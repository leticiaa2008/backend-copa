import { supabase } from '../config/supabaseClient.js'; // Ajuste o caminho se necessário

// Lista todos os jogadores oficiais fazendo JOIN com as categorias (Times)
export const listarProdutosOficiais = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select(`
                id, nome, posicao, foto_url, raridade, numero_figurinha,
                categorias (id, nome, grupo)
            `)
            .order('numero_figurinha', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retorna o inventário do usuário logado
export const listarMeuAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const { data, error } = await supabase
            .from('inventario')
            .select(`
                id, quantidade,
                produtos (id, nome, posicao, foto_url, numero_figurinha)
            `)
            .eq('usuario_id', usuarioId);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Adiciona ou incrementa uma figurinha no inventário
export const adicionarProdutoAoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    try {
        // Verifica se o usuário já tem esse jogador no álbum
        const { data: itemExistente } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .maybeSingle();

        if (itemExistente) {
            // Se já tem, incrementa a quantidade (Repetida)
            const { data, error } = await supabase
                .from('inventario')
                .update({ quantidade: itemExistente.quantidade + 1 })
                .eq('id', itemExistente.id)
                .select();

            if (error) throw error;
            return res.status(200).json({ message: 'Figurinha adicionada!', data });
        } else {
            // Se não tem, cria o registro com quantidade inicial = 1
            const { data, error } = await supabase
                .from('inventario')
                .insert([{ usuario_id: usuarioId, produto_id: produtoId, quantidade: 1 }])
                .select();

            if (error) throw error;
            return res.status(201).json({ message: 'Nova figurinha colada!', data });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ATUALIZAÇÃO: Diminui a quantidade ou remove a figurinha do inventário (Desmarcar)
export const removerProdutoDoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    try {
        const { data: itemExistente } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .maybeSingle();

        if (!itemExistente) {
            return res.status(404).json({ error: 'Você não possui esta figurinha no seu inventário.' });
        }

        if (itemExistente.quantidade > 1) {
            // Se possui repetidas, reduz 1 unidade
            const { data, error } = await supabase
                .from('inventario')
                .update({ quantity: itemExistente.quantidade - 1 }) // Garanta que o nome da coluna no seu banco seja quantidade
                .update({ quantidade: itemExistente.quantidade - 1 })
                .eq('id', itemExistente.id)
                .select();
            
            if (error) throw error;
            return res.status(200).json({ message: 'Uma unidade foi removida!', data });
        } else {
            // Se só possui 1, deleta a linha para voltar a ser "Faltante"
            const { error } = await supabase
                .from('inventario')
                .delete()
                .eq('id', itemExistente.id);

            if (error) throw error;
            return res.status(200).json({ message: 'Figurinha removida do seu álbum!' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};