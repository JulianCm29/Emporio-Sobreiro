require('dotenv').config();
const express = require('express');
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const cors = require('cors');
const exphbs = require('express-handlebars');
const handlebars = require('handlebars');
const { Sequelize, Op } = require('sequelize');
const axios = require('axios');



const app = express();
const PORTA = 3005;

const corsOptions = {
    origin: ['http://172.26.3.157:3000', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500']
};

// Bloqueia acessos que não venham de localhost
function bloquearAcessoExterno(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    if (ip !== '127.0.0.1' && ip !== '::1') {
        return res.status(403).send('Acesso externo não permitido');
    }
    next();
}

// Template engine
app.engine('.handlebars', exphbs.engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    helpers: { eq: (a, b) => a === b }
}));
app.set('view engine', 'handlebars');

// Helper para destacar produto do tipo Cesta nas views
handlebars.registerHelper('contains', function (str, substring, options) {
    if (typeof str === 'string' && str.toLowerCase().includes(substring.toLowerCase())) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// Banco de dados


const sequelize = new Sequelize('banco', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

sequelize.authenticate()
    .then(() => console.log('Banco de dados conectado.'))
    .catch(e => console.error('Erro ao conectar ao banco:', e));

// Modelos
const Produto = sequelize.define('produtos', {
    codigo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: false },
    descricao: { type: Sequelize.TEXT, allowNull: false },
    quantidade_estoque: { type: Sequelize.INTEGER, allowNull: false },
    preco: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    categoria: { type: Sequelize.STRING(30), allowNull: false },
    foto: { type: Sequelize.STRING(255), allowNull: false },
    altura: { type: Sequelize.FLOAT, allowNull: true },
    largura: { type: Sequelize.FLOAT, allowNull: true },
    comprimento: { type: Sequelize.FLOAT, allowNull: true },
    volume: { type: Sequelize.FLOAT, allowNull: true },
    fator_empilhamento: { type: Sequelize.FLOAT, allowNull: true }
}, { createdAt: false, updatedAt: false });

const Pedido = sequelize.define('pedidos', {
    codigo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_nome: { type: Sequelize.STRING(100), allowNull: false },
    cliente_cpf_cnpj: { type: Sequelize.STRING(100), allowNull: false },
    cliente_telefone: { type: Sequelize.STRING(15), allowNull: false },
    lista_codigos_produtos: { type: Sequelize.STRING(100), allowNull: false },
    preco_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    entrega_destinatario_nome: { type: Sequelize.STRING(100), allowNull: false },
    entrega_destinatario_endereco: { type: Sequelize.STRING(100), allowNull: false },
    entrega_data_horario: { type: Sequelize.DATE, allowNull: false },
    mensagem_cartao: { type: Sequelize.TEXT, allowNull: true },
    data_criacao: { type: Sequelize.DATE, allowNull: false },
    frete_opcao: { type: Sequelize.STRING(100), allowNull: true },
    frete_preco: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
    frete_etiqueta_id: { type: Sequelize.STRING(100), allowNull: true },
    frete_link_impressao: { type: Sequelize.TEXT, allowNull: true },
    status_pagamento: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pendente' },
    mercadopago_preference_id: { type: Sequelize.STRING(100), allowNull: true }
}, { createdAt: false, updatedAt: false });

const Cliente = sequelize.define('clientes', {
    codigo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: false },
    email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    telefone: { type: Sequelize.STRING(15), allowNull: false },
    senha: { type: Sequelize.STRING(100), allowNull: false },
    endereco: { type: Sequelize.STRING(255), allowNull: false }
}, { createdAt: false, updatedAt: false });

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('frontend'));

// ─── Rotas de Produtos ────────────────────────────────────────────────────────

app.get('/', (req, res) => res.sendFile('index.html', { root: './frontend' }));

app.get('/produtos/cadastrar', bloquearAcessoExterno, (req, res) => {
    res.render('cadastrarProduto', {});
});

app.post('/produtos/cadastrar', (req, res) => {
    const { nome, descricao } = req.body;
    if (!nome || !descricao) return res.send('Erro - campos obrigatórios em branco.');
    Produto.create(req.body);
    res.send('Produto cadastrado com sucesso.');
});

