// ==UserScript==
// @name         Automação Escolar Manager + Mantis (Pedro Teste QA)
// @namespace    http://tampermonkey.net/
// @version      4.6.10
// @description  Botão flutuante único para gerar Mantis automaticamente a partir do Escolar Manager, com seleção de ambiente, cliente (dropdown pesquisável com multi-seleção e tags removíveis), usuário (dropdown), mensagens de sucesso/erro com botão Reiniciar, instrução CTRL para multi-seleção, tags mais visíveis, e correção de ESLint no moveHandler
// @match        http://hmg-emweb-vm/*
// @match        https://regular.escolarmanageronline.com.br/*
// @match        https://curso.escolarmanageronline.com.br/*
// @match        http://mantis.escolarmanager.kinghost.net/bug_report_page.php*
// @match        https://mantis.escolarmanager.kinghost.net/bug_report_page.php*
// @match        http://srv-hmg-interno*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // --- CSS do popup e botão ---
    GM_addStyle(`
        #mantis-float-btn-userscript {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 99999;
            background: #43a047;
            color: #fff;
            border: 2px solid #fff;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            font-size: 32px;
            font-weight: 600;
            box-shadow: 0 3px 12px rgba(67,160,71,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
        }
        #mantis-float-btn-userscript:hover, #mantis-float-btn-userscript:active, #mantis-float-btn-userscript:focus {
            opacity: 1;
            background: #388e3c;
            transform: scale(1.05);
        }
        #mantis-float-btn-userscript:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        #mantis-popup {
            position: fixed;
            min-width: 220px;
            max-width: 300px;
            background: #fff;
            border-radius: 10px;
            z-index: 100000;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transform: translateY(10px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
        }
        #mantis-popup.mantis-popup-show {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
        #mantis-popup.mantis-popup-hide {
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
        }
        #mantis-popup::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 100%;
            transform: translateY(-50%);
            border: 8px solid transparent;
            border-left-color: #fff;
        }
        #mantis-popup h2 {
            margin: 0 0 12px;
            color: #1976d2;
            font-size: 18px;
            font-weight: 600;
            text-align: center;
        }
        #mantis-popup .mantis-btn {
            width: 100%;
            padding: 10px;
            margin: 6px 0;
            background: linear-gradient(135deg, #1976d2, #42a5f5);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        #mantis-popup .mantis-btn:hover {
            background: linear-gradient(135deg, #1565c0, #1976d2);
        }
        #mantis-popup .mantis-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        #mantis-popup .mantis-close {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #1976d2;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            padding: 4px;
        }
        #mantis-popup .mantis-close:hover {
            color: #d32f2f;
        }
        #mantis-popup .mantis-log {
            color: #2e7d32;
            font-size: 12px;
            margin-top: 8px;
            text-align: center;
            min-height: 16px;
        }
        #mantis-popup .mantis-log.error {
            color: #d32f2f;
        }
        #mantis-popup .mantis-size-control {
            margin: 12px 0 0;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #333;
        }
        #mantis-popup .mantis-size-control label {
            font-size: 13px;
            color: #1976d2;
        }
        #mantis-popup .mantis-size-control input[type=range] {
            width: 100px;
            accent-color: #1976d2;
        }
        #mantis-popup .mantis-environment-section, .mantis-client-section, .mantis-user-section, .mantis-result-section {
            display: none;
            flex-direction: column;
            gap: 10px;
        }
        #mantis-popup .mantis-environment-section.active, .mantis-client-section.active, .mantis-user-section.active, .mantis-result-section.active {
            display: flex;
        }
        #mantis-popup .mantis-environment-select, .mantis-client-select, .mantis-user-select {
            width: 100%;
            padding: 8px;
            border: 1px solid #1976d2;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
            background: #fff;
            cursor: pointer;
        }
        #mantis-popup .mantis-client-search {
            width: 100%;
            padding: 8px;
            border: 1px solid #1976d2;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
        }
        #mantis-popup .mantis-client-instruction {
            font-size: 11px;
            color: #666;
            margin: 4px 0 0;
        }
        #mantis-popup .mantis-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 8px;
        }
        #mantis-popup .mantis-tag {
            background: #42a5f5; /* Lighter blue for better contrast */
            color: #fff; /* White text for visibility */
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        #mantis-popup .mantis-tag-remove {
            cursor: pointer;
            color: #d32f2f;
            font-weight: bold;
            font-size: 14px;
        }
        #mantis-popup .mantis-tag-remove:hover {
            color: #b71c1c;
        }
        #mantis-popup .mantis-confirm-btn {
            width: 100%;
            padding: 10px;
            margin: 6px 0;
            background: linear-gradient(135deg, #2e7d32, #4caf50);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        #mantis-popup .mantis-confirm-btn:hover {
            background: linear-gradient(135deg, #1b5e20, #2e7d32);
        }
        #mantis-popup .mantis-reset-btn {
            width: 100%;
            padding: 10px;
            margin: 6px 0;
            background: linear-gradient(135deg, #1976d2, #42a5f5);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        #mantis-popup .mantis-reset-btn:hover {
            background: linear-gradient(135deg, #1565c0, #1976d2);
        }
    `);

    // --- Função para capturar breadcrumbs e produto ---
    function capturarBreadcrumbs() {
        return new Promise((resolve) => {
            console.log('[Mantis Userscript] Iniciando captura de breadcrumbs...');
            let isCaptureComplete = false;
            let responseData = { erro: null, resumo: "", funcionalidade: "", produto: "" };
            let elapsedTime = 0;
            const timeLimit = 3000;
            const intervalTime = 250;

            function tentarCapturar() {
                let breadcrumbItems = document.querySelectorAll("ol.breadcrumb .breadcrumb-item");
                let iframes = document.getElementsByTagName('iframe');
                if (breadcrumbItems.length === 0 && iframes.length > 0) {
                    for (let iframe of iframes) {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            if (iframeDoc) {
                                breadcrumbItems = iframeDoc.querySelectorAll("ol.breadcrumb .breadcrumb-item");
                                if (breadcrumbItems.length > 0) break;
                            }
                        } catch (e) {
                            console.warn('[Mantis Userscript] Erro ao acessar iframe:', e.message);
                        }
                    }
                }

                if (breadcrumbItems.length > 0) {
                    responseData.resumo = Array.from(breadcrumbItems)
                        .map(item => item.textContent.trim())
                        .join(' => ');
                    let h6 = document.querySelector('h6.m-0.text-primary.text-left');
                    if (!h6 && iframes.length > 0) {
                        for (let iframe of iframes) {
                            try {
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                if (iframeDoc) {
                                    h6 = iframeDoc.querySelector('h6.m-0.text-primary.text-left');
                                    if (h6) break;
                                }
                            } catch (e) {
                                console.warn('[Mantis Userscript] Erro ao acessar h6 em iframe:', e.message);
                            }
                        }
                    }
                    if (h6 && !isCaptureComplete) {
                        responseData.funcionalidade = h6.textContent.trim();
                        // Extrair a primeira palavra do resumo como produto
                        const firstWord = responseData.resumo.split(' => ')[0].trim();
                        // Lista de produtos válidos do select #custom_field_21, com espaços exatos
                        const validProducts = [
                            'Acadêmico Ensino Regular (Desktop) ',
                            ' Acadêmico Ensino Regular (Web) ',
                            ' Acadêmico Curso (Web) ',
                            ' Financeiro (Desktop) ',
                            ' Financeiro (Web) ',
                            ' Portal do Professor ',
                            ' Portal do Professor (NG) ',
                            ' Nota e Cupom Fiscal (Desktop) ',
                            ' Nota e Cupom Fiscal (Web) ',
                            ' Homologação de Boletos (Web) ',
                            ' Homologação de Boletos (Desktop) ',
                            ' Monitor de Acesso (Desktop) ',
                            ' Monitor de Acesso (Web) ',
                            ' Controle de Acesso Catraca (Desktop) ',
                            ' Controle de Acesso Catraca (Web) ',
                            ' Matricula online (Desktop) ',
                            ' Matricula online (Web) ',
                            ' Assinatura Eletronica EM (Desktop) ',
                            ' Assinatura Eletronica EM (Web) ',
                            ' Assinatura Eletronica ClickSign (Desktop) ',
                            ' Assinatura Eletronica ClickSign (Web) ',
                            ' Outros Curso (Web) ',
                            ' Outros Ensino Regular (Web) ',
                            ' Outros (Desktop) ',
                            ' Biblioteca'
                        ];
                        // Normalizar a primeira palavra para comparação
                        const normalizedFirstWord = firstWord.toLowerCase().trim();
                        // Priorizar estritamente opções com "(Web)"
                        let productMatch = validProducts.find(product =>
                            product.toLowerCase().trim().startsWith(normalizedFirstWord) &&
                            product.toLowerCase().trim().endsWith('(web)')
                        );
                        // Se não encontrar (Web), buscar outras opções, exceto (Desktop)
                        if (!productMatch) {
                            productMatch = validProducts.find(product =>
                                product.toLowerCase().trim().startsWith(normalizedFirstWord) &&
                                !product.toLowerCase().trim().endsWith('(desktop)')
                            );
                        }
                        // Último fallback: qualquer opção correspondente ou ' Outros (Desktop) '
                        if (!productMatch) {
                            productMatch = validProducts.find(product =>
                                product.toLowerCase().trim().startsWith(normalizedFirstWord)
                            );
                        }
                        responseData.produto = productMatch || ' Outros (Desktop) ';
                        console.log('[Mantis Userscript] Produto identificado:', responseData.produto);
                        isCaptureComplete = true;
                        console.log('[Mantis Userscript] Captura bem-sucedida - Resumo:', responseData.resumo, 'Funcionalidade:', responseData.funcionalidade, 'Produto:', responseData.produto);
                        resolve(responseData);
                        return true;
                    }
                }
                return false;
            }

            const intervalId = setInterval(() => {
                elapsedTime += intervalTime;
                if (tentarCapturar() || elapsedTime >= timeLimit) {
                    clearInterval(intervalId);
                    if (!isCaptureComplete) {
                        responseData.erro = "Não foi possível identificar o caminho ou o nome da tela.";
                        console.warn('[Mantis Userscript] Exibindo mensagem de erro amigável:', responseData.erro);
                        resolve(responseData);
                    }
                }
            }, intervalTime);

            setTimeout(() => {
                if (intervalId) {
                    clearInterval(intervalId);
                    if (!isCaptureComplete) {
                        responseData.erro = "Não foi possível identificar o caminho ou o nome da tela.";
                        console.warn('[Mantis Userscript] Exibindo mensagem de erro amigável:', responseData.erro);
                        resolve(responseData);
                    }
                }
            }, timeLimit + 1000);
        });
    }

    // --- Função para posicionar o popup ---
    function posicionarPopup(btn, popup) {
        if (!btn || !popup || popup.style.display !== 'block') return;

        const rect = btn.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top + (rect.height / 2) - (popupRect.height / 2);

        if (left + popupRect.width > window.innerWidth - 10) {
            left = rect.left - popupRect.width - 10;
            popup.style.setProperty('--before-left', 'auto');
            popup.style.setProperty('--before-right', '100%');
            popup.style.setProperty('--before-border-left-color', 'transparent');
            popup.style.setProperty('--before-border-right-color', '#fff');
        } else {
            popup.style.setProperty('--before-left', '100%');
            popup.style.setProperty('--before-right', 'auto');
            popup.style.setProperty('--before-border-left-color', '#fff');
            popup.style.setProperty('--before-border-right-color', 'transparent');
        }

        if (top + popupRect.height > window.innerHeight - 10) {
            top = window.innerHeight - popupRect.height - 10;
        }
        if (top < 10) top = 10;

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
    }

    // --- Função para fechar o popup ---
    function fecharPopup() {
        const popup = document.getElementById('mantis-popup');
        if (popup) {
            popup.classList.remove('mantis-popup-show');
            popup.classList.add('mantis-popup-hide');
            setTimeout(() => {
                popup.style.display = 'none';
            }, 200);
        }
        window.removeEventListener('resize', () => posicionarPopup(
            document.getElementById('mantis-float-btn-userscript'),
            document.getElementById('mantis-popup')
        ));
    }

    // --- Função para abrir/fechar popup ---
    function abrirPopup() {
        let popup = document.getElementById('mantis-popup');
        if (popup && popup.style.display === 'block') {
            fecharPopup();
            return;
        }
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'mantis-popup';
            popup.innerHTML = `
                <button class="mantis-close" title="Fechar">×</button>
                <h2>Gerar Mantis</h2>
                <div class="mantis-category-section">
                    <button class="mantis-btn" id="mantis-btn-erro">1 - Erro</button>
                    <button class="mantis-btn" id="mantis-btn-defeito">2 - Defeito</button>
                    <button class="mantis-btn" id="mantis-btn-seguranca">3 - Segurança</button>
                    <button class="mantis-btn" id="mantis-btn-performance">4 - Performance</button>
                    <button class="mantis-btn" id="mantis-btn-usabilidade">5 - Usabilidade</button>
                    <button class="mantis-btn" id="mantis-btn-scripts">6 - Scripts</button>
                    <button class="mantis-btn" id="mantis-btn-outros">7 - Outros</button>
                    <button class="mantis-btn" id="mantis-btn-versao">8 - Versão</button>
                </div>
                <div class="mantis-environment-section">
                    <label for="mantis-environment-select" style="color: #1976d2; font-size: 14px;">Selecione o Ambiente:</label>
                    <select id="mantis-environment-select" class="mantis-environment-select">
                        <option value="1-Produção">1-Produção</option>
                        <option value="2-Homologação(Interna)">2-Homologação(Interna)</option>
                        <option value="3-Homologação(Geral)">3-Homologação(Geral)</option>
                    </select>
                    <button class="mantis-btn" id="mantis-next-to-client">Próximo</button>
                </div>
                <div class="mantis-client-section">
                    <label for="mantis-client-search" style="color: #1976d2; font-size: 14px;">Pesquisar Cliente:</label>
                    <input type="text" id="mantis-client-search" class="mantis-client-search" placeholder="Digite para buscar...">
                    <p class="mantis-client-instruction">Segure CTRL para selecionar múltiplos clientes.</p>
                    <div class="mantis-tags" id="mantis-client-tags"></div>
                    <select id="mantis-client-select" class="mantis-client-select" multiple size="5"></select>
                    <button class="mantis-btn" id="mantis-next-to-user">Próximo</button>
                </div>
                <div class="mantis-user-section">
                    <label for="mantis-user-select" style="color: #1976d2; font-size: 14px;">Atribuir a:</label>
                    <select id="mantis-user-select" class="mantis-user-select"></select>
                    <button class="mantis-confirm-btn" id="mantis-confirm-btn">Confirmar</button>
                </div>
                <div class="mantis-result-section">
                    <div id="mantis-log" class="mantis-log"></div>
                    <button class="mantis-reset-btn" id="mantis-reset-btn">Reiniciar</button>
                </div>
                <div class="mantis-size-control">
                    <label for="mantis-btn-size">Tamanho:</label>
                    <input type="range" id="mantis-btn-size" min="24" max="96" step="2" value="${localStorage.getItem('mantisBtnSize') || 32}">
                </div>
            `;
            document.body.appendChild(popup);

            const closeBtn = popup.querySelector('.mantis-close');
            const categorySection = popup.querySelector('.mantis-category-section');
            const environmentSection = popup.querySelector('.mantis-environment-section');
            const clientSection = popup.querySelector('.mantis-client-section');
            const userSection = popup.querySelector('.mantis-user-section');
            const resultSection = popup.querySelector('.mantis-result-section');
            const environmentSelect = popup.querySelector('#mantis-environment-select');
            const clientSearch = popup.querySelector('#mantis-client-search');
            const clientSelect = popup.querySelector('#mantis-client-select');
            const clientTags = popup.querySelector('#mantis-client-tags');
            const userSelect = popup.querySelector('#mantis-user-select');
            const nextToClientBtn = popup.querySelector('#mantis-next-to-client');
            const nextToUserBtn = popup.querySelector('#mantis-next-to-user');
            const confirmBtn = popup.querySelector('#mantis-confirm-btn');
            const resetBtn = popup.querySelector('#mantis-reset-btn');
            const log = popup.querySelector('#mantis-log');
            const sizeInput = popup.querySelector('#mantis-btn-size');

            let selectedCategoryId = null;
            let selectedCategoryName = null;
            let selectedEnvironment = null;
            let selectedClients = [];
            let selectedUser = null;

            // Lista de clientes
            const validClients = [
                '<Todos Clientes> ',
                ' (DUPLICADO) NÃO USAR ',
                ' ABSOLUTO VESTIBULARES ',
                ' ACADEMICO NEWS  PRÉ VESTIBULAR ',
                ' ALFA INTEGRAL UMUARAMA ',
                ' ARGUMENTO ESPECIFICAS DE REDACAO E LINGUA PORTUGUESA ',
                ' ASSOCIAÇÃO BATATAENSE DE ENSINO ',
                ' ASSOCIAÇÃO ESPAÇO VIDA MAIS AMOR ',
                ' BEATSCHOOL IDIOMAS ',
                ' BERCARIO CONVIVENDO ',
                ' BERCARIO E ESCOLA CRESCER KIDS ',
                ' BERCARIO E ESCOLA LUA DE CRISTAL ',
                ' BERCARIO ESCOLA OBJETIVO DA VIDA ',
                ' BERÇARIO SAGRADA FAMILIA ',
                ' BORA PASSAR ',
                ' CAEL - CENTRO DE ARTES, EDUCACAO E LAZER ',
                ' CANTE CANTINA ',
                ' CANTINHO FELIZ UNIDADE I ',
                ' CANTINHO FELIZ UNIDADE II ',
                ' CASA DE VÓ - ESCOLA BILINGUE ',
                ' CEAD - CENTRO EDUCACIONAL ARRAIAL D´AJUDA ',
                ' CEI - GESU BAMBINO ',
                ' CEMEPAC - CENTRO MUNICIPAL DE ESTUDOS E PROGRAMAS EDUCACIONA ',
                ' CENTRAL KIDS SCHOOL ',
                ' CENTRO CULTURAL SANTA TEREZINHA ',
                ' CENTRO DE EDUCACAO INFANTIL IRMAO JOSE GROSSO ',
                ' CENTRO DE EDUCAÇÃO PIRÂMIDE ',
                ' CENTRO DE ENSINO CAÇA TALENTOS ',
                ' CENTRO DE ENSINO LOGOS ',
                ' CENTRO DE ENSINO LOGOS - UNIDADE II ',
                ' CENTRO DE ENSINO LOGOS - UNIDADE III ',
                ' CENTRO DE ESTUDO APRENDER ',
                ' CENTRO EDUCACIONAL CASINHA FELIZ ',
                ' CENTRO EDUCACIONAL CORA CORALINA ',
                ' CENTRO EDUCACIONAL CRISTÃO (CEDUC) ',
                ' CENTRO EDUCACIONAL DA CRIANÇA ',
                ' CENTRO EDUCACIONAL FUTURA ',
                ' CENTRO EDUCACIONAL INITIUM ',
                ' CENTRO EDUCACIONAL LONI EMMENDOERFER ',
                ' CENTRO EDUCACIONAL MONTEIRO LOBATO - SANTA HELENA ',
                ' CENTRO EDUCACIONAL OBJETIVO PEDREIRA ',
                ' CENTRO EDUCACIONAL OMNI ',
                ' CENTRO EDUCACIONAL OXIGENIOS ',
                ' CENTRO EDUCACIONAL PRIMAVERA ',
                ' CENTRO EDUCACIONAL PRISCILA DA MATA - CEPMA ',
                ' CENTRO EDUCACIONAL QUASAR ',
                ' CENTRO EDUCACIONAL QUIRINO ',
                ' CENTRO EDUCACIONAL SABER SUPREMO ',
                ' CENTRO EDUCACIONAL SAGRADA FAMILIA SOBRADINHO ',
                ' CENTRO EDUCACIONAL SANMARTIN PEREZ (CESP) ',
                ' CENTRO EDUCACIONAL SANTA MARIA ROSA MOLAS ',
                ' CENTRO EDUCACIONAL TERRA ',
                ' CENTRO OLIMPICO DE ENSINO ',
                ' CEPMP - CENTRO EDUCACIONAL PRESBITERIANO MARGARIDA PITTMAN ',
                ' CLINICA PÓS SAÚDE ',
                ' COEPS - COLEGIO EVANGELICO PRINCIPIO DA SABEDORIA ',
                ' COLÉGIO ACADEMIA ',
                ' COLÉGIO ADONAI ',
                ' COLEGIO AGNUS ',
                ' COLÉGIO AGNUS DEI UNIDADE SÃO JOSÉ ',
                ' COLÉGIO AGNUS DEI UNIDADE TRÊS CORAÇÕES ',
                ' COLÉGIO ALIANCA ',
                ' COLÉGIO ALIANÇA MG ',
                ' COLEGIO ALPHA+ (COC SETOR NORTE) ',
                ' COLÉGIO ANGLO DE CAMPINAS ',
                ' COLEGIO ANGLO VARGEM GRANDE PAULISTA ',
                ' COLÉGIO ANHANGUERA ',
                ' COLÉGIO ÁPICE - RIO VERDE ',
                ' COLÉGIO ÁPICE - SOROCABA ',
                ' COLÉGIO APROVAÇÃO GÊNIO ',
                ' COLEGIO APROVADO ',
                ' COLÉGIO APROVADO - RIO DAS OSTRAS ',
                ' COLÉGIO ARCA MATÃO ',
                ' COLÉGIO ARTE E VIDA ',
                ' COLEGIO ATHLETICS CENTER ',
                ' COLÉGIO ATHOS - RIO VERDE ',
                ' COLÉGIO ATLANTA ',
                ' COLÉGIO ATLÂNTICO ',
                ' COLÉGIO ATLÂNTICO - MACAÉ ',
                ' COLÉGIO ÁTRIO ',
                ' COLÉGIO BALUARTE ',
                ' COLÉGIO BETÂNIA ',
                ' COLEGIO BOAS NOVAS ',
                ' COLÉGIO BURITI ',
                ' COLEGIO CAMINHO DE GÊNIOS ',
                ' COLEGIO CAMPO BELO ',
                ' COLÉGIO CEDUC ',
                ' COLÉGIO CEM - MONTIVIDIU ',
                ' COLÉGIO CEMAN ',
                ' COLEGIO CEO ',
                ' COLÉGIO CONVÍVIO ',
                ' COLEGIO COPBH ',
                ' COLEGIO CORAÇÃO DE MARIA - GOIANIA ',
                ' COLÉGIO CORTEX ',
                ' COLÉGIO CULTURA ',
                ' COLÉGIO DECISÃO - GOIANÉSIA ',
                ' COLÉGIO DELOS ',
                ' COLÉGIO DELTA JARDIM GOIÁS ',
                ' COLÉGIO DESAFIO - UNIDADE I ',
                ' COLÉGIO DESAFIO - UNIDADE II ',
                ' COLÉGIO DINÂMICO JATAI ',
                ' COLÉGIO DINÂMICO PIRES DO RIO ',
                ' COLÉGIO DIOCESANO SAGRADA FAMÍLIA ',
                ' COLÉGIO DJ ',
                ' COLÉGIO DOMÍNIO ',
                ' COLÉGIO DROMOS ',
                ' COLEGIO DRUMMOND - GOIATUBA ',
                ' COLÉGIO E CURSO M3 - UNIDADE SÃO GONÇALO ',
                ' COLEGIO EINSTEIN ',
                ' COLÉGIO EL SHADAY (PALMEIRAS DE GOIAS-GO) ',
                ' COLÉGIO ESPÍRITA PROFESSOR RUBENS COSTA ROMANELLI ',
                ' COLEGIO ESSENCIA CRISTA ',
                ' COLEGIO ETICA SÃO CARLOS ',
                ' COLÉGIO EXATO ',
                ' COLÉGIO EXCELSO ',
                ' COLÉGIO EXECUTIVO ',
                ' COLÉGIO ÊXITO ',
                ' COLÉGIO EXPRESSÃO ',
                ' COLÉGIO EXPRESSÃO JÚNIOR ',
                ' COLÉGIO EXPRESSIVO ',
                ' COLÉGIO EXTERNATO SÃO JOSÉ ',
                ' COLÉGIO FAMÍLIA DE NAZARÉ ',
                ' COLÉGIO FLORESTA - UNIDADE FLAMBOYANT ',
                ' COLÉGIO FLORESTA - UNIDADE SENADOR CANEDO ',
                ' COLEGIO FONSECA SIQUEIRA ',
                ' COLEGIO FORTE RIO BRANCO ',
                ' COLÉGIO FRACTAL ',
                ' COLÉGIO GÁLATAS ',
                ' COLÉGIO GALLE ',
                ' COLEGIO GERAR ',
                ' COLÉGIO GOYASES ',
                ' COLEGIO GRADUAL - CERQUILHO ',
                ' COLEGIO GRADUAL - JUNIOR ',
                ' COLEGIO GRADUAL - TIETÊ ',
                ' COLÉGIO GUILHERME DUMONT VILLARES - GDV ',
                ' COLÉGIO HORIZONTE ASA SUL ',
                ' COLÉGIO IMACULADA CONCEIÇÃO - ANÁPOLIS ',
                ' COLÉGIO IMACULADA CONCEIÇÃO (CERES) ',
                ' COLEGIO IMIGRANTE LUIGI BERTAZZONI ',
                ' COLEGIO INOVA COLEGIO INOVA CAMINHOS DOURADOS ',
                ' COLÉGIO INTEGRAÇÃO - SÃO JOSÉ DO RIO PRETO ',
                ' COLÉGIO INTEGRAÇÃO - SP ',
                ' COLÉGIO INTEGRADO AMPARO ',
                ' COLEGIO INTEGRADO SONIA MARCONDES ',
                ' COLÉGIO INTER EDUC ',
                ' COLÉGIO INTERAÇÃO DE MARILIA ',
                ' COLEGIO INTERATIVA - GO ',
                ' COLEGIO INTERATIVA FOZ DO IGUAÇU ',
                ' COLEGIO INVICTOS ',
                ' COLÉGIO IPÊ - INSTITUTO PRESBITERIANO DE EDUCAÇÃO ',
                ' COLÉGIO ISAAC NEWTON CUIABÁ - MT ',
                ' COLÉGIO JEAN PIAGET RIBEIRÃO PIRES ',
                ' COLÉGIO JUNQUEIRA ',
                ' COLEGIO LEPANTO ',
                ' COLÉGIO LICEU ',
                ' COLÉGIO LICEU - GUARÁ ',
                ' COLEGIO LICEU BARRETOS ',
                ' COLÉGIO LICEU OLÍMPIA ',
                ' COLÉGIO LOGOSÓFICO - GO ',
                ' COLEGIO LUMINAR ',
                ' COLÉGIO M3 - UNIDADE ALCANTARA ',
                ' COLÉGIO MÃE ADMIRÁVEL ',
                ' COLEGIO MAGNUS ',
                ' COLÉGIO MARIA IMACULADA - GOIANÉSIA ',
                ' COLÉGIO MAXIMUS (CANTINHO ENCANTADO) ',
                ' COLÉGIO MEDICINA ',
                ' COLÉGIO MEGA - RIO VERDE ',
                ' COLÉGIO META E FACULDADE UNOPAR ',
                ' COLÉGIO MILLENIUM CURSOS ',
                ' COLÉGIO MONTE CALVÁRIO - MG ',
                ' COLEGIO MONTEIRO LOBATO ITAPURANGA ',
                ' COLÉGIO MORAES RÊGO ',
                ' COLÉGIO MUNDIAL ',
                ' COLEGIO MUNDO EM ACAO ',
                ' COLÉGIO MV ',
                ' COLÉGIO NEXUS ',
                ' COLÉGIO NOVO MILÊNIO ',
                ' COLÉGIO OBJETIVO - VALPARAISO ',
                ' COLÉGIO OLIVEIRA ',
                ' COLÉGIO ÔMEGA ',
                ' COLÉGIO ÓRION ',
                ' COLEGIO PAULO FREIRE - GUARULHOS ',
                ' COLÉGIO PITÁGORAS PAULINIA ',
                ' COLÉGIO PREMIUM ',
                ' COLÉGIO PREMIUM BOULEVARD ',
                ' COLEGIO PRESBITERIANO DE SETE LAGOAS ',
                ' COLÉGIO PREVEST ',
                ' COLÉGIO PRINCÍPIOS ',
                ' COLÉGIO PROFESSORA YOLANDA ',
                ' COLÉGIO PROSPERAR ',
                ' COLÉGIO PROTÁGORAS - RIO VERDE ',
                ' COLÉGIO PROTÁGORAS - SETOR BUENO ',
                ' COLÉGIO PROTÁGORAS - SETOR MARISTA ',
                ' COLÉGIO RECANTO DO SABER ',
                ' COLÉGIO RIO BRANCO OBJETIVO ',
                ' COLEGIO RUDOLF STEINER DE MINAS GERAIS ',
                ' COLÉGIO RUI BARBOSA - JANDIRA ',
                ' COLÉGIO RUTHERFORD ',
                ' COLÉGIO SANTA INÊS ',
                ' COLÉGIO SANTA ROSA ',
                ' COLÉGIO SANTA VIRGÍNIA ',
                ' COLÉGIO SÃO JORGE ',
                ' COLÉGIO SÃO JUDAS TADEU ',
                ' COLÉGIO SEAL ',
                ' COLEGIO SEG ',
                ' COLÉGIO SEMEAR ',
                ' COLÉGIO SERIOS ',
                ' COLÉGIO SISTEMA OBJETIVO ',
                ' COLEGIO SULDAMÉRICA ',
                ' COLEGIO TRINUS ',
                ' COLEGIO UNIAO ',
                ' COLEGIO UNICALDAS DISNEY ',
                ' COLÉGIO UNIVERSITÁRIO ',
                ' COLÉGIO UNIVERSO ',
                ' COLÉGIO UNUS KIDS ',
                ' COLEGIO VENCER CAPELINHA ',
                ' COLÉGIO VERATZ ',
                ' COLÉGIO VICARE ',
                ' COLEGIO VISÃO ',
                ' COLÉGIO VISÃO CURY - DF/FORMOSA ',
                ' COLÉGIO VITÓRIA ',
                ' COLÉGIO VITÓRIA RÉGIA ',
                ' COLEGIO WALDORF MICAEL DE SAO PAULO ',
                ' COLÉGIO WR ',
                ' COLÉGIO WRJ ',
                ' COLÉGIO ZENITE - INHUMAS ',
                ' COLINHO DA DINDA ',
                ' CONVIVER BABY ',
                ' COOPEN - COOPERATIVA ENSINO RIO VERDE ',
                ' CORTEX VESTIBULAR ',
                ' CRESCER-ESCOLA GENTE MIUDA (ANÁPOLIS) ',
                ' CULTURA INGLESA MS ',
                ' CURSO PREPARATÓRIO GUERREIROS ',
                ' CURSO PROTÁGORAS ',
                ' CURSOS CEJAN ',
                ' DINAMICO PRE-VESTIBULAR ',
                ' E MED PRÉ-VESTIBULAR ',
                ' EDUCANDARIO DOM HELDER PESSOA CAMARA ',
                ' EDUCANDÁRIO EVANGÉLICO EBENÉZER ',
                ' EDUCANDÁRIO MENTES BRILHANTES ',
                ' EDUCANDÁRIO NASCENTES DO ARAGUAIA ',
                ' EDUCANDÁRIO NOSSA SENHORA DO ROSÁRIO ',
                ' EDUCANDARIO SANTA MARIA GORETTI ',
                ' EDUCANDÁRIO SANTA MARIA GORETTI - E.S.M.G ',
                ' EDUCANDARIO SANTO ANTONIO DE BEBEDOURO ',
                ' EIPG - ESCOLA INTERNACIONAL PREPARANDO GERACOES ',
                ' EJ - ESCOLA SUPERIOR DE AVIAÇÃO CIVIL ',
                ' ESCOLA  EVANGELICA SHEKINÁ ',
                ' ESCOLA ACALENTO ',
                ' ESCOLA ALDEIA ',
                ' ESCOLA ALLAN KARDEC ',
                ' ESCOLA AMERICANA ',
                ' ESCOLA AMOR PERFEITO ',
                ' ESCOLA ANA LÚ ',
                ' ESCOLA APOENA ',
                ' ESCOLA ARCO IRIS E COLEGIO RAZÃO ',
                ' ESCOLA ATHOS ',
                ' ESCOLA ATOS ',
                ' ESCOLA ATOS - PONTALINA ',
                ' ESCOLA ATOS - UNIDADE APARECIDA DE GOIÂNIA ',
                ' ESCOLA ATOS - UNIDADE FIRMINÓPOLIS ',
                ' ESCOLA AURORA ',
                ' ESCOLA BALÃO MÁGICO ',
                ' ESCOLA BALAO VERMELHO ALICERCE ',
                ' ESCOLA BILBOQUÊ - UNIDADE BURITIS ',
                ' ESCOLA BILBOQUÊ - UNIDADE GUTIERREZ ',
                ' ESCOLA BILBOQUÊ - UNIDADE VILA DA SERRA ',
                ' ESCOLA BIOCLASS TURMA DA MONICA ',
                ' ESCOLA BRINCANDO E APRENDENDO (CEABA) ',
                ' ESCOLA BRINCARTE ',
                ' ESCOLA BRISA DO SABER ',
                ' ESCOLA CAMINHOS BRILHANTES ',
                ' ESCOLA CANTINHO CRISTÃO ',
                ' ESCOLA CASA DAS LETRAS ',
                ' ESCOLA CASTRO ALVES ',
                ' ESCOLA CELESTIN FREINET ',
                ' ESCOLA CIESB-CENTRO INTERN. EVANGELICO SUICO BRASILEIRO ',
                ' ESCOLA CLUBE DA CRIANÇA ',
                ' ESCOLA CODIGO KID - ELDORADO ',
                ' ESCOLA CORRE COTIA - UNID I ',
                ' ESCOLA CORRE COTIA - UNID II ',
                ' ESCOLA CREDENCIAL DO FUTURO ',
                ' ESCOLA CRESCER - SETOR BUENO ',
                ' ESCOLA CRIANCA E COMPANHIA ',
                ' ESCOLA CRISTÃ CRESCER E APRENDER ',
                ' ESCOLA CRISTA ESPACO CRIATIVO ',
                ' ESCOLA CRISTÃ JAIME ROSE ',
                ' ESCOLA CULTURA ARTE E CIDADANIA ',
                ' ESCOLA DA IGREJA DE DEUS NO BRASIL ',
                ' ESCOLA DE EDUCACAO INFANTIL BILINGUE STEP BY STEP ',
                ' ESCOLA DE ENFERMAGEM SAUDE E VIDA ',
                ' ESCOLA DE VALENTES - MINISTERIO FILANTROPICO TERRA FERTIL ',
                ' ESCOLA DENGOSO ',
                ' ESCOLA DINÂMICA 13 DE MAIO ',
                ' ESCOLA DOCE INFÂNCIA ',
                ' ESCOLA EDUCANDÁRIO VILA BOA ',
                ' ESCOLA ESPAÇO DA HARMONIA ',
                ' ESCOLA ESPAÇO LIVRE (BEBEDOURO-SP) ',
                ' ESCOLA ESTRELINHAS DO FUTURO ',
                ' ESCOLA ETHOS ',
                ' ESCOLA EVANGÉLICA LAGO DOS CISNES ',
                ' ESCOLA EVANGÉLICA PRESBITERIANA DE PORANGATU ',
                ' ESCOLA EVANGÉLICA PRINCÍPIO DA SABEDORIA I ',
                ' ESCOLA EVANGÉLICA RENASCER ',
                ' ESCOLA EXPOENTE EDUCACIONAL (ANTIGO URSINHO PIMPÃO) ',
                ' ESCOLA FONTE DO SABER ',
                ' ESCOLA FUNDAMENTAL ALVACIR VITE ROSSI ',
                ' ESCOLA GERACAO ELEITA ',
                ' ESCOLA GRAUS DO FUTURO ',
                ' ESCOLA IMACULADA ',
                ' ESCOLA IMAGINAR ',
                ' ESCOLA INFANTIL ALGODÃO DOCE ',
                ' ESCOLA INFANTIL BALÃO AZUL (COLÉGIO PROJEÇÃO) ',
                ' ESCOLA INFANTIL BALÃO AZUL II ',
                ' ESCOLA INFANTIL GENTE MIUDA ',
                ' ESCOLA INFANTIL LETRAS DOURADAS ',
                ' ESCOLA INFANTIL MUNDO MÁGICO ',
                ' ESCOLA INFANTIL PINGUINHO DE GENTE ',
                ' ESCOLA INFANTIL PRIMEIROS PASSOS ',
                ' ESCOLA INFANTIL RECREIO ',
                ' ESCOLA INFANTIL RECREIO + - UNIDADE II ',
                ' ESCOLA INOVAÇÃO ',
                ' ESCOLA INTERAÇÃO ',
                ' ESCOLA INTERAMERICA  FUNDAMENTAL- UNID. JD AMERICA ',
                ' ESCOLA INTERATIVA - CURITIBA SANTA CÂNDIDA ',
                ' ESCOLA INTERATIVA - CURITIBA UNID COLOMBO ',
                ' ESCOLA INTERATIVA ( COOPEG ) - UNIDADE CENTRO ',
                ' ESCOLA INTERATIVA ( COOPEG ) - UNIDADE II NOVA FLORESTA ',
                ' ESCOLA INTERNACIONAL NOVA GERAÇÃO- EING ',
                ' ESCOLA IOLANDA TONIAZZO PETRY ',
                ' ESCOLA LIDER ',
                ' ESCOLA LUZ DO SABER ',
                ' ESCOLA MAF ',
                ' ESCOLA MODULUS ',
                ' ESCOLA MONSENHOR ',
                ' ESCOLA MONTEIRO LOBATO - RJ ',
                ' ESCOLA MONTEIRO LOBATO JD. PRESIDENTE ',
                ' ESCOLA NATUS ',
                ' ESCOLA NUVEM ',
                ' ESCOLA O PEIXINHO ',
                ' ESCOLA O PEQUENO APRENDIZ ',
                ' ESCOLA O SONHO DE TALITA ',
                ' ESCOLA OBJETIVA ',
                ' ESCOLA PAULISTA DE EDUCACAO BASICA ',
                ' ESCOLA PEQUENO PRÍNCIPE E COLÉGIO ÊXITO - JATAI ',
                ' ESCOLA PINGO DE GENTE - OBJETIVO FRANCO ',
                ' ESCOLA PINGUINHO DE GENTE E ESCOLA EDUCAR ',
                ' ESCOLA PIRILAMPO ',
                ' ESCOLA PLANETA AZUL - CEDUNI ',
                ' ESCOLA PRESBITERIANA DO GAMA ',
                ' ESCOLA PRESBITERIANA ERASMO BRAGA ',
                ' ESCOLA PROF. SILVIA BUENO ',
                ' ESCOLA PROFESSOR JAYME DE SOUZA MARTINS ',
                ' ESCOLA PROFESSORA NILVA ',
                ' ESCOLA PROJETO 21 ',
                ' ESCOLA RAIO DE SOL ',
                ' ESCOLA RODA VIVA ',
                ' ESCOLA ROSAMARQUES ',
                ' ESCOLA SABEDORIA JUNIOR ',
                ' ESCOLA SAGRADA FAMÍLIA ',
                ' ESCOLA SAGRADA FAMILIA - PARQUE AMAZÔNIA ',
                ' ESCOLA SANTA EDWIGES ',
                ' ESCOLA SAO JORGE - PR ',
                ' ESCOLA SÃO TOMAZ DE AQUINO ',
                ' ESCOLA SEMEAR - BARREIRAS ',
                ' ESCOLA SEMEAR - BARREIRAS - UNID 3 ',
                ' ESCOLA SEMEAR - BARREIRAS UNID 2 ',
                ' ESCOLA SEMENTINHA DO SABER ',
                ' ESCOLA SHALOM ',
                ' ESCOLA TÉCNICA ROBERTO ROCA ',
                ' ESCOLA TIA LUCY ',
                ' ESCOLA TRENZINHO ENCANTADO ',
                ' ESCOLA VIDA E LUZ ',
                ' ESCOLA VILA LUME ',
                ' ESCOLA VIVANT ',
                ' ESCOLA WALDORF MOARA ',
                ' ESCOLA WALDORF SÃO PAULO ',
                ' ESCOLINHA DA MONICA ',
                ' ESCOLINHA MUNDO MAGICO DO SABER ',
                ' ESPAÇO EDUCACIONAL MAURO JOSE DA SILVA ',
                ' ESPAÇO EDUCATIVO MAFRA ',
                ' ESPAÇO EDUCATIVO MAFRA UNID II ',
                ' EXPOCURSOS UNID. BURITI (COLÉGIO UNUS) ',
                ' EXPOVEST JUNIOR ',
                ' FACESB - FACULDADE DE SAUDE CIENCIAS E TECNOLOGIA ',
                ' FACULDADE ALMEIDA RODRIGUES - FAR ',
                ' FACULDADE FRACTAL ',
                ' FAIT IDIOMAS ',
                ' FALCO GESTÃO (ANTIGO CEI) ',
                ' GAUSS CENTRO DE ESTUDOS ',
                ' GRUPO META - CENTRO EDUCACIONAL FLAMBOYANT ',
                ' IDEIA ENSINO FUNDAMENTAL ',
                ' IESA INSTITUTO EDUCACIONAL SARAMENHA LTDA ',
                ' IET - INSTITUTO EDUCACIONAL DE TIANGUÁ ',
                ' IFITEG - INSTITUTO DE FILOSOFIA E TEOLOGIA DE GOIÁS ',
                ' IGE - INSTITUTO GOIANO DE ENSINO ',
                ' INSTITUTO DATA BRASIL- GUARULHOS ',
                ' INSTITUTO DE FILOSOFIA E TEOLOGIA SANTA CRUZ ',
                ' INSTITUTO EDUCACIONAL LONDRINA ',
                ' INSTITUTO EDUCACIONAL MAYRINK VIEIRA ',
                ' INSTITUTO EXTREMAMENTE ',
                ' INSTITUTO FENIX DE HUMANIZAÇÃO E CULTURA ',
                ' INSTITUTO FLORENCE ',
                ' INSTITUTO GALILEU DE ENSINO (COLÉGIO GALILEU) ',
                ' INSTITUTO INTERAMÉRICA ',
                ' INSTITUTO LE PETIT ',
                ' INTEGRAL CURSOS ',
                ' INTEGRAL ITAJAÍ ',
                ' INTERSCHOOL BRASIL - ESCOLA INTERNACIONAL DE GOIANIA ',
                ' IPETEC - INSTITUTO PEDAGOGICO TEREZA CRISTINA ',
                ' ISTA - INSTITUTO SANTO TOMAZ DE AQUINO ',
                ' ISTMJ - INSTITUTO SANTA TERESINHA DO MENINO JESUS - GO ',
                ' JARDIM ESCOLA CHAPEUZINHO VERMELHO ',
                ' KINGS SCHOOL ',
                ' KYRIOS SISTEMA DE ENSINO ',
                ' LAPIS DE COR ',
                ' MAG EDUCACIONAL ',
                ' MATEMATICA BROW ',
                ' NÚCLEO CENTRO DE ENSINO ',
                ' ORIENTAR CENTRO EDUCACIONAL ',
                ' PEQUENINOS ESPACO RECREATIVO ',
                ' PLANETA EDUCAR ',
                ' PREPARA ENEM ',
                ' REDE DE ENSINO CERTO ',
                ' RGS EMPREENDIMENTOS EDUCACIONAIS ',
                ' SISTEMA APOIO ',
                ' SISTEMA DE ENSINO UNIVERSO VILA - UNIDADE BARCARENA ',
                ' SMART BABY BERCARIO E EDUCAÇÃO INFANTIL ',
                ' SOCIEDADE EDUCACIONAL GOYAZES - UNIDADE CALDAS NOVAS ',
                ' SOCIEDADE EDUCACIONAL GOYAZES - UNIDADE MORRINHOS ',
                ' SOCIEDADE EDUCACIONAL GOYAZES - UNIDADE PONTALINA ',
                ' ST NICHOLAS SCHOOL ',
                ' STATERA CURSOS E VESTIBULARES ',
                ' SUPERVISÃO DE SUPORTE TERABYTE ',
                ' SUPORTE EM1 - TO CHEGANDO ',
                ' TERABYTE BIBLIOTECA ',
                ' THINK GLOBAL SCHOOL ',
                ' TIGRINHOS DO VILA ',
                ' UNIALFA - COLEGIO ALVES FARIA ',
                ' ÚNICO EDUCACIONAL - TAGUATINGA (DESATIVADO) ',
                ' ÚNICO EDUCACIONAL DF ',
                ' UP EDUCAÇÃO ',
                ' VERSA PRÉ VESTIBULARES - TAGUATINGA ',
                ' VERSA PRE-VESTIBULARES ',
                ' VERUM VESTIBULARES ',
                ' VETOR PRE-VESTIBULAR ',
                ' VILLA GALILEU ',
                ' WINSFORD GLOBAL EDUCATION'
            ];

            // Lista de usuários
            const validUsers = [
                { value: '0', text: '' },
                { value: '193', text: 'advair.oliveira' },
                { value: '45', text: 'agmar.santana' },
                { value: '304', text: 'augusto.fidelis' },
                { value: '70', text: 'backlog' },
                { value: '310', text: 'breno.melo' },
                { value: '330', text: 'brunno.santos' },
                { value: '239', text: 'claudio.santos' },
                { value: '3', text: 'Cristiano' },
                { value: '63', text: 'daniel.SILVA' },
                { value: '307', text: 'davi.lima' },
                { value: '311', text: 'david.oliveira' },
                { value: '316', text: 'diego.silva' },
                { value: '236', text: 'diogo.vicente' },
                { value: '2', text: 'Edher' },
                { value: '315', text: 'edielson.gomes' },
                { value: '185', text: 'eduardo.viana' },
                { value: '211', text: 'felipe.gomes' },
                { value: '26', text: 'felipe.nogueira' },
                { value: '314', text: 'fellype.alexandre' },
                { value: '286', text: 'fernando.domingues' },
                { value: '331', text: 'fernando.PEREIRA' },
                { value: '189', text: 'flavio.manzi' },
                { value: '329', text: 'frederico.sebba' },
                { value: '323', text: 'gabriel.alexandrino' },
                { value: '246', text: 'gabriel.lemes' },
                { value: '253', text: 'geferson.santos' },
                { value: '24', text: 'gilmar' },
                { value: '254', text: 'gustavo.ARAUJO' },
                { value: '298', text: 'gustavo.AVILA' },
                { value: '158', text: 'gustavo.GUIMARAES' },
                { value: '257', text: 'homologacao.qa' },
                { value: '249', text: 'hugo.santos' },
                { value: '220', text: 'jader.amorim' },
                { value: '207', text: 'Joao.Daniel' },
                { value: '194', text: 'joao.LOPES' },
                { value: '285', text: 'jose.santos' },
                { value: '123', text: 'klayton.machado' },
                { value: '326', text: 'leandro.neves' },
                { value: '122', text: 'leonardo.santana' },
                { value: '290', text: 'luan.silva' },
                { value: '248', text: 'lucas.gabriel' },
                { value: '327', text: 'lucas.silva' },
                { value: '332', text: 'luiz.gustavo' },
                { value: '267', text: 'marcos.alcantara' },
                { value: '317', text: 'maria.clara' },
                { value: '306', text: 'maria.eduarda' },
                { value: '321', text: 'mariana.cruvinel' },
                { value: '297', text: 'matheus.sousa' },
                { value: '210', text: 'mauro.junior' },
                { value: '291', text: 'pedro.alves' },
                { value: '231', text: 'pedro.augusto' },
                { value: '176', text: 'pedro.henrique' },
                { value: '202', text: 'rafael.RIBEIRO' },
                { value: '224', text: 'revisao.codigo' },
                { value: '322', text: 'rhuan.silva' },
                { value: '320', text: 'rogerio.silva' },
                { value: '244', text: 'rubevaldo.oliveira' },
                { value: '266', text: 'smart.hmg' },
                { value: '65', text: 'suporte.avancado' },
                { value: '258', text: 'thiago.sa' },
                { value: '294', text: 'versao.homologacao' },
                { value: '255', text: 'vinicius.carvalho' },
                { value: '299', text: 'vinicius.torres' },
                { value: '164', text: 'vitor.HENRIQUE' },
                { value: '293', text: 'weslei.alves' },
                { value: '271', text: 'willyan.veloso' },
                { value: '197', text: 'wilson.souza' },
                { value: '282', text: 'yan.teixeira' }
            ];

            // Preencher o select de clientes
            function populateClientSelect(searchTerm = '') {
                clientSelect.innerHTML = '';
                const filteredClients = validClients.filter(client =>
                    client.trim().toLowerCase().includes(searchTerm.toLowerCase())
                );
                filteredClients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client;
                    option.textContent = client.trim();
                    if (selectedClients.includes(client)) {
                        option.selected = true;
                    }
                    clientSelect.appendChild(option);
                });
            }

            // Atualizar as tags de clientes selecionados
            function updateClientTags() {
                clientTags.innerHTML = '';
                selectedClients.forEach(client => {
                    const tag = document.createElement('div');
                    tag.className = 'mantis-tag';
                    tag.innerHTML = `
                        <span>${client.trim()}</span>
                        <span class="mantis-tag-remove" data-client="${client}">×</span>
                    `;
                    clientTags.appendChild(tag);
                    const removeBtn = tag.querySelector('.mantis-tag-remove');
                    removeBtn.addEventListener('click', () => {
                        selectedClients = selectedClients.filter(c => c !== client);
                        updateClientTags();
                        populateClientSelect(clientSearch.value);
                    });
                });
            }

            // Inicializar o select de clientes
            populateClientSelect();

            // Filtrar clientes ao digitar
            clientSearch.addEventListener('input', () => {
                populateClientSelect(clientSearch.value);
            });

            // Atualizar seleções ao mudar o select
            clientSelect.addEventListener('change', () => {
                selectedClients = Array.from(clientSelect.selectedOptions).map(opt => opt.value);
                updateClientTags();
            });

            // Preencher o select de usuários
            validUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.value;
                option.textContent = user.text || 'Nenhum';
                userSelect.appendChild(option);
            });

            // Função para resetar o popup
            function resetPopup() {
                selectedCategoryId = null;
                selectedCategoryName = null;
                selectedEnvironment = null;
                selectedClients = [];
                selectedUser = null;
                log.textContent = '';
                log.classList.remove('error');
                categorySection.style.display = 'block';
                environmentSection.classList.remove('active');
                clientSection.classList.remove('active');
                userSection.classList.remove('active');
                resultSection.classList.remove('active');
                updateClientTags();
                populateClientSelect();
                environmentSelect.value = '';
                userSelect.value = '0';
            }

            closeBtn.onclick = fecharPopup;

            // Configura os botões de categoria
            popup.querySelectorAll('.mantis-btn').forEach(btn => {
                btn.onclick = () => {
                    selectedCategoryId = btn.id.replace('mantis-btn-', '');
                    selectedCategoryName = btn.textContent;
                    selectedCategoryId = {
                        'erro': 37,
                        'defeito': 38,
                        'seguranca': 33,
                        'performance': 43,
                        'usabilidade': 113,
                        'scripts': 34,
                        'outros': 116,
                        'versao': 170
                    }[selectedCategoryId];
                    categorySection.style.display = 'none';
                    environmentSection.classList.add('active');
                    log.textContent = 'Selecione o ambiente...';
                    log.classList.remove('error');
                };
            });

            // Configura o botão "Próximo" para cliente
            nextToClientBtn.onclick = () => {
                selectedEnvironment = environmentSelect.value;
                if (selectedEnvironment) {
                    environmentSection.classList.remove('active');
                    clientSection.classList.add('active');
                    log.textContent = 'Selecione os clientes...';
                    log.classList.remove('error');
                } else {
                    log.textContent = 'Por favor, selecione um ambiente.';
                    log.classList.add('error');
                }
            };

            // Configura o botão "Próximo" para usuário
            nextToUserBtn.onclick = () => {
                if (selectedClients.length > 0) {
                    clientSection.classList.remove('active');
                    userSection.classList.add('active');
                    log.textContent = 'Selecione o usuário...';
                    log.classList.remove('error');
                } else {
                    log.textContent = 'Por favor, selecione pelo menos um cliente.';
                    log.classList.add('error');
                }
            };

            // Configura o botão de confirmação
            confirmBtn.onclick = () => {
                selectedUser = userSelect.value;
                if (selectedCategoryId && selectedEnvironment && selectedClients.length > 0 && selectedUser) {
                    userSection.classList.remove('active');
                    resultSection.classList.add('active');
                    log.textContent = 'Capturando dados...';
                    log.classList.remove('error');
                    gerarMantisPorCategoria(selectedCategoryId, selectedCategoryName, selectedEnvironment, selectedClients, selectedUser);
                } else {
                    log.textContent = 'Por favor, selecione um usuário.';
                    log.classList.add('error');
                }
            };

            // Configura o botão de reiniciar
            resetBtn.onclick = resetPopup;

            sizeInput.oninput = function(e) {
                const size = e.target.value;
                const btn = document.getElementById('mantis-float-btn-userscript');
                btn.style.fontSize = size + 'px';
                btn.style.width = btn.style.height = (parseInt(size) + 16) + 'px';
                localStorage.setItem('mantisBtnSize', size);
                posicionarPopup(btn, popup);
            };
        }
        const log = document.getElementById('mantis-log');
        if (log) log.textContent = '';
        popup.querySelector('.mantis-category-section').style.display = 'block';
        popup.querySelector('.mantis-environment-section').classList.remove('active');
        popup.querySelector('.mantis-client-section').classList.remove('active');
        popup.querySelector('.mantis-user-section').classList.remove('active');
        popup.querySelector('.mantis-result-section').classList.remove('active');
        popup.style.display = 'block';
        popup.classList.remove('mantis-popup-hide');
        popup.classList.add('mantis-popup-show');
        const btn = document.getElementById('mantis-float-btn-userscript');
        posicionarPopup(btn, popup);
        window.addEventListener('resize', () => posicionarPopup(btn, popup));
        document.addEventListener('mousedown', function clickFora(e) {
            if (!popup.contains(e.target) && e.target !== btn) {
                fecharPopup();
                document.removeEventListener('mousedown', clickFora);
            }
        });
    }

    // --- Função para gerar Mantis por categoria, ambiente, produto, clientes e usuário ---
    async function gerarMantisPorCategoria(categoryId, categoryName, environmentValue, clientValues, handlerValue) {
        const log = document.getElementById('mantis-log');
        const resultSection = document.querySelector('.mantis-result-section');
        log.textContent = 'Capturando dados...';
        log.classList.remove('error');
        const dados = await capturarBreadcrumbs();
        if (dados.erro) {
            log.textContent = dados.erro;
            log.classList.add('error');
            resultSection.classList.add('active');
            return;
        }
        log.textContent = 'Abrindo Mantis...';
        const currentUrl = window.location.href;
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mantisUrl = 'http://mantis.escolarmanager.kinghost.net/bug_report_page.php?project_id=14';
        const newWindow = window.open(mantisUrl, '_blank');
        if (newWindow) {
            await new Promise(resolve => setTimeout(() => {
                newWindow.postMessage({
                    type: 'mantisData',
                    resumo: dados.resumo,
                    funcionalidade: dados.funcionalidade,
                    link: currentUrl,
                    categoryId: categoryId,
                    categoryName: categoryName,
                    environmentValue: environmentValue,
                    productValue: dados.produto,
                    clientValues: clientValues,
                    handlerValue: handlerValue
                }, '*');
                resolve();
            }, 500));
            log.textContent = 'Aba Mantis aberta, preenchimento em andamento...';
        } else {
            log.textContent = 'Falha ao abrir a aba. Desative o bloqueio de popups.';
            log.classList.add('error');
            resultSection.classList.add('active');
            return;
        }

        window.addEventListener('message', function successListener(event) {
            if (event.origin !== 'http://mantis.escolarmanager.kinghost.net' && event.origin !== 'https://mantis.escolarmanager.kinghost.net') return;
            if (event.data.type === 'mantisSuccess') {
                log.textContent = 'Sucesso! Preenchimento concluído.';
                log.classList.remove('error');
                resultSection.classList.add('active');
                window.removeEventListener('message', successListener);
            }
        });
    }

    // --- Botão flutuante único e arrastável ---
    if (window.top === window.self) {
        document.querySelectorAll('#mantis-float-btn-userscript').forEach(btn => btn.remove());

        if (!document.getElementById('mantis-float-btn-userscript')) {
            let btn = document.createElement('button');
            btn.id = 'mantis-float-btn-userscript';
            btn.title = 'Gerar Mantis';
            btn.innerHTML = '🦉';
            btn.style.border = '2px solid #fff';
            btn.style.boxShadow = '0 0 0 3px #43a04755';
            btn.onclick = abrirPopup;
            btn.style.fontSize = (localStorage.getItem('mantisBtnSize') || '32') + 'px';
            btn.style.width = btn.style.height = (parseInt(localStorage.getItem('mantisBtnSize') || 48) + 'px');
            document.body.appendChild(btn);

            let isDragging = false, offsetX = 0, offsetY = 0;
            let pendingFrame = null;

            const moveHandler = (e) => {
                if (isDragging) {
                    if (pendingFrame) return;

                    pendingFrame = requestAnimationFrame(() => {
                        let x = e.clientX - offsetX;
                        let y = e.clientY - offsetY;
                        btn.style.left = x + 'px';
                        btn.style.top = y + 'px';
                        btn.style.right = '';
                        btn.style.bottom = '';
                        btn.style.position = 'fixed';

                        const popup = document.getElementById('mantis-popup');
                        if (popup && popup.style.display === 'block') {
                            posicionarPopup(btn, popup);
                        }

                        pendingFrame = null;
                    });
                }
            };

            const upHandler = () => {
                isDragging = false;
                btn.style.transition = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                if (pendingFrame) {
                    cancelAnimationFrame(pendingFrame);
                    pendingFrame = null;
                }
            };

            btn.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - btn.getBoundingClientRect().left;
                offsetY = e.clientY - btn.getBoundingClientRect().top;
                btn.style.transition = 'none';
                document.body.style.userSelect = 'none';
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', upHandler);
            });

            btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
            btn.addEventListener('mouseleave', () => btn.style.opacity = '0.6');
            btn.style.opacity = '0.6';
        }

        document.querySelectorAll('button').forEach(btn => {
            if (btn !== document.getElementById('mantis-float-btn-userscript') && btn.innerText.trim().includes('Mantis')) {
                btn.style.display = 'none';
            }
        });
    }

    // --- Automação na página do Mantis ---
    if (window.location.hostname === 'mantis.escolarmanager.kinghost.net' && window.location.pathname.includes('bug_report_page.php')) {
        function setFieldValue(field, targetValue, callback, attempt = 1, maxAttempts = 10) {
            if (!field || field.disabled || field.options.length === 0) {
                if (attempt < maxAttempts) {
                    setTimeout(() => setFieldValue(field, targetValue, callback, attempt + 1, maxAttempts), 500);
                }
                console.warn(`[Mantis Userscript] Campo não disponível após ${maxAttempts} tentativas.`);
                return;
            }

            // Converter targetValue para string ou array e normalizar
            let normalizedTargetValues = Array.isArray(targetValue) ?
                targetValue.map(v => String(v || '').trim()) :
                [String(targetValue || '').trim()];
            let optionIndices = [];

            // Para campos <select multiple>, selecionar múltiplas opções
            if (field.multiple) {
                // Desmarcar todas as opções primeiro
                [...field.options].forEach(opt => opt.selected = false);
                normalizedTargetValues.forEach(val => {
                    const index = [...field.options].findIndex(opt => opt.value.trim() === val);
                    if (index !== -1) {
                        field.options[index].selected = true;
                        optionIndices.push(index);
                    }
                });
            } else {
                const index = [...field.options].findIndex(opt => opt.value.trim() === normalizedTargetValues[0]);
                if (index !== -1) {
                    field.value = normalizedTargetValues[0];
                    field.selectedIndex = index;
                    optionIndices.push(index);
                }
            }

            if (optionIndices.length === 0) {
                console.error(`[Mantis Userscript] Valores ${normalizedTargetValues.join(', ')} não encontrados nas opções do campo. Opções disponíveis:`, [...field.options].map(opt => opt.value));
                return;
            }

            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('input', { bubbles: true }));

            console.log(`[Mantis Userscript] Campo preenchido com valores: ${normalizedTargetValues.join(', ')}`);
            if (typeof callback === 'function') callback();
        }

        function setupFieldObserver(field, targetValue) {
            const normalizedTargetValues = Array.isArray(targetValue) ?
                targetValue.map(v => String(v || '').trim()) :
                [String(targetValue || '').trim()];
            const observer = new MutationObserver(() => {
                if (field.multiple) {
                    const selectedValues = [...field.options].filter(opt => opt.selected).map(opt => opt.value.trim());
                    const allSelected = normalizedTargetValues.every(val => selectedValues.includes(val));
                    if (!allSelected) {
                        setFieldValue(field, targetValue);
                    }
                } else {
                    if (field.value.trim() !== normalizedTargetValues[0]) {
                        setFieldValue(field, targetValue);
                    }
                }
            });
            observer.observe(field, { attributes: true, childList: true, subtree: true });
            field._observer = observer;
            return observer;
        }

        window.addEventListener('message', (event) => {
            if (event.data.type === 'mantisData') {
                // Preenche o campo de categoria
                const categoryField = document.querySelector('#category_id, select[name="category_id"]');
                if (categoryField) {
                    setTimeout(() => {
                        const observer = setupFieldObserver(categoryField, event.data.categoryId);
                        setFieldValue(categoryField, event.data.categoryId, () => {
                            observer.disconnect();
                        });
                        setTimeout(() => observer.disconnect(), 15000);
                    }, 1500);
                }

                // Preenche o campo de ambiente
                const environmentField = document.querySelector('#custom_field_26, select[name="custom_field_26"]');
                if (environmentField) {
                    setTimeout(() => {
                        const observer = setupFieldObserver(environmentField, event.data.environmentValue);
                        setFieldValue(environmentField, event.data.environmentValue, () => {
                            observer.disconnect();
                        });
                        setTimeout(() => observer.disconnect(), 15000);
                    }, 1500);
                }

                // Preenche o campo de produto
                const productField = document.querySelector('#custom_field_21, select[name="custom_field_21"]');
                if (productField) {
                    setTimeout(() => {
                        const observer = setupFieldObserver(productField, event.data.productValue);
                        setFieldValue(productField, event.data.productValue, () => {
                            observer.disconnect();
                        });
                        setTimeout(() => observer.disconnect(), 15000);
                    }, 1500);
                }

                // Preenche o campo de clientes (multiple select)
                const clientField = document.querySelector('#custom_field_9, select[name="custom_field_9[]"]');
                if (clientField) {
                    setTimeout(() => {
                        const observer = setupFieldObserver(clientField, event.data.clientValues);
                        setFieldValue(clientField, event.data.clientValues, () => {
                            observer.disconnect();
                        });
                        setTimeout(() => observer.disconnect(), 15000);
                    }, 1500);
                }

                // Preenche o campo de usuário
                const handlerField = document.querySelector('#handler_id, select[name="handler_id"]');
                if (handlerField) {
                    setTimeout(() => {
                        const observer = setupFieldObserver(handlerField, event.data.handlerValue);
                        setFieldValue(handlerField, event.data.handlerValue, () => {
                            observer.disconnect();
                        });
                        setTimeout(() => observer.disconnect(), 15000);
                    }, 1500);
                }

                // Preenche o campo de resumo
                const summaryField = document.querySelector('#summary, textarea[name="summary"]');
                if (summaryField) {
                    summaryField.value = event.data.resumo;
                    summaryField.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Preenche o campo de descrição
                const descriptionField = document.querySelector('#description, textarea[name="description"]');
                if (descriptionField) {
                    let bddDescription = event.data.categoryId === 37 ?
                        `
**Funcionalidade:** ${event.data.funcionalidade}
**Link:** ${event.data.link}
**USUÁRIO/SENHA:** ADMINISTRADOR/TOKEN

**Passos para reproduzir:**

**DADO**
**E**
**QUANDO**
**ENTÃO**
` :
                        `
**Funcionalidade:** ${event.data.funcionalidade}
**Link:** ${event.data.link}
**USUÁRIO/SENHA:** ADMINISTRADOR/TOKEN

**Comportamento Atual:**

**DADO**
**E**
**E**
**QUANDO**
**ENTÃO**

**Comportamento Esperado:**
**ENTÃO**
`;
                    descriptionField.value = bddDescription;
                    descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
                    window.opener.postMessage({
                        type: 'mantisSuccess',
                        message: 'Preenchimento concluído com sucesso'
                    }, '*');
                }
            }
        });

        function iniciarAutomacao() {
            const categoryField = document.querySelector('#category_id, select[name="category_id"]');
            const environmentField = document.querySelector('#custom_field_26, select[name="custom_field_26"]');
            const productField = document.querySelector('#custom_field_21, select[name="custom_field_21"]');
            const clientField = document.querySelector('#custom_field_9, select[name="custom_field_9[]"]');
            const handlerField = document.querySelector('#handler_id, select[name="handler_id"]');
            if (!categoryField || !environmentField || !productField || !clientField || !handlerField) {
                setTimeout(iniciarAutomacao, 500);
            }
        }

        if (window.opener && window.opener !== window) {
            document.addEventListener('DOMContentLoaded', iniciarAutomacao);
        }
    }
})();
