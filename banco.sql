--
-- PostgreSQL database dump
--

-- Dumped from database version 16.13
-- Dumped by pg_dump version 17.1

-- Started on 2026-06-14 18:02:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16408)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    codigo integer NOT NULL,
    cliente_nome character varying(100) NOT NULL,
    cliente_cpf_cnpj character varying(100) NOT NULL,
    cliente_telefone character varying(15) NOT NULL,
    lista_codigos_produtos character varying(100) NOT NULL,
    preco_total numeric(10,2) NOT NULL,
    entrega_destinatario_nome character varying(100) NOT NULL,
    entrega_destinatario_endereco character varying(200) NOT NULL,
    entrega_data_horario timestamp without time zone NOT NULL,
    data_criacao date NOT NULL,
    mensagem_cartao text,
    frete_opcao character varying(100),
    frete_preco numeric(10,2),
    frete_etiqueta_id character varying(100),
    frete_link_impressao text
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16407)
-- Name: pedidos_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_codigo_seq OWNER TO postgres;

--
-- TOC entry 4797 (class 0 OID 0)
-- Dependencies: 217
-- Name: pedidos_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_codigo_seq OWNED BY public.pedidos.codigo;


--
-- TOC entry 216 (class 1259 OID 16399)
-- Name: produtos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produtos (
    codigo integer NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text NOT NULL,
    quantidade_estoque integer NOT NULL,
    preco numeric(10,2) NOT NULL,
    categoria character varying(30) NOT NULL,
    foto character varying(255),
    altura double precision,
    largura double precision,
    comprimento double precision,
    volume double precision,
    fator_empilhamento double precision
);


ALTER TABLE public.produtos OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16398)
-- Name: produtos_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produtos_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produtos_codigo_seq OWNER TO postgres;

--
-- TOC entry 4798 (class 0 OID 0)
-- Dependencies: 215
-- Name: produtos_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produtos_codigo_seq OWNED BY public.produtos.codigo;


--
-- TOC entry 4640 (class 2604 OID 16411)
-- Name: pedidos codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN codigo SET DEFAULT nextval('public.pedidos_codigo_seq'::regclass);


--
-- TOC entry 4639 (class 2604 OID 16402)
-- Name: produtos codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos ALTER COLUMN codigo SET DEFAULT nextval('public.produtos_codigo_seq'::regclass);