app.get('/produtos/listar-todos', bloquearAcessoExterno, async (req, res) => {
    try {
        const produtosBD = (await Produto.findAll()).map(p => p.get({ plain: true }));
        res.render('listaProdutos', { produtosBD });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar produtos');
    }
});

app.get('/produtos/editar/:codigoProduto', bloquearAcessoExterno, async (req, res) => {
    try {
        const produtoBD = await Produto.findByPk(req.params.codigoProduto);
        res.render('editarProduto', { produtoPlano: produtoBD.get({ plain: true }) });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar produto');
    }
});

app.post('/produtos/salvar-edicao', (req, res) => {
    const { codigo, nome, descricao, quantidade_estoque, preco, categoria, foto } = req.body;
    if (!nome || !descricao) return res.send('Erro - campos obrigatórios em branco.');
    Produto.update({ nome, descricao, quantidade_estoque, preco, categoria, foto }, { where: { codigo } });
    res.redirect('/produtos/listar-todos');
});

app.get('/produtos/excluir/:codigoProduto', bloquearAcessoExterno, async (req, res) => {
    try {
        await Produto.destroy({ where: { codigo: req.params.codigoProduto } });
        res.redirect('/produtos/listar-todos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir o produto');
    }
});

app.get('/produtos/:codigoProduto', bloquearAcessoExterno, async (req, res) => {
    try {
        const produtoBD = await Produto.findByPk(req.params.codigoProduto);
        res.render('consultaProduto', { produtoPlano: produtoBD.get({ plain: true }) });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar produto');
    }
});

