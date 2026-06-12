import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Cadastro de Usuário
export const registrar = async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    try {
        // Verificar se usuário já existe
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (usuarioExistente) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }

        // Criptografar a senha
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        // Salvar na tabela customizada
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha: senhaCriptografada }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', usuarioId: data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login de Usuário
export const login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        // Buscar usuário pelo email
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
        }

        // Validar a senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
        }

        // Gerar Token JWT
        const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};