# Automação Escolar Manager + Mantis

Um userscript para Tampermonkey que automatiza a criação de chamados no Mantis a partir do Escolar Manager, com um botão flutuante, popup interativo e integração direta com os campos do Mantis. Este script otimiza fluxos de trabalho de QA, capturando dados da página, permitindo seleção de múltiplos clientes e preenchendo formulários no Mantis automaticamente.

## Funcionalidades

- **Botão Flutuante**: Um botão arrastável (🦉) que ativa o popup de automação em URLs compatíveis.
- **Popup Interativo**:
  - Fluxo passo a passo: Categoria → Ambiente → Clientes (seleção múltipla pesquisável com tags removíveis) → Usuário → Confirmar.
  - Dropdown de clientes pesquisável com suporte a múltiplas seleções (usando CTRL) e tags azuis para visualização clara.
  - Dropdown para atribuição de usuário no campo `handler_id` do Mantis.
  - Mensagens de sucesso/erro com botão "Reiniciar" para voltar à tela inicial sem fechar o popup.
- **Captura de Dados**:
  - Extrai automaticamente breadcrumbs, funcionalidade e produto (priorizando "(Web)") das páginas do Escolar Manager.
  - Timeout de 3 segundos para captura de breadcrumbs, com mensagem de erro amigável se falhar.
- **Automação no Mantis**:
  - Preenche os campos do Mantis: `#Categoria`, `#custom_field_26` (ambiente), `#custom_field_21` (produto), `#custom_field_9` (clientes, multi-select), `#handler_id` (usuário), `#summary` e `#description` (formato BDD).
  - Suporta múltiplos clientes no campo `#custom_field_9`.
- **Melhorias de UX**:
  - Tags de clientes com texto branco sobre fundo azul claro (`#42a5f5`) para maior legibilidade.
  - Instrução: "Segure CTRL para selecionar múltiplos clientes."
  - Movimento suave do botão com *refresh rate* otimizado via `requestAnimationFrame`.
- **Tratamento de Erros**: Exibe "Não foi possível identificar o caminho ou o nome da tela." em vermelho para capturas malsucedidas.
- **Tempos**: 3s para captura de breadcrumbs, 1s para abrir o Mantis, 1.5s para automação dos campos.
- **Conformidade com ESLint**: Corrige o erro `no-return-assign` na função `moveHandler`.

## URLs Suportadas
- `http://hmg-emweb-vm/*`
- `https://regular.escolarmanageronline.com.br/*`
- `https://curso.escolarmanageronline.com.br/*`
- `http://mantis.escolarmanager.kinghost.net/bug_report_page.php*`
- `https://mantis.escolarmanager.kinghost.net/bug_report_page.php*`
- `http://srv-hmg-interno*`

## Instalação

### Pré-requisitos
- **Tampermonkey**: Instale a extensão Tampermonkey no seu navegador:
  - [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
  - [Firefox Add-ons](https://addons.mozilla.org/pt-BR/firefox/addon/tampermonkey/)
  - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
  - [Safari](https://tampermonkey.net/?browser=safari) (requer extensão Userscripts ou similar)

### Passos para Instalação
1. **Instalar o Tampermonkey**:
   - Baixe e instale o Tampermonkey a partir do link acima para o seu navegador.
   - Ative a extensão.

2. **Adicionar o Userscript**:
   - Baixe o arquivo do script: [script.user.js](https://raw.githubusercontent.com/Pedro-Augusto-Em/geradorManti/main/script.user.js).
   - Abra o painel do Tampermonkey:
     - Clique no ícone do Tampermonkey na barra de ferramentas do navegador.
     - Selecione "Painel" > aba "Utilitários".
   - Clique em "Importar de URL" e cole o URL raw do GitHub do script (ex.: `https://raw.githubusercontent.com/Pedro-Augusto-Em/geradorManti/main/script.user.js`).
   - Alternativamente, arraste e solte o arquivo `script.user.js` baixado no painel do Tampermonkey.
   - Clique em "Instalar" ou "Salvar" no Tampermonkey.

3. **Verificar a Instalação**:
   - Acesse uma URL suportada (ex.: `https://regular.escolarmanageronline.com.br/escolateste`).
   - Procure pelo botão flutuante (🦉) no canto superior direito da página.
   - Se o botão não aparecer, verifique se o Tampermonkey está ativado e se a URL corresponde às regras `@match`.

## Uso

1. **Abrir o Popup**:
   - Em uma página do Escolar Manager suportada, clique no botão flutuante (🦉).
   - O popup será exibido com a tela de seleção de categoria.

2. **Navegar no Popup**:
   - **Categoria**: Selecione uma categoria (ex.: "Erro", "Defeito").
   - **Ambiente**: Escolha um ambiente (ex.: "1-Produção").
   - **Clientes**:
     - Use o campo de pesquisa para filtrar clientes.
     - Segure **CTRL** para selecionar múltiplos clientes (instrução fornecida).
     - Clientes selecionados aparecem como tags azuis com um "x" para remoção.
   - **Usuário**: Selecione um usuário para atribuir o chamado no Mantis.
   - **Confirmar**: Clique em "Confirmar" para iniciar a automação.

3. **Visualizar Resultados**:
   - O popup permanece aberto, exibindo:
     - **Sucesso**: "Sucesso! Preenchimento concluído." em verde.
     - **Erro**: Mensagens como "Não foi possível identificar o caminho ou o nome da tela." em vermelho.
   - Clique no botão "Reiniciar" para voltar à tela de seleção de categoria e iniciar uma nova automação.
   - Feche o popup manualmente com o botão "×", se necessário.

4. **Verificar no Mantis**:
   - Uma nova aba do Mantis será aberta em `http://mantis.escolarmanager.kinghost.net/bug_report_page.php?project_id=14`.
   - Confirme que os campos ( `#custom_field_26` (ambiente), `#custom_field_21` (produto), `#custom_field_9` (clientes, multi-select), `#handler_id` (usuário), `#summary` e `#description` (formato BDD).) estão preenchidos corretamente.

## Solução de Problemas

- **Botão Não Aparece**:
  - Verifique se a URL corresponde a um dos padrões `@match`.
  - Confirme se o Tampermonkey está ativado (clique no ícone e verifique se o script está ativo).
  - Abra o console (F12 > Console) para verificar erros como `[Mantis Userscript] ...`.

- **Popup Não Aparece**:
  - Clique novamente no botão flutuante (🦉) para alternar o popup.
  - Certifique-se de que outras extensões do navegador (ex.: bloqueadores de anúncios) não estão interferindo.

- **Mensagem de Erro: "Não foi possível identificar o caminho ou o nome da tela."**:
  - Verifique se os breadcrumbs (`ol.breadcrumb .breadcrumb-item`) ou a funcionalidade (`h6.m-0.text-primary.text-left`) existem na página.
  - Aumente o `timeLimit` no script (ex.: de 3000 para 4000):
    ```javascript
    const timeLimit = 4000;
