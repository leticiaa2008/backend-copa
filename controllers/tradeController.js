import { supabase } from '../config/supabase.js';

// Criar uma proposta de troca de produtos
export const proporTroca = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { produtoOferecidoId, produtoDesejadoId } = req.body;

    try {
        // Validar se ele possui o produto com quantidade suficiente para troca (repetida)
        const { data: inv } = await supabase
            .from('inventario')
            .select('quantidade')
            .eq('usuario_id', usuarioId)
            .eq('produto_id', produtoOferecidoId)
            .single();

        if (!inv || inv.quantidade < 2) {
            return res.status(400).json({ error: 'Você só pode oferecer produtos que possui repetidos (Quantidade maior que 1).' });
        }

        const { data, error } = await supabase
            .from('trocas')
            .insert([{
                usuario_proponente_id: usuarioId,
                produto_oferecido_id: produtoOferecidoId,
                produto_desejado_id: produtoDesejadoId,
                status: 'Pendente'
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Proposta de troca publicada com sucesso!', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar todas as trocas disponíveis no mercado
export const listarMercadoDeTrocas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('trocas')
            .select(`
                id, status, criado_em,
                usuarios (id, nome),
                oferecido: produtos!produto_oferecido_id (nome, numero_figurinha, categorias(nome)),
                desejado: produtos!produto_desejado_id (nome, numero_figurinha, categorias(nome))
            `)
            .eq('status', 'Pendente');

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};