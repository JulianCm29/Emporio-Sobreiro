const URL_API = '';

const CATEGORIAS = [
    { id: 'cesta',              title: 'Escolha a Embalagem',   desc: 'Selecione o tipo de cesta que servirá de base.' },
    { id: 'bebida',             title: 'Escolha as Bebidas',    desc: 'Vinhos, espumantes e sucos selecionados.' },
    { id: 'item_comestivel',    title: 'Itens Comestíveis',     desc: 'Queijos, chocolates, geleias e muito mais.' },
    { id: 'decoracao_cesta',    title: 'Decoração',             desc: 'Laços, flores e detalhes especiais.' },
    { id: 'cartao_de_mensagem', title: 'Cartão de Mensagem',    desc: 'Adicione um cartão com sua mensagem.' }
];

const FOTO_PADRAO = 'https://images.unsplash.com/photo-1590740924967-b89d4fb17d7b?auto=format&fit=crop&w=500&q=60';

const app = {
    estado: {
        carrinho: [],
        indiceEtapaAtual: 0,
        cliente: null,
        capacidadeCesta: null,
        precoTotal: 0
    },

    iniciar() {
        document.getElementById('cart-toggle-btn').addEventListener('click', () => this.alternarCarrinho());
        document.getElementById('close-cart-btn').addEventListener('click', () => this.alternarCarrinho());
        document.getElementById('cart-overlay').addEventListener('click', () => this.alternarCarrinho());
    },

    mostrarTela(idTela) {
        document.querySelectorAll('.tela').forEach(v => v.style.display = 'none');
        document.getElementById(idTela).style.display = 'block';
    },

    iniciarFluxo() {
        if (this.estado.cliente) {
            this.iniciarMontagem();
        } else {
            this.mostrarTela('view-auth');
        }
    },

    alternarAbaAutenticacao(aba) {
        document.getElementById('form-login').style.display = 'none';
        document.getElementById('form-register').style.display = 'none';
        document.getElementById('form-' + aba).style.display = 'block';
    },

    entrar() {
        const email = document.getElementById('login-email').value || 'cliente@email.com';
        this.estado.cliente = { nome: email.split('@')[0], telefone: '-' };
        this.atualizarInterfaceUsuario();
        this.iniciarMontagem();
    },

    cadastrar() {
        const nome = document.getElementById('reg-nome').value || 'Cliente';
        const telefone = document.getElementById('reg-tel').value || '-';
        this.estado.cliente = { nome, telefone };
        this.atualizarInterfaceUsuario();
        this.iniciarMontagem();
    },

    atualizarInterfaceUsuario() {
        const saudacao = document.getElementById('user-greeting');
        saudacao.style.display = 'inline-block';
        saudacao.innerText = `Olá, ${this.estado.cliente.nome.split(' ')[0]}`;
    },

    iniciarMontagem() {
        this.mostrarTela('view-selection');
        this.carregarCategoria(CATEGORIAS[0].id);
    },

    async carregarCategoria(idCategoria) {
        this.estado.indiceEtapaAtual = CATEGORIAS.findIndex(c => c.id === idCategoria);
        const cat = CATEGORIAS[this.estado.indiceEtapaAtual];

        document.getElementById('category-title').innerText = cat.title;
        document.getElementById('category-desc').innerText = cat.desc;

        const grade = document.getElementById('products-grid');
        grade.innerHTML = '<p>Carregando...</p>';

        try {
            const res = await fetch(`${URL_API}/produtos/categoria/${idCategoria}`);
            if (!res.ok) throw new Error('Erro de rede');
            this.renderizarProdutos(await res.json());
        } catch (e) {
            grade.innerHTML = '<p>Erro ao carregar produtos.</p>';
        }
    },

    renderizarProdutos(produtos) {
        const grade = document.getElementById('products-grid');
        grade.innerHTML = '';

        if (produtos.length === 0) {
            grade.innerHTML = '<p>Nenhum produto nesta categoria.</p>';
            return;
        }

        produtos.forEach(p => {
            const foto = p.foto || FOTO_PADRAO;
            const preco = parseFloat(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const cartao = document.createElement('div');
            cartao.className = 'cartao-produto';
            cartao.innerHTML = `
                <img src="${foto}" alt="${p.nome}" class="imagem-produto" onerror="this.src='${FOTO_PADRAO}'">
                <h3 style="font-size: 1.1em;">${p.nome}</h3>
                <p style="font-size: 0.9em; flex-grow: 1;">${p.descricao}</p>
                <p style="margin-top: 10px;"><strong>${preco}</strong></p>
                <button style="margin-top: 10px; width: 100%;" onclick='app.adicionarAoCarrinho(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Adicionar</button>
            `;
            grade.appendChild(cartao);
        });
    },

    proximaEtapa() {
        if (this.estado.indiceEtapaAtual < CATEGORIAS.length - 1) {
            this.carregarCategoria(CATEGORIAS[this.estado.indiceEtapaAtual + 1].id);
        } else {
            this.alternarCarrinho();
        }
    },

    etapaAnterior() {
        if (this.estado.indiceEtapaAtual > 0) {
            this.carregarCategoria(CATEGORIAS[this.estado.indiceEtapaAtual - 1].id);
        } else {
            this.mostrarTela('view-home');
        }
    },

    alternarCarrinho() {
        const menuLateral = document.getElementById('cart-sidebar');
        const fundoEscuro = document.getElementById('cart-overlay');
        
        if (menuLateral.style.display === 'block') {
            menuLateral.style.display = 'none';
            fundoEscuro.style.display = 'none';
        } else {
            menuLateral.style.display = 'block';
            fundoEscuro.style.display = 'block';
        }
    },

    adicionarAoCarrinho(produto) {
        const ehCesta = produto.categoria.toLowerCase() === 'cesta';

        if (ehCesta) {
            this.estado.carrinho = this.estado.carrinho.filter(p => p.categoria.toLowerCase() !== 'cesta');
            const nome = produto.nome.toLowerCase();
            this.estado.capacidadeCesta = nome.includes('grande') ? 10 : nome.includes('pequena') ? 5 : 7;
            alert(`Você selecionou a ${produto.nome}. Comporta até ${this.estado.capacidadeCesta} itens.`);
        } else {
            if (!this.estado.capacidadeCesta) {
                alert('Selecione uma embalagem (Cesta) primeiro!');
                return;
            }
            const itensNaCesta = this.estado.carrinho.filter(p => p.categoria.toLowerCase() !== 'cesta').length;
            if (itensNaCesta >= this.estado.capacidadeCesta) {
                alert(`A cesta atingiu o limite de ${this.estado.capacidadeCesta} itens!`);
                return;
            }
        }

        this.estado.carrinho.push(produto);
        this.atualizarInterfaceCarrinho();
    },

    removerDoCarrinho(indice) {
        const removido = this.estado.carrinho.splice(indice, 1)[0];
        if (removido.categoria.toLowerCase() === 'cesta') {
            this.estado.capacidadeCesta = null;
        }
        this.atualizarInterfaceCarrinho();
    },

    atualizarInterfaceCarrinho() {
        document.getElementById('cart-count').innerText = this.estado.carrinho.length;

        const recipiente = document.getElementById('cart-items-container');
        recipiente.innerHTML = '';

        let total = 0;

        if (this.estado.carrinho.length === 0) {
            recipiente.innerHTML = '<p>Sua cesta está vazia.</p>';
        } else {
            this.estado.carrinho.forEach((p, indice) => {
                total += parseFloat(p.preco);
                const preco = parseFloat(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const foto = p.foto || FOTO_PADRAO;

                const item = document.createElement('div');
                item.innerHTML = `
                    <div style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                        <img src="${foto}" class="imagem-item-carrinho" onerror="this.src='${FOTO_PADRAO}'">
                        <div style="flex-grow: 1;">
                            <div style="font-size: 0.9em;"><strong>${p.nome}</strong></div>
                            <div style="font-size: 0.8em;">${preco}</div>
                        </div>
                        <button onclick="app.removerDoCarrinho(${indice})">X</button>
                    </div>
                `;
                recipiente.appendChild(item);
            });
        }

        this.estado.precoTotal = total;
        document.getElementById('cart-total-price').innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('btn-go-checkout').disabled = this.estado.carrinho.length === 0;
    },

    irParaPagamento() {
        if (this.estado.carrinho.length === 0) {
            alert('Sua cesta está vazia!');
            return;
        }
        if (this.estado.cliente) {
            document.getElementById('checkout-cli-nome').innerText = this.estado.cliente.nome;
            document.getElementById('checkout-cli-tel').innerText = this.estado.cliente.telefone;
        }
        this.alternarCarrinho();
        this.mostrarTela('view-checkout');
    },

    async enviarPedido() {
        if (!this.estado.cliente) {
            alert('Você precisa estar logado para finalizar o pedido.');
            return;
        }

        const cpf      = document.getElementById('cli-cpf').value;
        const destNome = document.getElementById('dest-nome').value;
        const destEnd  = document.getElementById('dest-end').value;
        const destData = document.getElementById('dest-data').value;
        const msgCartao = document.getElementById('mensagem-cartao').value;

        if (!cpf || !destNome || !destEnd || !destData) {
            alert('Preencha todos os campos de CPF e Entrega.');
            return;
        }

        const cargaUtil = {
            cliente_nome: this.estado.cliente.nome,
            cliente_cpf_cnpj: cpf,
            cliente_telefone: this.estado.cliente.telefone,
            lista_codigos_produtos: this.estado.carrinho.map(p => p.codigo),
            preco_total: this.estado.precoTotal,
            entrega_destinatario_nome: destNome,
            entrega_destinatario_endereco: destEnd,
            entrega_data_horario: destData,
            mensagem_cartao: msgCartao
        };

        const btn = event.target;
        btn.innerText = 'Processando...';
        btn.disabled = true;

        try {
            const res = await fetch(`${URL_API}/pedidos/cadastrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cargaUtil)
            });

            if (res.ok) {
                alert('Pedido realizado com sucesso!');
                this.estado.carrinho = [];
                this.estado.capacidadeCesta = null;
                this.atualizarInterfaceCarrinho();
                this.mostrarTela('view-home');
                document.querySelectorAll('input').forEach(i => i.value = '');
            } else {
                const err = await res.json();
                alert('Erro ao realizar pedido: ' + (err.erro || 'Desconhecido'));
            }
        } catch (e) {
            alert('Erro de conexão ao enviar pedido.');
        } finally {
            btn.innerText = 'Confirmar e Enviar Pedido';
            btn.disabled = false;
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    app.mostrarTela('view-home');
    app.iniciar();
});
