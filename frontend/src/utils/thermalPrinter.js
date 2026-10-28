/**
 * Módulo Isolado de Impressão Térmica Universal (80mm / 72mm Safe Area)
 * Compatível com Windows, Linux e macOS:
 * 1. Modo ESC/POS Direto (WebSerial / WebUSB) -> Ignora CUPS/Drivers A4, evita metadados PDF crus e aciona guilhotina.
 * 2. Modo Spooler Limpo 80mm via Blob URL -> Sem about:blank, com @page 80mm x Altura Dinâmica e 72mm centralizados.
 */

const COLS_80MM = 48;

/**
 * Remove acentos e caracteres especiais incompatíveis com tabela ASCII/CP850 bruta de impressoras térmicas
 */
export function sanitizeThermalText(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n\r]/g, '');
}

/**
 * Formata linha com texto à esquerda e valor alinhado à direita dentro de N colunas
 */
function formatLineLR(left, right, width = COLS_80MM) {
  const cleanLeft = sanitizeThermalText(left);
  const cleanRight = sanitizeThermalText(right);
  const space = width - cleanLeft.length - cleanRight.length;
  if (space >= 1) {
    return cleanLeft + ' '.repeat(space) + cleanRight;
  }
  const maxLeft = Math.max(1, width - cleanRight.length - 1);
  return cleanLeft.slice(0, maxLeft) + ' ' + cleanRight;
}

/**
 * Formata o método de pagamento de forma legível para a comanda
 */
export function formatPaymentMethod(metodo) {
  const m = metodo || 'Não informado';
  if (m === 'PIX') return 'PIX';
  if (m === 'CREDITO') return 'Cartão de Crédito (Máquina)';
  if (m === 'DEBITO') return 'Cartão de Débito (Máquina)';
  if (m === 'DINHEIRO') return 'Dinheiro';
  return m;
}

/**
 * Constrói o buffer binário ESC/POS nativo (Bematech / Epson / Elgin 80mm)
 * Não gera PDF nem HTML — envia comandos térmicos puros + acionamento de guilhotina.
 */