--
-- TOC entry 4791 (class 0 OID 16408)
-- Dependencies: 218
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (codigo, cliente_nome, cliente_cpf_cnpj, cliente_telefone, lista_codigos_produtos, preco_total, entrega_destinatario_nome, entrega_destinatario_endereco, entrega_data_horario, data_criacao, mensagem_cartao, frete_opcao, frete_preco, frete_etiqueta_id, frete_link_impressao) FROM stdin;
1	Ana Beatriz Souza	123.456.789-00	11987654321	1,2,3	149.90	Carlos Souza	Rua das Rosas, 123 - São Paulo - SP	2025-06-10 08:30:00	2025-06-05	\N	\N	\N	\N	\N
2	Ricardo Marques Filho	205.546.285-10	48985664723	1,2,2,3,3	2010.45	Vitória Silva	Av. Bento Gonçalves, 1653 - Porto Alegre - RS	2025-06-24 16:25:00	2025-06-06	\N	\N	\N	\N	\N
3	Cristian Mendonça	101.746.474-34	51971664426	1,2,3	145.90	Marta Santana	Av. Ipiranga, 4272 - Porto Alegre - RS	2025-06-22 20:30:00	2025-06-04	\N	\N	\N	\N	\N
6	fernando	2222	5315151	[1]	35.90	sdaddasd	dsad	2026-05-27 22:54:00	2026-05-12		\N	\N	\N	\N
7	fernando	12346	5315151	[8,13,11,18,15,19,23,21,27,27,27]	228.00	utut	nn	2026-05-13 02:49:00	2026-05-12	julian 	\N	\N	\N	\N
8	Cliente	12456	-	[3,11,20,28]	134.90	gg	gg	2026-05-12 23:58:00	2026-05-12	parabens	\N	\N	\N	\N
9	cliente	00000000000	-	[6,13]	100.68	Joao Silva	CEP: 96400-010 - Rua Principal, 123, Centro, Bage - RS	2026-12-31 03:00:00	2026-05-26		Correios - SEDEX	12.68	\N	\N
10	Julian	01431240052	53999935810	[1,13,13,13,13,13,13,13]	258.31	Julian	CEP: 18021360 - Rua Eliza Sabadin Baccelli, 76, Jardim Rosália Alcolea, Sorocaba - SP	2026-05-26 17:20:00	2026-05-26		Correios - PAC	26.41	a1dfc183-e88c-4d3e-8be3-83a958afeb66	https://sandbox.melhorenvio.com.br/imprimir/mxHbfll9KarY
12	Guilherme Farias	44352138382	53992465858	[7,32,15,17,19,20,24]	107.67	Suzan	CEP: 96415200 - Avenida Padre Abílio Sponchiado, 2159, Estrela D'Alva, Bagé - RS (202)	2026-06-25 03:00:00	2026-06-09	Meu duo no LOL <3	Correios - SEDEX	12.68	\N	\N
13	dasda	161627177171	4151516161	[4]	89.88	1414	CEP: 03977409 - Rua Augustin Luberti, 2314, Fazenda da Juta, São Paulo - SP	2026-06-26 14:11:00	2026-06-09	Meu duo no LOL <3	Correios - SEDEX	54.88	\N	\N
14	julian	01431240052	53999935810	[4]	89.88	JUlian	CEP: 07241150 - Rua Ita, 213, Jardim Ansalca, Guarulhos - SP	2026-06-26 14:11:00	2026-06-09		Correios - SEDEX	54.88	a1fc2e45-e90d-46d8-9e04-2320d3a85640	https://sandbox.melhorenvio.com.br/imprimir/okJ7K3217sV3
\.


