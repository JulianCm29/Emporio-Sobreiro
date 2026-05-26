const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('banco', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Conectado ao banco para migração.');

        // Adicionar colunas se não existirem
        const queryInterface = sequelize.getQueryInterface();
        const table = await queryInterface.describeTable('produtos');
        
        if (!table.altura) await queryInterface.addColumn('produtos', 'altura', { type: Sequelize.FLOAT });
        if (!table.largura) await queryInterface.addColumn('produtos', 'largura', { type: Sequelize.FLOAT });
        if (!table.comprimento) await queryInterface.addColumn('produtos', 'comprimento', { type: Sequelize.FLOAT });
        if (!table.volume) await queryInterface.addColumn('produtos', 'volume', { type: Sequelize.FLOAT });
        if (!table.fator_empilhamento) await queryInterface.addColumn('produtos', 'fator_empilhamento', { type: Sequelize.FLOAT });

        console.log('Colunas garantidas.');

        // Atualizar produtos
        const [produtos] = await sequelize.query('SELECT codigo, nome, categoria FROM produtos');
        
        for (const p of produtos) {
            let alt = 10, larg = 10, comp = 10, fator = 1.0;
            const nome = p.nome.toLowerCase();

            if (p.categoria === 'Cesta') {
                fator = 1.0;
                if (nome.includes('grande')) { alt = 15; larg = 30; comp = 40; }
                else if (nome.includes('média')) { alt = 12; larg = 20; comp = 30; }
                else if (nome.includes('pequena')) { alt = 10; larg = 15; comp = 20; }
                else { alt = 12; larg = 25; comp = 35; }
            } else if (p.categoria === 'Bebida') {
                fator = 0.9;
                if (nome.includes('vinho') || nome.includes('espumante') || nome.includes('suco de uva')) {
                    alt = 30; larg = 8; comp = 8;
                } else if (nome.includes('cerveja')) {
                    alt = 25; larg = 7; comp = 7;
                } else {
                    alt = 20; larg = 7; comp = 7;
                }
            } else if (p.categoria === 'Item comestível') {
                if (nome.includes('castanha') || nome.includes('nozes')) {
                    alt = 3; larg = 10; comp = 15; fator = 0.5; // saco mole
                } else if (nome.includes('queijo')) {
                    alt = 4; larg = 10; comp = 12; fator = 0.7; // fatias embaladas a vacuo
                } else if (nome.includes('geleia')) {
                    alt = 8; larg = 6; comp = 6; fator = 0.9; // vidro
                } else if (nome.includes('chocolate')) {
                    alt = 2; larg = 7; comp = 15; fator = 1.0; // barra rígida
                } else if (nome.includes('torrada') || nome.includes('ferrero')) {
                    alt = 5; larg = 10; comp = 15; fator = 1.0; // caixa rígida
                } else {
                    alt = 5; larg = 10; comp = 10; fator = 1.0;
                }
            } else if (p.categoria === 'Decoração') {
                alt = 2; larg = 10; comp = 10;
                fator = 0.1; // Cabe em qualquer lugar, esmaga
            } else if (p.categoria === 'Cartão de mensagem') {
                alt = 0.1; larg = 10; comp = 15;
                fator = 0.0; // Volume zero
            }

            const volume = alt * larg * comp;

            await sequelize.query(`
                UPDATE produtos 
                SET altura = ${alt}, largura = ${larg}, comprimento = ${comp}, volume = ${volume}, fator_empilhamento = ${fator}
                WHERE codigo = ${p.codigo}
            `);
        }

        console.log('Produtos atualizados com dimensões e volumes!');
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await sequelize.close();
    }
}

migrate();
