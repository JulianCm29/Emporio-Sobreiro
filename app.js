const express = require('express');
const cors = require('cors');
const exphbs = require('express-handlebars');
const handlebars = require('handlebars');
const { Sequelize, Op } = require('sequelize');
const axios = require('axios');



const app = express();
const PORTA = 3000;

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
    codigo:            { type: Sequelize.INTEGER,      primaryKey: true, autoIncrement: true },
    nome:              { type: Sequelize.STRING(100),  allowNull: false },
    descricao:         { type: Sequelize.TEXT,         allowNull: false },
    quantidade_estoque:{ type: Sequelize.INTEGER,      allowNull: false },
    preco:             { type: Sequelize.DECIMAL(10,2),allowNull: false },
    categoria:         { type: Sequelize.STRING(30),   allowNull: false },
    foto:              { type: Sequelize.STRING(255),  allowNull: false },
    altura:            { type: Sequelize.FLOAT,        allowNull: true },
    largura:           { type: Sequelize.FLOAT,        allowNull: true },
    comprimento:       { type: Sequelize.FLOAT,        allowNull: true },
    volume:            { type: Sequelize.FLOAT,        allowNull: true },
    fator_empilhamento:{ type: Sequelize.FLOAT,        allowNull: true }
}, { createdAt: false, updatedAt: false });

const Pedido = sequelize.define('pedidos', {
    codigo:                      { type: Sequelize.INTEGER,      primaryKey: true, autoIncrement: true },
    cliente_nome:                { type: Sequelize.STRING(100),  allowNull: false },
    cliente_cpf_cnpj:            { type: Sequelize.STRING(100),  allowNull: false },
    cliente_telefone:            { type: Sequelize.STRING(15),   allowNull: false },
    lista_codigos_produtos:      { type: Sequelize.STRING(100),  allowNull: false },
    preco_total:                 { type: Sequelize.DECIMAL(10,2),allowNull: false },
    entrega_destinatario_nome:   { type: Sequelize.STRING(100),  allowNull: false },
    entrega_destinatario_endereco:{ type: Sequelize.STRING(100), allowNull: false },
    entrega_data_horario:        { type: Sequelize.DATE,         allowNull: false },
    mensagem_cartao:             { type: Sequelize.TEXT,         allowNull: true },
    data_criacao:                { type: Sequelize.DATE,         allowNull: false },
    frete_opcao:                 { type: Sequelize.STRING(100),  allowNull: true },
    frete_preco:                 { type: Sequelize.DECIMAL(10,2),allowNull: true },
    frete_etiqueta_id:           { type: Sequelize.STRING(100),  allowNull: true },
    frete_link_impressao:        { type: Sequelize.TEXT,         allowNull: true }
}, { createdAt: false, updatedAt: false });

const Cliente = sequelize.define('clientes', {
    codigo:   { type: Sequelize.INTEGER,      primaryKey: true, autoIncrement: true },
    nome:     { type: Sequelize.STRING(100),  allowNull: false },
    email:    { type: Sequelize.STRING(100),  allowNull: false, unique: true },
    telefone: { type: Sequelize.STRING(15),   allowNull: false },
    senha:    { type: Sequelize.STRING(100),  allowNull: false },
    endereco: { type: Sequelize.STRING(255),  allowNull: false }
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
        cesta:              'Cesta',
        bebida:             'Bebida',
        item_comestivel:    'Item comestível',
        decoracao_cesta:    'Decoração',
        cartao_de_mensagem: 'Cartão de mensagem',
        presente_tematico:  'Presente temático'
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
        const novoPedido = await Pedido.create({
            cliente_nome, cliente_cpf_cnpj, cliente_telefone,
            lista_codigos_produtos: Array.isArray(lista_codigos_produtos)
                ? JSON.stringify(lista_codigos_produtos)
                : lista_codigos_produtos,
            preco_total, entrega_destinatario_nome, entrega_destinatario_endereco,
            entrega_data_horario, mensagem_cartao, data_criacao: new Date(),
            frete_opcao, frete_preco, frete_opcao_id
        });
        res.status(201).json({ mensagem: 'Pedido cadastrado com sucesso', pedido: novoPedido });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao cadastrar o pedido' });
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
                document: pedido.cliente_cpf_cnpj.replace(/\D/g, '') || '35182819077', // Fallback se cpf cliente for inválido
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

app.listen(PORTA, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