--
-- TOC entry 4789 (class 0 OID 16399)
-- Dependencies: 216
-- Data for Name: produtos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produtos (codigo, nome, descricao, quantidade_estoque, preco, categoria, foto, altura, largura, comprimento, volume, fator_empilhamento) FROM stdin;
4	Cesta de Vime Pequena	Cesta rústica ideal para poucos itens.	10	35.00	Cesta	https://mbluefestas.com.br/wp-content/uploads/2021/03/Cesta-Vime-Oval-21x14cm.jpg	10	15	20	3000	1
6	Cesta de Vime Grande	Para presentes generosos e muitos itens.	10	60.00	Cesta	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4EsdDl15o6UXD5B0k4fWCiA3zUnTK4ybGfg&s	15	30	40	18000	1
5	Cesta de Vime Média	Cesta clássica tamanho médio.	10	45.00	Cesta	https://papelariacriativa.com.br/wp-content/uploads/cesta-vime-luxo-redonda-mista-media-35cm-2.jpg	12	20	30	7200	1
8	Caixa MDF Grande	Caixa de madeira MDF grande e sofisticada.	15	40.00	Cesta	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrOS7EDRUjYbl94pumGzeGGrKcStnt_qNyIg&s	15	30	40	18000	1
7	Caixa MDF Pequena	Caixa de madeira elegante pequena.	15	25.00	Cesta	https://dw0jruhdg6fis.cloudfront.net/producao/17178036/G/caixa_mini_chandon_3__lugares_aberta_de_lado_.jpg	10	15	20	3000	1
13	Cerveja Artesanal IPA	Cerveja IPA forte e amarga 500ml.	20	28.00	Bebida	https://storetheme.vtexassets.com/unsafe/800x800/center/middle/https%3A%2F%2Fsantaluzia.vtexassets.com%2Farquivos%2Fids%2F966184%2F1313452.jpg%3Fv%3D637385091060600000	25	7	7	1225	0.9
3	Suco de Maça - Rauch Apfel Mela - Importado da Hungria	Um delicioso suco com o frescor das maças vermelhas maduras, colhidas diretamente do pomar e adicionadas em uma linda garrafa de vidro!	10	39.90	Bebida	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGNCCB8lSKJZNOHE2f1xaGqhNvQrnCioO0Vw&s	20	7	7	980	0.9
2	Chocolates Costanuss importado 200 mg	Chocolate Costanuss ao leite, em barra de 200 mg. Importado do Chile.	43	29.80	Item comestível	https://http2.mlstatic.com/D_NQ_NP_955667-MLB92635012504_092025-O.webp	2	7	15	210	1
9	Vinho Tinto Cabernet	Vinho tinto seco 750ml.	20	85.00	Bebida	https://static.cestasmichelli.com.br/images/product/350521gg.jpg?ims=750x750	30	8	8	1920	0.9
30	Bombom Chocolate Ferrero Rocher	Bombom Chocolate Ferrero Rocher 100g Ferrero Ferrero Rocher oferece uma experiencia de sabor incomparavel de contraste de camadas	22	28.60	Item comestível	https://cdn.awsli.com.br/2500x2500/1030/1030675/produto/40342956/ferrero-1-8nxs9irwrj.png	2	7	15	210	1
12	Suco de Uva Integral	Suco de uva tinto 100% natural 1L.	30	25.00	Bebida	https://www.vinhosevinhos.com/media/catalog/product/cache/f551083cd20de7ac8cf7d25adc91480d/s/u/suco-de-uva-quinta-do-morgado-tinto-1l.jpg	30	8	8	1920	0.9
14	Queijo Brie	Pedaço de queijo Brie macio 200g.	15	45.00	Item comestível	https://zaffari.vtexassets.com/arquivos/ids/257783/1091658-00.jpg?v=638615765363400000	4	10	12	480	0.7
15	Geleia de Morango	Geleia artesanal de morango 250g.	20	22.00	Item comestível	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxerwxr1X3GQfGBucGzXjcoiLpOnERh75GlQ&s	8	6	6	288	0.9
16	Chocolate Amargo 70%	Barra de chocolate amargo premium 100g.	30	18.00	Item comestível	https://images.tcdn.com.br/img/img_prod/1025031/chocolate_amargo_70_cacau_sem_gluten_divine_70g_631_1_8e7a37fc5b09a029623da1bafb4507c8.jpg	2	7	15	210	1
17	Torradas Finas	Pacote de torradas finas para queijos.	25	12.00	Item comestível	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCD0D9uWLmg3xaMHe0M3TMqF9q4tyG3nYzQQ&s	5	10	15	750	1
18	Castanhas Variadas	Mix de castanhas e nozes 150g.	20	35.00	Item comestível	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmHrtCB9L7ay9ZsUICVp7NuLSTczwKuWU5lA&s	3	10	15	450	0.5
19	Laço de Fita Vermelho	Laço de cetim para finalizar a cesta.	50	8.00	Decoração	https://i.pinimg.com/736x/2b/37/03/2b3703af2f5e38f252eabb1055a3e7f7.jpg	2	10	10	200	0.1
21	Saco de Celofane	Embalagem transparente de celofane.	100	5.00	Decoração	https://cdn.awsli.com.br/600x450/2306/2306815/produto/199481943/tmpcelofane7x7-fbfad3cf97.jpg	2	10	10	200	0.1
22	Fita Rústica de Juta	Fita de juta para um visual campestre.	30	10.00	Decoração	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSfICF07F6XUKquy6SGSuilzbEXs9amKof-g&s	2	10	10	200	0.1
23	Papel de Seda Colorido	Papel de seda para o fundo da cesta.	100	3.00	Decoração	https://lummicolors.com.br/wp-content/uploads/2024/08/Papel-seda-colorido-768x1024.jpg	2	10	10	200	0.1
24	Cartão Aniversário	Cartão temático de Feliz Aniversário.	40	5.00	Cartão de mensagem	https://cdn.awsli.com.br/761/761999/produto/80914872f9a0f5b863.jpg	0.1	10	15	15	0
25	Cartão Romântico	Cartão com tema romântico (amor).	30	5.00	Cartão de mensagem	https://images.tcdn.com.br/img/img_prod/1108845/cartao_de_agradecimento_gratidao_kit_com_10_313_1_d3fe8f4a11e5aea80d32eeeb2e091b56.png	0.1	10	15	15	0
26	Cartão Agradecimento	Cartão de Muito Obrigado.	30	5.00	Cartão de mensagem	https://images.tcdn.com.br/img/img_prod/1108845/cartao_de_agradecimento_gratidao_kit_com_10_313_1_d3fe8f4a11e5aea80d32eeeb2e091b56.png	0.1	10	15	15	0
27	Cartão Neutro Clássico	Cartão em branco com capa elegante.	50	4.00	Cartão de mensagem	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVXiUjcefOMvfGXkbdpruj61CBFV3xJW9Blw&s	0.1	10	15	15	0
1	Cesta de acrílico	Cesta transparente com capacidade de 9 litros.	5	35.90	Cesta	https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQ7-nTvCr0BZsCdPzzfzc2e6GeRawOucwge2HyesDn2ull19xngOoiTWE9wFGLvSYX0DRzbDvV2NRZZrDYU7D4pMSRItNSzPalyjBkYhoLOsMDRyL5NL3LZwZaHPMDR-PX9iVR-E4SC&usqp=CAc	12	25	35	10500	1
29	Vinho Branco Santa Carolina Reservado 	Vinho Branco Chileno 750 ml	20	31.90	Bebida	https://casaflora.vtexassets.com/arquivos/ids/158844/V-CHI-S-CAROLINA-RESERVADO-750ML-BC-SVE.png?v=638749784834070000	30	8	8	1920	0.9
10	Espumante Brut	Espumante elegante para celebrações.	15	110.00	Bebida	https://dcdn-us.mitiendanube.com/stores/006/603/077/products/1-53a29d8c9172645bcb17633995798432-1024-1024.webp	30	8	8	1920	0.9
11	Vinho Branco Chardonnay	Vinho branco leve e refrescante.	25	75.00	Bebida	https://cellarvinhos.vtexassets.com/arquivos/ids/160083/Vinho_Branco_Vin_De_France_Chardonnay_2022_FRGBB2202N.jpg?v=638319515160600000	30	8	8	1920	0.9
20	Arranjo de Flores Secas	Pequeno arranjo de flores secas rústicas.	10	15.00	Decoração	https://images.tcdn.com.br/img/img_prod/1203915/garrafa_vintage_com_arranjo_de_flores_secas_209767465_1_c762c3793cb7e593d9278ab2f5a31b17.jpg	2	10	10	200	0.1
28	Cartão Parabéns	Cartão genérico de felicitações.	20	5.00	Cartão de mensagem	https://acdn-us.mitiendanube.com/stores/001/348/819/products/b3317db1c461074635d7237abbf04a32-b7db8890b1f9fea13617254205829416-1024-1024.webp	0.1	10	15	15	0
31	refrigerante coca cola	coca cola 2 litros	40	7.99	Bebida	https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fwww.deliveryfort.com.br%2Frefrigerante-coca-cola-2-litros%2Fp&ved=0CBYQjRxqFwoTCJiLoaD915QDFQAAAAAdAAAAABAF&opi=89978449	\N	\N	\N	\N	\N
32	refrigerante coca cola	coca cola 2 litros	40	7.99	Bebida	https://www.extramercado.com.br/img/uploads/1/277/33334277.png	\N	\N	\N	\N	\N
33	Cesta de papelão	Papelão duro gramatura 10	20	30.00	Cesta	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTj33y4zJO0dCBm6ufTP09jTUGlUnv88zdreg&s	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4799 (class 0 OID 0)
-- Dependencies: 217
-- Name: pedidos_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_codigo_seq', 14, true);


--
-- TOC entry 4800 (class 0 OID 0)
-- Dependencies: 215
-- Name: produtos_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produtos_codigo_seq', 33, true);


--
-- TOC entry 4644 (class 2606 OID 16415)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (codigo);


--
-- TOC entry 4642 (class 2606 OID 16406)
-- Name: produtos produtos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_pkey PRIMARY KEY (codigo);


-- Completed on 2026-06-14 18:02:52

--
-- PostgreSQL database dump complete
--

