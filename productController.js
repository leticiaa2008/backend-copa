import { supabase } from '../config/supabase.js';

// Listar todos os produtos (jogadores) com os dados da sua respectiva categoria (time)
export const listarProdutosOficiais = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select(`
                id,
                nome,
                posicao,
                foto_url,
                raridade,
                numero_figurinha,
                categorias (
                    id,
                    nome,
                    grupo
                )
            `);

        if (error) throw error;

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Obter o álbum do usuário logado
export const obterMeuAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const { data, error } = await supabase
            .from('inventario')
            .select(`
                id,
                quantidade,
                produtos (
                    id,
                    nome,
                    posicao,
                    foto_url,
                    raridade,
                    numero_figurinha,
                    categorias (
                        id,
                        nome
                    )
                )
            `)
            .eq('usuario_id', usuarioId);

        if (error) throw error;

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Adicionar figurinha ao álbum
export const adicionarProdutoAoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    if (!produtoId) {
        return res.status(400).json({
            error: 'ID do produto não fornecido.'
        });
    }

    try {

        const { data: itemExistente } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .single();

        if (itemExistente) {

            const { data, error } = await supabase
                .from('inventario')
                .update({
                    quantidade: itemExistente.quantidade + 1
                })
                .eq('id', itemExistente.id)
                .select();

            if (error) throw error;

            return res.status(200).json({
                message: 'Produto repetido adicionado ao inventário!',
                data
            });

        } else {

            const { data, error } = await supabase
                .from('inventario')
                .insert([
                    {
                        usuario_id: usuarioId,
                        produto_id: produtoId,
                        quantidade: 1
                    }
                ])
                .select();

            if (error) throw error;

            return res.status(201).json({
                message: 'Novo produto colado no álbum!',
                data
            });
        }

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// REMOVER FIGURINHA DO ÁLBUM
export const removerProdutoDoAlbum = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoId } = req.body;

    if (!produtoId) {
        return res.status(400).json({
            error: 'ID do produto não fornecido.'
        });
    }

    try {

        const { data: itemExistente, error: buscaErro } = await supabase
            .from('inventario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoId)
            .single();

        if (buscaErro || !itemExistente) {
            return res.status(404).json({
                error: 'Figurinha não encontrada no álbum.'
            });
        }

        if (itemExistente.quantidade > 1) {

            const { error } = await supabase
                .from('inventario')
                .update({
                    quantidade: itemExistente.quantidade - 1
                })
                .eq('id', itemExistente.id);

            if (error) throw error;

        } else {

            const { error } = await supabase
                .from('inventario')
                .delete()
                .eq('id', itemExistente.id);

            if (error) throw error;
        }

        return res.status(200).json({
            message: 'Figurinha removida com sucesso!'
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};