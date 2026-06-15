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
        this.iniciarMontagem();
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
            // A capacidade da cesta será o próprio volume da embalagem * 1.10 (margem de 10% de excesso permitido)
            this.estado.capacidadeCesta = parseFloat(produto.volume) * 1.10;
            alert(`Você selecionou a ${produto.nome}. O sistema calculará o espaço disponível para os itens.`);
        } else {
            if (!this.estado.capacidadeCesta) {
                alert('Selecione uma embalagem (Cesta) primeiro!');
                return;
            }

            // O cartão de mensagem não entra na conta de limite
            const ehCartao = produto.categoria.toLowerCase() === 'cartão de mensagem';
            
            if (!ehCartao) {
                // Calcula volume atual ocupado no carrinho
                let volumeOcupado = 0;
                this.estado.carrinho.forEach(p => {
                    if (p.categoria.toLowerCase() !== 'cesta' && p.categoria.toLowerCase() !== 'cartão de mensagem') {
                        volumeOcupado += parseFloat(p.volume) * parseFloat(p.fator_empilhamento);
                    }
                });

                const volumeItemEfetivo = parseFloat(produto.volume) * parseFloat(produto.fator_empilhamento);

                if ((volumeOcupado + volumeItemEfetivo) > this.estado.capacidadeCesta) {
                    alert('Esta cesta já está cheia demais para esse item! Escolha uma cesta maior ou adicione itens menores.');
                    return;
                }
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
        let volumeOcupado = 0;

        if (this.estado.carrinho.length === 0) {
            recipiente.innerHTML = '<p>Sua cesta está vazia.</p>';
            const volumeContainer = document.getElementById('cart-volume-container');
            if (volumeContainer) volumeContainer.style.display = 'none';
        } else {
            this.estado.carrinho.forEach((p, indice) => {
                total += parseFloat(p.preco);
                
                if (p.categoria.toLowerCase() !== 'cesta' && p.categoria.toLowerCase() !== 'cartão de mensagem') {
                    volumeOcupado += parseFloat(p.volume) * parseFloat(p.fator_empilhamento);
                }

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

            // Lógica da barra visual de volume
            const volumeContainer = document.getElementById('cart-volume-container');
            if (volumeContainer && this.estado.capacidadeCesta) {
                volumeContainer.style.display = 'block';
                // Calculamos a porcentagem baseada no volume real (sem os 10% extra) para que 100% signifique "cheio" mas possa ir até 110%
                const volumeBase = this.estado.capacidadeCesta / 1.10;
                let porcentagem = Math.round((volumeOcupado / volumeBase) * 100) || 0;
                
                let widthBar = porcentagem > 100 ? 100 : porcentagem;
                
                document.getElementById('cart-volume-text').innerText = porcentagem + '%';
                const bar = document.getElementById('cart-volume-bar');
                bar.style.width = widthBar + '%';
                
                const warningMsg = document.getElementById('cart-volume-warning');
                if (porcentagem > 100) {
                    bar.style.backgroundColor = '#f44336'; // Vermelho (usando a margem de segurança)
                    warningMsg.style.display = 'block';
                    warningMsg.innerText = 'Utilizando a capacidade extra (limite de 110%)!';
                } else if (porcentagem >= 90) {
                    bar.style.backgroundColor = '#ff9800'; // Laranja
                    warningMsg.style.display = 'none';
                } else {
                    bar.style.backgroundColor = '#4CAF50'; // Verde
                    warningMsg.style.display = 'none';
                }
            } else if (volumeContainer) {
                volumeContainer.style.display = 'none';
            }
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

        // Inicializar informações de frete e resumo no checkout
        this.estado.freteSelecionado = null;
        document.getElementById('checkout-subtotal').innerText = this.estado.precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('checkout-frete').innerText = 'Não selecionado';
        document.getElementById('checkout-total-geral').innerText = this.estado.precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('frete-opcoes').style.display = 'none';
        document.getElementById('frete-lista-opcoes').innerHTML = '';
        document.getElementById('endereco-detalhes').style.display = 'none';
        
        if (document.getElementById('dest-cep')) {
            document.getElementById('dest-cep').value = '';
        }
        if (document.getElementById('dest-numero')) {
            document.getElementById('dest-numero').value = '';
        }
        if (document.getElementById('dest-complemento')) {
            document.getElementById('dest-complemento').value = '';
        }

        this.alternarCarrinho();
        this.mostrarTela('view-checkout');
    },

    async calcularFrete() {
        const cep = document.getElementById('dest-cep').value.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
            alert('Digite um CEP válido com 8 dígitos.');
            return;
        }

        const container = document.getElementById('frete-opcoes');
        const lista = document.getElementById('frete-lista-opcoes');
        const enderecoDiv = document.getElementById('endereco-detalhes');
        
        lista.innerHTML = '<p>Calculando frete no Melhor Envio...</p>';
        container.style.display = 'block';

        // 1. Consulta CEP via ViaCEP para preencher endereço automaticamente
        try {
            const cepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (cepRes.ok) {
                const cepData = await cepRes.json();
                if (!cepData.erro) {
                    document.getElementById('dest-rua').value = cepData.logradouro || '';
                    document.getElementById('dest-bairro').value = cepData.bairro || '';
                    document.getElementById('dest-cidade-uf').value = `${cepData.localidade} - ${cepData.uf}`;
                    enderecoDiv.style.display = 'block';
                } else {
                    alert('CEP não encontrado. Por favor, digite os dados do endereço manualmente.');
                    document.getElementById('dest-rua').removeAttribute('readonly');
                    document.getElementById('dest-bairro').removeAttribute('readonly');
                    document.getElementById('dest-cidade-uf').removeAttribute('readonly');
                    document.getElementById('dest-rua').style.backgroundColor = '#fff';
                    document.getElementById('dest-bairro').style.backgroundColor = '#fff';
                    document.getElementById('dest-cidade-uf').style.backgroundColor = '#fff';
                    enderecoDiv.style.display = 'block';
                }
            }
        } catch (e) {
            console.error('Erro ao buscar CEP:', e);
        }

        // 2. Prepara os dados dos produtos no carrinho
        const produtos = this.estado.carrinho.map(p => ({
            name: p.nome,
            preco: parseFloat(p.preco)
        }));

        try {
            const res = await fetch(`${URL_API}/frete/calcular`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cepDestino: cep, produtos })
            });

            if (!res.ok) throw new Error('Erro ao calcular frete');

            const opcoes = await res.json();
            lista.innerHTML = '';

            if (!opcoes || opcoes.length === 0) {
                lista.innerHTML = '<p>Nenhuma opção de frete disponível para este CEP.</p>';
                return;
            }

            opcoes.forEach((op, index) => {
                if (op.erro) return; // ignora opções com erro
                
                const precoFormatado = parseFloat(op.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const card = document.createElement('div');
                card.className = 'frete-opcao-card';
                card.id = `frete-card-${index}`;
                card.onclick = () => this.selecionarFrete(op, index);
                card.innerHTML = `
                    <div class="frete-info">
                        <input type="radio" name="opcao-frete-radio" id="frete-radio-${index}" value="${index}">
                        <div>
                            <strong>${op.empresa} (${op.nome})</strong><br>
                            <small>Prazo de entrega: ${op.prazo} dias úteis</small>
                        </div>
                    </div>
                    <div class="frete-preco">${precoFormatado}</div>
                `;
                lista.appendChild(card);
            });

            if (lista.children.length === 0) {
                lista.innerHTML = '<p>Nenhuma transportadora disponível para este CEP.</p>';
            }

        } catch (e) {
            lista.innerHTML = '<p>Erro de conexão ao calcular o frete. Verifique o servidor.</p>';
        }
    },

    selecionarFrete(opcao, index) {
        this.estado.freteSelecionado = opcao;

        // Atualiza estilo dos cards
        document.querySelectorAll('.frete-opcao-card').forEach(c => c.classList.remove('selecionado'));
        document.getElementById(`frete-card-${index}`).classList.add('selecionado');
        document.getElementById(`frete-radio-${index}`).checked = true;

        // Atualiza resumo
        const valorFrete = parseFloat(opcao.preco);
        const totalGeral = this.estado.precoTotal + valorFrete;

        document.getElementById('checkout-frete').innerText = valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('checkout-total-geral').innerText = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    async enviarPedido() {
        const cliNome = document.getElementById('cli-nome').value;
        const cliTel = document.getElementById('cli-tel').value;
        const cpf = document.getElementById('cli-cpf').value;
        
        const destNome = document.getElementById('dest-nome').value;
        const rua = document.getElementById('dest-rua').value;
        const numero = document.getElementById('dest-numero').value;
        const bairro = document.getElementById('dest-bairro').value;
        const cidadeUf = document.getElementById('dest-cidade-uf').value;
        const complemento = document.getElementById('dest-complemento').value;
        
        const destData = document.getElementById('dest-data').value;
        const msgCartao = document.getElementById('mensagem-cartao').value;
        const cepInput = document.getElementById('dest-cep');
        const cep = cepInput ? cepInput.value : '';

        if (!cliNome || !cliTel || !cpf || !destNome || !rua || !numero || !bairro || !cidadeUf || !destData || !cep) {
            alert('Preencha todos os campos obrigatórios do comprador e da entrega.');
            return;
        }

        if (!this.estado.freteSelecionado) {
            alert('Por favor, calcule e selecione uma opção de frete!');
            return;
        }

        const valorFrete = parseFloat(this.estado.freteSelecionado.preco);
        const totalComFrete = this.estado.precoTotal + valorFrete;

        // Formata o endereço no padrão: CEP: XXXXX-XXX - Rua, Número, Bairro, Cidade - UF (Complemento)
        let enderecoCompleto = `CEP: ${cep} - ${rua}, ${numero}, ${bairro}, ${cidadeUf}`;
        if (complemento) {
            enderecoCompleto += ` (${complemento})`;
        }

        const cargaUtil = {
            cliente_nome: cliNome,
            cliente_cpf_cnpj: cpf,
            cliente_telefone: cliTel,
            lista_codigos_produtos: this.estado.carrinho.map(p => p.codigo),
            preco_total: totalComFrete,
            entrega_destinatario_nome: destNome,
            entrega_destinatario_endereco: enderecoCompleto,
            entrega_data_horario: destData,
            mensagem_cartao: msgCartao,
            frete_opcao: `${this.estado.freteSelecionado.empresa} - ${this.estado.freteSelecionado.nome}`,
            frete_preco: valorFrete,
            frete_opcao_id: this.estado.freteSelecionado.id
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
                const data = await res.json();
                this.estado.carrinho = [];
                this.estado.capacidadeCesta = null;
                this.estado.freteSelecionado = null;
                this.atualizarInterfaceCarrinho();
                document.querySelectorAll('input').forEach(i => i.value = '');
                
                // Redireciona para o checkout do Mercado Pago
                window.location.href = data.init_point;
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