app.get('/produtos/categoria/:categoria', cors(corsOptions), async (req, res) => {
    const mapa = {
        cesta: 'Cesta',
        bebida: 'Bebida',
        item_comestivel: 'Item comestível',
        decoracao_cesta: 'Decoração',
        cartao_de_mensagem: 'Cartão de mensagem',
        presente_tematico: 'Presente temático'
    };

    const categoriaBD = mapa[req.params.categoria];
    if (!categoriaBD) return res.status(400).json({ erro: 'Categoria inválida.' });

    try {
        const produtos = await Produto.findAll({ where: { categoria: { [Op.iLike]: categoriaBD } } });
        res.json(produtos.map(p => p.get({ plain: true })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar produtos da categoria' });
    }
});

// ─── Rotas de Pedidos ─────────────────────────────────────────────────────────

app.get('/pedidos/listar-todos', bloquearAcessoExterno, async (req, res) => {
    try {
        const pedidosBD = (await Pedido.findAll()).map(p => p.get({ plain: true }));
        res.render('listaPedidos', { pedidosBD });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar pedidos');
    }
});

app.get('/pedidos/:codigoPedido', bloquearAcessoExterno, async (req, res) => {
    try {
        const pedidoBD = await Pedido.findByPk(req.params.codigoPedido);
        const pedidoPlano = pedidoBD.get({ plain: true });

        // Converte a lista de códigos para array de inteiros
        let listaCodigos = pedidoPlano.lista_codigos_produtos;
        if (typeof listaCodigos === 'string') {
            listaCodigos = listaCodigos.trim().startsWith('[')
                ? JSON.parse(listaCodigos)
                : listaCodigos.split(',').map(c => parseInt(c.trim()));
        }
        if (!Array.isArray(listaCodigos)) listaCodigos = [];

        const produtosBD = await Produto.findAll({ where: { codigo: { [Op.in]: [...new Set(listaCodigos)] } } });

        const produtosMap = {};
        produtosBD.forEach(p => produtosMap[p.codigo] = p.get({ plain: true }));

        const listaProdutosCestaBDPlanos = listaCodigos.map(codigo => produtosMap[codigo]);

        res.render('consultaPedido', { pedidoPlano, listaProdutosCestaBDPlanos });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar pedido');
    }
});

app.post('/pedidos/cadastrar', cors(corsOptions), async (req, res) => {
    const { cliente_nome, cliente_cpf_cnpj, cliente_telefone, lista_codigos_produtos,
        preco_total, entrega_destinatario_nome, entrega_destinatario_endereco, entrega_data_horario, mensagem_cartao,
        frete_opcao, frete_preco, frete_opcao_id } = req.body;

    if (!cliente_nome || !cliente_cpf_cnpj || !cliente_telefone || !lista_codigos_produtos ||
        !preco_total || !entrega_destinatario_nome || !entrega_destinatario_endereco || !entrega_data_horario) {
        return res.status(400).json({ erro: 'Dados incompletos.' });
    }

    try {
        const codigosProdutos = Array.isArray(lista_codigos_produtos)
            ? lista_codigos_produtos.map(Number)
            : lista_codigos_produtos.split(',').map(c => Number(c.trim()));

        const quantidadesCompradas = {};

        codigosProdutos.forEach(codigo => {
            quantidadesCompradas[codigo] = (quantidadesCompradas[codigo] || 0) + 1;
        });

        const produtosBD = await Produto.findAll({
            where: {
                codigo: Object.keys(quantidadesCompradas)
            }
        });

        if (produtosBD.length !== Object.keys(quantidadesCompradas).length) {
            return res.status(400).json({ erro: 'Um ou mais produtos do carrinho não foram encontrados.' });
        }

        for (const produto of produtosBD) {
            const quantidadePedida = quantidadesCompradas[produto.codigo];

            if (produto.quantidade_estoque < quantidadePedida) {
                return res.status(400).json({
                    erro: `Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.quantidade_estoque}, pedido: ${quantidadePedida}.`
                });
            }
        }

        for (const produto of produtosBD) {
            const quantidadePedida = quantidadesCompradas[produto.codigo];

            await Produto.update(
                { quantidade_estoque: produto.quantidade_estoque - quantidadePedida },
                { where: { codigo: produto.codigo } }
            );
        }

        const novoPedido = await Pedido.create({
            cliente_nome, cliente_cpf_cnpj, cliente_telefone,
            lista_codigos_produtos: Array.isArray(lista_codigos_produtos)
                ? JSON.stringify(lista_codigos_produtos)
                : lista_codigos_produtos,
            preco_total, entrega_destinatario_nome, entrega_destinatario_endereco,
            entrega_data_horario, mensagem_cartao, data_criacao: new Date(),
            frete_opcao, frete_preco, frete_opcao_id,
            status_pagamento: 'pendente'
        });

        const preferenceItems = [
            {
                title: 'Cesta de Presentes Emporio Sobreiro',
                description: `Pedido ${novoPedido.codigo}`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: Number((parseFloat(preco_total) - (parseFloat(frete_preco) || 0)).toFixed(2))
            }
        ];

        if (frete_preco && parseFloat(frete_preco) > 0) {
            preferenceItems.push({
                title: 'Frete: ' + frete_opcao,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: Number(parseFloat(frete_preco).toFixed(2))
            });
        }

        const cleanId = cliente_cpf_cnpj.replace(/\D/g, '');
        const preferenceData = {
            items: preferenceItems,
            payer: {
                name: cliente_nome,
                identification: {
                    type: cleanId.length > 11 ? 'CNPJ' : 'CPF',
                    number: cleanId
                }
            },
            back_urls: {
                success: `http://localhost:3005/pedidos/retorno`,
                failure: `http://localhost:3005/pedidos/retorno`,
                pending: `http://localhost:3005/pedidos/retorno`
            },
            external_reference: novoPedido.codigo.toString()
        };

        const mpRes = await axios.post('https://api.mercadopago.com/checkout/preferences', preferenceData, {
            headers: {
                'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const init_point = mpRes.data.sandbox_init_point || mpRes.data.init_point;

        await novoPedido.update({ mercadopago_preference_id: mpRes.data.id });

        res.status(201).json({ mensagem: 'Pedido cadastrado com sucesso', init_point });
    } catch (err) {
        console.error('Erro na integração com Mercado Pago:', err.response ? err.response.data : err.message);
        res.status(500).json({ erro: 'Erro ao criar o pagamento no Mercado Pago. Verifique suas credenciais de teste.' });
    }
});

app.get('/pedidos/retorno', async (req, res) => {
    const { collection_status, status, external_reference, preference_id } = req.query;

    if (!external_reference) {
        return res.status(400).send('Referência do pedido não encontrada.');
    }

    try {
        const pedido = await Pedido.findByPk(external_reference);
        if (!pedido) {
            return res.status(404).send('Pedido não encontrado.');
        }

        let mensagem = 'O pagamento está pendente ou sendo processado.';
        let cor = '#f59e0b'; // laranja

        if (status === 'approved' || collection_status === 'approved') {
            await pedido.update({ status_pagamento: 'pago' });
            mensagem = 'Pagamento Aprovado com Sucesso!';
            cor = '#10b981'; // verde
        } else if (status === 'rejected' || status === 'null') {
            await pedido.update({ status_pagamento: 'cancelado' });
            mensagem = 'O pagamento foi recusado ou cancelado.';
            cor = '#ef4444'; // vermelho
        }

        res.render('retornoPedido', { layout: false, pedido: pedido.get({ plain: true }), mensagem, cor });
    } catch (e) {
        console.error(e);
        res.status(500).send('Erro ao processar o retorno do pagamento.');
    }
});

// ─── Rotas de Clientes ────────────────────────────────────────────────────────

app.post('/clientes/cadastrar', cors(corsOptions), async (req, res) => {
    const { nome, email, telefone, senha, endereco } = req.body;
    if (!nome || !email || !telefone || !senha || !endereco) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }
    try {
        if (await Cliente.findOne({ where: { email } })) {
            return res.status(400).json({ erro: 'Email já cadastrado.' });
        }
        const novo = await Cliente.create({ nome, email, telefone, senha, endereco });
        const clienteSeguro = novo.get({ plain: true });
        delete clienteSeguro.senha;
        res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso', cliente: clienteSeguro });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
    }
});

app.post('/clientes/login', cors(corsOptions), async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    try {
        const cliente = await Cliente.findOne({ where: { email, senha } });
        if (!cliente) return res.status(401).json({ erro: 'Credenciais inválidas.' });
        const clienteSeguro = cliente.get({ plain: true });
        delete clienteSeguro.senha;
        res.status(200).json({ mensagem: 'Login efetuado com sucesso', cliente: clienteSeguro });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao efetuar login' });
    }
});

// ─── Rotas do Melhor Envio ───────────────────────────────────────────────────

const MELHOR_ENVIO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiIyZTAwNzRkNDYyM2Q1MGNjNTI4NTEyZmIzMDA4YzMzYTczYjZkOTYzMmUyOTRhMzk3MDI3MzAxMDUxODkyZjc5ZWJkYTM2MTIxZjgxMmIwNyIsImlhdCI6MTc3OTgyMTg1MS40NjAwNTIsIm5iZiI6MTc3OTgyMTg1MS40NjAwNTUsImV4cCI6MTgxMTM1Nzg1MS40NTA2NzMsInN1YiI6ImExZGZiMzlkLWY2NzUtNDM0MC1iYTcyLWY4MjQzOTEyOTdhZSIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJjb21wYW5pZXMtd3JpdGUiLCJjb3Vwb25zLXJlYWQiLCJjb3Vwb25zLXdyaXRlIiwibm90aWZpY2F0aW9ucy1yZWFkIiwib3JkZXJzLXJlYWQiLCJwcm9kdWN0cy1yZWFkIiwicHJvZHVjdHMtZGVzdHJveSIsInByb2R1Y3RzLXdyaXRlIiwicHVyY2hhc2VzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiLCJzaGlwcGluZy1jYW5jZWwiLCJzaGlwcGluZy1jaGVja291dCIsInNoaXBwaW5nLWNvbXBhbmllcyIsInNoaXBwaW5nLWdlbmVyYXRlIiwic2hpcHBpbmctcHJldmlldyIsInNoaXBwaW5nLXByaW50Iiwic2hpcHBpbmctc2hhcmUiLCJzaGlwcGluZy10cmFja2luZyIsImVjb21tZXJjZS1zaGlwcGluZyIsInRyYW5zYWN0aW9ucy1yZWFkIiwidXNlcnMtcmVhZCIsInVzZXJzLXdyaXRlIiwid2ViaG9va3MtcmVhZCIsIndlYmhvb2tzLXdyaXRlIiwid2ViaG9va3MtZGVsZXRlIiwidGRlYWxlci13ZWJob29rIl19.ezZ-v3ayp1--3thsNuCw6S63gxUbkge0vUz_P0i1nK04IJbqRmAzDOQz0GycWPsfsVK-e50vBHZ3v9ReY0R_uwy_y22yE99XpmKHTMzJzurTGL9ZYR9PN__goqrwZzXGdb46gPE5Pi2_-4UvtJn5YBCcegzY2JAiOkKV0tCe8f4LF2LoEQlmnblEc9iJHmVZVMNBsVcBShgc77tU035E1WAQ9B1myCG0PkwxCyvP7qLtbuX4_f4qOBv4gGnSlcLB_n787hS2zImdvtul7UA8jSFC4pOV1lje4TnMquqRwjEXHu2-p1_jmxvngJDLXWdHPg9wTkR3BVQWnzT34BwJpHOXdW6a629fjfdOytxkppa8rMRNpBfe0-9XvWpv-_wROYWj2f8_YGhZaaqZN1lcCdwYPkr_ukoUfriQz77URuajVksE9N-oOEabsYmGh63LWXaETLGqV29Zho5ajvCGSvGDQAOFScB-I4H_JkJJee5gcZ43KoTEoWmYtbqxVvy3D6MXPyeXeZSbJs0CbyIz-sH9mCFYheICYd6X04vnAiiyXaPbXrE0Zdjgy9QCtDqCH_fHhuqhAxqXzoVucBhe8lLnnnO3m1nKmFA7motUfyvISZyMpPx_AXswG4rVGMd9yvLco35czypn6vuWbtZ15VH36pzfBhoPZ89Z9YJFLrQ';
const MELHOR_ENVIO_CEP_ORIGEM = '96415200';
const MELHOR_ENVIO_API_URL = 'https://sandbox.melhorenvio.com.br';

app.post('/frete/calcular', cors(corsOptions), async (req, res) => {
    const { cepDestino, produtos } = req.body;
    if (!cepDestino) {
        return res.status(400).json({ erro: 'CEP de destino é obrigatório.' });
    }

    try {
        const productsPayload = (produtos && produtos.length > 0) ? produtos.map(p => ({
            name: p.nome || 'Item da Cesta',
            quantity: 1,
            unitary_weight: 0.3,
            unitary_value: parseFloat(p.preco) || 10.00,
            length: 15,
            width: 15,
            height: 10
        })) : [{
            name: 'Cesta de Presente',
            quantity: 1,
            unitary_weight: 1.5,
            unitary_value: 50.00,
            length: 30,
            width: 25,
            height: 20
        }];

        const response = await axios.post(`${MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`, {
            from: { postal_code: MELHOR_ENVIO_CEP_ORIGEM },
            to: { postal_code: cepDestino },
            products: productsPayload
        }, {
            headers: {
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'EmporioSobreiro (suporte@sobreiro.com)'
            }
        });

        const opcoesFormatadas = response.data.map(item => ({
            id: item.id,
            nome: item.name,
            empresa: item.company.name,
            preco: item.price,
            prazo: item.delivery_time,
            erro: item.error || null
        }));

        res.json(opcoesFormatadas);
    } catch (err) {
        console.error('Erro ao calcular frete no Melhor Envio:', err.response?.data || err.message);
        res.status(500).json({ erro: 'Erro ao calcular o frete no Melhor Envio.' });
    }
});

app.post('/pedidos/emitir-etiqueta/:codigo', bloquearAcessoExterno, async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.codigo);
        if (!pedido) {
            return res.status(404).json({ erro: 'Pedido não encontrado.' });
        }

        const parts = pedido.entrega_destinatario_endereco.split(' - ');
        const cepPart = parts[0]?.replace('CEP:', '').trim() || '96415200';
        const addressText = parts[1] || pedido.entrega_destinatario_endereco;

        const addrParts = addressText.split(',');
        const logradouro = addrParts[0]?.trim() || 'Rua Principal';
        const numero = addrParts[1]?.trim() || '123';
        const bairro = addrParts[2]?.trim() || 'Centro';

        const cepDestino = cepPart.replace(/\D/g, '') || '96415200';

        function isValidCPF(cpf) {
            cpf = cpf.replace(/\D/g, '');
            if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
            let soma = 0, resto;
            for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(cpf.substring(9, 10))) return false;
            soma = 0;
            for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(cpf.substring(10, 11))) return false;
            return true;
        }

        function isValidCNPJ(cnpj) {
            cnpj = cnpj.replace(/\D/g, '');
            if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
            let tamanho = cnpj.length - 2;
            let numeros = cnpj.substring(0, tamanho);
            let digitos = cnpj.substring(tamanho);
            let soma = 0, pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2) pos = 9;
            }
            let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(0)) return false;
            tamanho = tamanho + 1;
            numeros = cnpj.substring(0, tamanho);
            soma = 0, pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2) pos = 9;
            }
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(1)) return false;
            return true;
        }

        function getValidDocument(doc) {
            if (!doc) return '35182819077';
            const cleanDoc = doc.replace(/\D/g, '');
            if (cleanDoc.length === 11 && isValidCPF(cleanDoc)) return cleanDoc;
            if (cleanDoc.length === 14 && isValidCNPJ(cleanDoc)) return cleanDoc;
            return '35182819077';
        }

        let cidade = 'Bage';
        let ufFinal = 'RS';

        try {
            const viaCepRes = await axios.get(`https://viacep.com.br/ws/${cepDestino}/json/`);
            if (viaCepRes.data && viaCepRes.data.uf) {
                ufFinal = viaCepRes.data.uf;
                cidade = viaCepRes.data.localidade;
            }
        } catch (e) {
            console.error('Erro ao consultar ViaCEP no backend:', e.message);
            // Fallback manual se a API falhar
            if (addrParts[3]) {
                const cidadeUf = addrParts[3].split('-');
                cidade = cidadeUf[0]?.trim() || 'Bage';
                const ufExt = cidadeUf[1]?.trim();
                if (ufExt) ufFinal = ufExt.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
            }
        }

        const headers = {
            'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'EmporioSobreiro (suporte@sobreiro.com)'
        };

        const cartPayload = {
            service: parseInt(pedido.frete_opcao_id) || 1,
            from: {
                name: 'Emporio Sobreiro',
                phone: '53999999999',
                email: 'contato@sobreiro.com',
                document: '83052443771', // CPF válido necessário pelo sandbox
                address: 'Rua Principal',
                number: '100',
                district: 'Centro',
                city: 'Bage',
                state_abbr: 'RS',
                postal_code: '96415200'
            },
            to: {
                name: pedido.entrega_destinatario_nome,
                phone: pedido.cliente_telefone || '53999999999',
                email: 'cliente@gmail.com',
                document: getValidDocument(pedido.cliente_cpf_cnpj), // Fallback se cpf cliente for inválido
                address: logradouro,
                number: numero,
                district: bairro,
                city: cidade,
                state_abbr: ufFinal,
                postal_code: cepDestino
            },
            products: [{
                name: 'Cesta de Presentes',
                quantity: 1,
                unitary_value: parseFloat(pedido.preco_total) || 50.00
            }],
            volumes: [{
                height: 20,
                width: 25,
                length: 30,
                weight: 1.5
            }],
            options: {
                insurance_value: parseFloat(pedido.preco_total),
                receipt: false,
                own_hand: false,
                reverse: false,
                non_commercial: true
            }
        };

        const cartRes = await axios.post(`${MELHOR_ENVIO_API_URL}/api/v2/me/cart`, cartPayload, { headers });
        const shipmentId = cartRes.data.id;

        await axios.post(`${MELHOR_ENVIO_API_URL}/api/v2/me/shipment/checkout`, {
            orders: [shipmentId]
        }, { headers });

        await axios.post(`${MELHOR_ENVIO_API_URL}/api/v2/me/shipment/generate`, {
            orders: [shipmentId]
        }, { headers });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const printRes = await axios.post(`${MELHOR_ENVIO_API_URL}/api/v2/me/shipment/print`, {
            mode: 'public',
            orders: [shipmentId]
        }, { headers });

        const printUrl = printRes.data.url;

        await pedido.update({
            frete_etiqueta_id: shipmentId,
            frete_link_impressao: printUrl
        });

        res.json({ mensagem: 'Etiqueta gerada com sucesso!', url: printUrl });
    } catch (err) {
        console.error('Erro na emissão da etiqueta:', err.response?.data || err.message);
        res.status(500).json({ erro: 'Erro ao emitir a etiqueta no Melhor Envio. Verifique os dados ou o saldo no sandbox.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

sequelize.sync({ alter: true }).then(() => {
    app.listen(PORTA, '0.0.0.0', () => {
        console.log(`Servidor rodando em http://localhost:${PORTA} e Banco Sincronizado!`);
    });
}).catch(err => {
    console.error('Erro ao sincronizar banco de dados:', err);
});