export function buildEscPosBuffer(pedido, itens = []) {
  const encoder = new TextEncoder();
  const chunks = [];
  const pushBytes = (...bytes) => chunks.push(new Uint8Array(bytes));
  const pushText = (txt) => chunks.push(encoder.encode(sanitizeThermalText(txt) + '\n'));

  const codigoFormatado = String(pedido.codigo_pedido).padStart(4, '0');
  const dataHora = new Date(pedido.created_at).toLocaleString('pt-BR');
  const subtotal = Number(pedido.subtotal || 0).toFixed(2).replace('.', ',');
  const frete = Number(pedido.taxa_entrega || 0).toFixed(2).replace('.', ',');
  const total = Number(pedido.total || 0).toFixed(2).replace('.', ',');
  const formaPgto = formatPaymentMethod(pedido.metodo_pagamento);
  const motoboyNome = pedido.motoboys?.nome;

  // 1. Inicializa impressora (ESC @)
  pushBytes(0x1b, 0x40);

  // 2. Cabeçalho Centralizado (ESC a 1) + Negrito (ESC E 1)
  pushBytes(0x1b, 0x61, 0x01);
  pushBytes(0x1b, 0x45, 0x01);
  pushText('REFRESCA BEBIDAS');
  pushBytes(0x1b, 0x45, 0x00);
  pushText('DISTRIBUIDORA & DEPOSITO');
  pushText('Rua Sao Tillon, 141 - Barra da Tijuca');
  pushText('WhatsApp: (21) 98378-5928');

  // 3. Alinhamento à Esquerda (ESC a 0)
  pushBytes(0x1b, 0x61, 0x00);
  pushText('='.repeat(COLS_80MM));

  pushBytes(0x1b, 0x45, 0x01);
  pushText(formatLineLR(`PEDIDO: #${codigoFormatado}`, dataHora));
  if (pedido.is_agendado) {
    pushText('*** PEDIDO AGENDADO (PROGRAMADO) ***');
  }
  pushBytes(0x1b, 0x45, 0x00);
  pushText('-'.repeat(COLS_80MM));

  // 4. Dados do Cliente
  pushText(`CLIENTE: ${pedido.cliente_nome || 'Cliente'}`);
  pushText(`TEL: ${pedido.cliente_telefone || '-'}`);
  pushText(`ENDERECO: ${pedido.endereco_completo || '-'}`);
  pushText(`BAIRRO: ${pedido.bairro || '-'}`);
  if (motoboyNome) {
    pushText(`ENTREGADOR: ${motoboyNome}`);
  }
  pushText('='.repeat(COLS_80MM));

  // 5. Cabeçalho da Tabela de Itens
  pushBytes(0x1b, 0x45, 0x01);
  pushText(formatLineLR('QTD  DESCRICAO', 'TOTAL'));
  pushBytes(0x1b, 0x45, 0x00);
  pushText('-'.repeat(COLS_80MM));

  // 6. Lista de Itens
  itens.forEach((i) => {
    const qtd = Number(i.quantidade || 1);
    const nomeProd = i.produtos ? i.produtos.nome : 'Item';
    const valorUnit = Number(i.preco_unitario || 0);
    const totalItem = (valorUnit * qtd).toFixed(2).replace('.', ',');

    pushBytes(0x1b, 0x45, 0x01);
    pushText(formatLineLR(`${qtd}x   ${nomeProd}`, `R$ ${totalItem}`));
    pushBytes(0x1b, 0x45, 0x00);

    if (qtd > 1) {
      pushText(`     (Un: R$ ${valorUnit.toFixed(2).replace('.', ',')})`);
    }
    if (Array.isArray(i.variacoes) && i.variacoes.length > 0) {
      i.variacoes.forEach((v) => {
        const opcoes = (v.opcoes || []).map((o) => o.nome).join(', ');
        pushText(`     * ${v.grupo_nome || ''}: ${opcoes}`);
      });
    }
    if (i.observacao) {
      pushText(`     [Obs: ${i.observacao}]`);
    }
  });

  pushText('-'.repeat(COLS_80MM));

  // 7. Resumo Financeiro
  pushText(formatLineLR('Subtotal:', `R$ ${subtotal}`));
  pushText(formatLineLR('Taxa de Entrega:', `R$ ${frete}`));
  if (pedido.cupom_aplicado) {
    pushText(formatLineLR(`Cupom (${pedido.cupom_aplicado}):`, 'Aplicado'));
  }
  pushText('-'.repeat(COLS_80MM));

  pushBytes(0x1b, 0x45, 0x01);
  pushText(formatLineLR('TOTAL A PAGAR:', `R$ ${total}`));
  pushBytes(0x1b, 0x45, 0x00);
  pushText('='.repeat(COLS_80MM));

  // 8. Pagamento e Rodapé
  pushBytes(0x1b, 0x45, 0x01);
  pushText(`PAGAMENTO: ${formaPgto}`);
  pushBytes(0x1b, 0x45, 0x00);
  pushText('-'.repeat(COLS_80MM));

  pushBytes(0x1b, 0x61, 0x01);
  pushText('Bebida gelada no seu evento em minutos!');
  pushText('depositorefresca.com.br');

  // 9. Avanço de 4 linhas e Corte Parcial da Guilhotina (GS V 66 3)
  pushBytes(0x0a, 0x0a, 0x0a, 0x0a);
  pushBytes(0x1d, 0x56, 0x42, 0x03);

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Tenta enviar o buffer ESC/POS diretamente via WebSerial ou WebUSB já autorizados no navegador
 */
export async function trySilentDirectHardwarePrint(escPosBytes) {
  if (typeof navigator !== 'undefined' && navigator.usb) {
    try {
      const devices = await navigator.usb.getDevices();
      if (devices && devices.length > 0) {
        const device = devices[0];
        await device.open();
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }
        const iface = device.configurations[0].interfaces[0];
        await device.claimInterface(iface.interfaceNumber);
        const outEndpoint = iface.alternate.endpoints.find((e) => e.direction === 'out');
        if (outEndpoint) {
          await device.transferOut(outEndpoint.endpointNumber, escPosBytes);
          await device.close();
          return true;
        }
      }
    } catch (err) {
      console.warn('WebUSB silencioso indisponível:', err);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.serial) {
    try {
      const ports = await navigator.serial.getPorts();
      if (ports && ports.length > 0) {
        const port = ports[0];
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(escPosBytes);
        writer.releaseLock();
        await port.close();
        return true;
      }
    } catch (err) {
      console.warn('WebSerial silencioso indisponível:', err);
    }
  }

  return false;
}

/**
 * Converte Uint8Array para Base64 para embutir no script da janela de impressão
 */
function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Gera o documento HTML/JS completo para impressão térmica universal (80mm x Altura Dinâmica + ESC/POS Direto)
 */
export function buildThermalPrintDocument(pedido, itens = []) {
  const formaPgto = formatPaymentMethod(pedido.metodo_pagamento);
  const escPosBytes = buildEscPosBuffer(pedido, itens);
  const escPosBase64 = uint8ToBase64(escPosBytes);

  const rowsHtml = itens
    .map((i) => {
      const nomeProd = i.produtos ? i.produtos.nome : 'Item';
      const valorUnit = Number(i.preco_unitario || 0);
      const totalItem = valorUnit * Number(i.quantidade || 1);

      let variacoesTxt = '';
      if (Array.isArray(i.variacoes) && i.variacoes.length > 0) {
        variacoesTxt = i.variacoes
          .map((v) => `• ${v.grupo_nome || ''}: ${(v.opcoes || []).map((o) => o.nome).join(', ')}`)
          .join('<br/>');
      }

      return `
        <tr style="border-bottom: 1px dashed #000;">
          <td style="vertical-align: top; font-weight: bold; padding: 4px 0; width: 30px;">${i.quantidade}x</td>
          <td style="vertical-align: top; padding: 4px 4px 4px 0; word-break: break-word;">
            <div style="font-weight: bold; font-size: 11px;">${nomeProd}</div>
            ${i.quantidade > 1 ? `<div style="font-size: 9px; color: #000;">(Un: R$ ${valorUnit.toFixed(2).replace('.', ',')})</div>` : ''}
            ${variacoesTxt ? `<div style="font-size: 9px; margin-top: 1px;">${variacoesTxt}</div>` : ''}
            ${i.observacao ? `<div style="font-size: 9px; font-weight: bold; margin-top: 1px;">[Obs: ${i.observacao}]</div>` : ''}
          </td>
          <td style="vertical-align: top; text-align: right; white-space: nowrap; font-weight: bold; padding: 4px 0; width: 68px;">
            R$ ${totalItem.toFixed(2).replace('.', ',')}
          </td>
        </tr>
      `;
    })
    .join('');

  const subtotal = Number(pedido.subtotal || 0).toFixed(2).replace('.', ',');
  const frete = Number(pedido.taxa_entrega || 0).toFixed(2).replace('.', ',');
  const total = Number(pedido.total || 0).toFixed(2).replace('.', ',');
  const dataHora = new Date(pedido.created_at).toLocaleString('pt-BR');
  const codigoFormatado = String(pedido.codigo_pedido).padStart(4, '0');
  const motoboyNome = pedido.motoboys?.nome;
  const alturaInicialMm = Math.max(95, 80 + itens.length * 14);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comanda #${codigoFormatado} - Refresca</title>
    <style>
      @page {
        size: 80mm ${alturaInicialMm}mm;
        margin: 0mm;
      }
      @media screen {
        html, body {
          background-color: #070B16 !important;
          min-height: 100vh;
          margin: 0;
          padding: 0 0 24px 0;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .screen-toolbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(16, 25, 53, 0.96);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        .toolbar-inner {
          max-width: 340px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .toolbar-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #9CA3AF !important;
        }
        .toolbar-badge span.dot {
          color: #00E5FF !important;
        }
        .paper-sheet {
          width: 80mm;
          max-width: calc(100vw - 20px);
          margin: 0 auto;
          background-color: #ffffff !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
      }
      @media print {
        html, body {
          width: 80mm !important;
          max-width: 80mm !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .paper-sheet {
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        #receipt-container {
          width: 72mm !important;
          max-width: 72mm !important;
          margin: 0 auto !important;
          padding: 3mm 0 4mm 0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
      #receipt-container, #receipt-container * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        color: #000000 !important;
        font-family: 'Liberation Mono', 'DejaVu Sans Mono', 'Courier New', Courier, monospace;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #receipt-container {
        background-color: #ffffff !important;
        width: 72mm;
        max-width: 72mm;
        margin: 0 auto;
        padding: 4mm 0 4mm 0;
        font-size: 11px;
        line-height: 1.25;
        font-weight: 700;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: 900; }
      .sep-line {
        border-top: 1px dashed #000000;
        margin: 5px 0;
      }
      .sep-double {
        border-top: 2px solid #000000;
        margin: 6px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      .actions-bar {
        display: flex;
        gap: 6px;
        width: 100%;
      }
      .btn-imprimir {
        flex: 1;
        background: #00E5FF !important;
        color: #070B16 !important;
        padding: 9px 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 11px;
        border: none;
        cursor: pointer;
        border-radius: 8px;
      }
      .btn-direto {
        width: 100%;
        background: #10B981 !important;
        color: #070B16 !important;
        padding: 7px 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 10px;
        border: none;
        cursor: pointer;
        border-radius: 8px;
      }
      .btn-fechar {
        background: rgba(255,255,255,0.08) !important;
        color: #ffffff !important;
        padding: 9px 12px;
        font-weight: 700;
        font-size: 11px;
        border: 1px solid rgba(255,255,255,0.15);
        cursor: pointer;
        border-radius: 8px;
      }
    </style>
    <style id="dynamic-page-size"></style>
  </head>
  <body>
    <div class="no-print screen-toolbar">
      <div class="toolbar-inner">
        <div class="toolbar-badge">
          <span><span class="dot">●</span> Bobina 80mm (72mm úteis)</span>
          <span id="status-msg">#${codigoFormatado}</span>
        </div>
        <div class="actions-bar">
          <button class="btn-imprimir" onclick="executarImpressao()">🖨️ Imprimir (80mm)</button>
          <button class="btn-fechar" onclick="window.close()">✕ Fechar</button>
        </div>
        <button class="btn-direto" onclick="imprimirDiretoEscPos()" title="Envia comandos térmicos ESC/POS direto para a porta USB/Serial sem passar pelo CUPS ou PDF">
          ⚡ Impressão Direta USB/Serial (ESC/POS)
        </button>
      </div>
    </div>

    <div class="paper-sheet">
      <div id="receipt-container">
        <div class="center">
          <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">REFRESCA BEBIDAS</div>
          <div style="font-size: 10px;">DISTRIBUIDORA & DEPÓSITO</div>
          <div style="font-size: 10px;">Rua São Tillon, 141 - Barra da Tijuca</div>
          <div style="font-size: 10px;">WhatsApp: (21) 98378-5928</div>
        </div>

        <div class="sep-double"></div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 14px; font-weight: 900;">PEDIDO: #${codigoFormatado}</span>
          <span style="font-size: 10px;">${dataHora}</span>
        </div>
        ${pedido.is_agendado ? '<div class="center bold" style="margin-top: 2px; font-size: 11px;">*** PEDIDO AGENDADO (PROGRAMADO) ***</div>' : ''}

        <div class="sep-line"></div>

        <div style="font-size: 11px;">
          <div><strong>CLIENTE:</strong> ${pedido.cliente_nome || 'Cliente'}</div>
          <div><strong>TEL:</strong> ${pedido.cliente_telefone || '-'}</div>
          <div style="margin-top: 2px;"><strong>ENDEREÇO:</strong> ${pedido.endereco_completo || '-'}</div>
          <div><strong>BAIRRO:</strong> ${pedido.bairro || '-'}</div>
          ${motoboyNome ? `<div style="margin-top: 2px;"><strong>ENTREGADOR:</strong> ${motoboyNome}</div>` : ''}
        </div>

        <div class="sep-double"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000000; font-size: 10px;">
              <th style="text-align: left; padding-bottom: 3px; width: 30px;">QTD</th>
              <th style="text-align: left; padding-bottom: 3px;">DESCRIÇÃO</th>
              <th style="text-align: right; padding-bottom: 3px; width: 68px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="sep-line"></div>

        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="right">R$ ${subtotal}</td>
          </tr>
          <tr>
            <td>Taxa de Entrega:</td>
            <td class="right">R$ ${frete}</td>
          </tr>
          ${pedido.cupom_aplicado ? `
            <tr>
              <td>Cupom (${pedido.cupom_aplicado}):</td>
              <td class="right bold">Aplicado</td>
            </tr>
          ` : ''}
        </table>

        <div class="sep-line"></div>

        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin: 2px 0;">
          <span>TOTAL A PAGAR:</span>
          <span>R$ ${total}</span>
        </div>

        <div class="sep-double"></div>

        <div style="font-size: 11px;">
          <div><strong>PAGAMENTO:</strong> ${formaPgto}</div>
        </div>

        <div class="sep-line"></div>

        <div class="center" style="font-size: 10px; margin-top: 4px;">
          Bebida gelada no seu evento em minutos!<br/>
          depositorefresca.com.br
        </div>

        <div style="height: 8mm; line-height: 8mm; text-align: center;">&nbsp;</div>
      </div>
    </div>

    <script>
      var ESCPOS_BASE64 = "${escPosBase64}";

      function base64ToUint8Array(base64) {
        var binary = window.atob(base64);
        var len = binary.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }

      function ajustarAlturaPagina() {
        var container = document.getElementById('receipt-container');
        if (container) {
          var alturaPx = container.offsetHeight;
          var alturaMm = Math.max(80, Math.ceil((alturaPx * 25.4) / 96) + 4);
          var styleEl = document.getElementById('dynamic-page-size');
          if (styleEl) {
            styleEl.innerHTML = '@page { size: 80mm ' + alturaMm + 'mm; margin: 0mm; }';
          }
        }
      }

      function executarImpressao() {
        ajustarAlturaPagina();
        window.focus();
        window.print();
      }

      async function imprimirDiretoEscPos() {
        var statusEl = document.getElementById('status-msg');
        var payload = base64ToUint8Array(ESCPOS_BASE64);

        // 1. Tenta WebSerial (Portas COM / ttyACM0 / ttyUSB0 da Bematech no Linux/Windows)
        if (navigator.serial) {
          try {
            var ports = await navigator.serial.getPorts();
            var port = ports.length > 0 ? ports[0] : await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            var writer = port.writable.getWriter();
            await writer.write(payload);
            writer.releaseLock();
            await port.close();
            if (statusEl) statusEl.innerText = 'IMP. ENVIADA!';
            return;
          } catch (err) {
            console.warn('Tentando WebUSB após WebSerial:', err);
          }
        }

        // 2. Fallback WebUSB Direto
        if (navigator.usb) {
          try {
            var devices = await navigator.usb.getDevices();
            var device = devices.length > 0 ? devices[0] : await navigator.usb.requestDevice({ filters: [] });
            await device.open();
            if (device.configuration === null) {
              await device.selectConfiguration(1);
            }
            var iface = device.configurations[0].interfaces[0];
            await device.claimInterface(iface.interfaceNumber);
            var outEndpoint = iface.alternate.endpoints.find(function(e) { return e.direction === 'out'; });
            if (outEndpoint) {
              await device.transferOut(outEndpoint.endpointNumber, payload);
              await device.close();
              if (statusEl) statusEl.innerText = 'IMP. ENVIADA!';
              return;
            }
          } catch (usbErr) {
            alert('Para impressão direta USB/Serial, selecione a Bematech na lista do navegador ou use o botão Imprimir (80mm).');
          }
        } else {
          executarImpressao();
        }
      }

      window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.close();
        if (e.key === 'Enter') executarImpressao();
      });

      window.addEventListener('load', function() {
        ajustarAlturaPagina();
        setTimeout(executarImpressao, 300);
      });
    </script>
  </body>
</html>`;
}
