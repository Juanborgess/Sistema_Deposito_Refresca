/**
 * Módulo Universal e Portável de Impressão Térmica (80mm / 72mm Safe Area)
 * Compatível com qualquer impressora térmica (Bematech, Elgin, Epson, Daruma, POS-80)
 * em Windows, Linux e macOS:
 * - Suporte a listagem e seleção dinâmica de dispositivo (WebUSB e WebSerial) com descoberta automática de interfaces/endpoints.
 * - Spooler 80mm via Blob URL / Iframe Oculto (sem about:blank, sem rolos gigantes A4, altura dinâmica exata).
 */

const COLS_80MM = 48;
const STORAGE_PREF_KEY = 'refresca_thermal_device_pref';

/**
 * Normaliza texto para tabela ASCII limpa (evita caracteres corrompidos em firmwares térmicos diversos)
 */
export function sanitizeThermalText(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n\r]/g, '');
}

/**
 * Formata linha com coluna esquerda e direita alinhadas dentro de 48 colunas (80mm)
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
 * Formata descrição amigável do método de pagamento
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
 * Constrói o buffer binário ESC/POS universal (compatível com Bematech, Epson, Elgin, POS-80)
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

  // 1. Reset / Inicialização Universal (ESC @)
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

  // 4. Dados do Cliente e Entrega
  pushText(`CLIENTE: ${pedido.cliente_nome || 'Cliente'}`);
  pushText(`TEL: ${pedido.cliente_telefone || '-'}`);
  pushText(`ENDERECO: ${pedido.endereco_completo || '-'}`);
  pushText(`BAIRRO: ${pedido.bairro || '-'}`);
  if (motoboyNome) {
    pushText(`ENTREGADOR: ${motoboyNome}`);
  }
  pushText('='.repeat(COLS_80MM));

  // 5. Cabeçalho de Itens
  pushBytes(0x1b, 0x45, 0x01);
  pushText(formatLineLR('QTD  DESCRICAO', 'TOTAL'));
  pushBytes(0x1b, 0x45, 0x00);
  pushText('-'.repeat(COLS_80MM));

  // 6. Itens do Pedido
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

  // 7. Totais Financeiros
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

  // 9. Avanço curto e Comando Universal de Guilhotina (GS V 66 3)
  pushBytes(0x0a, 0x0a, 0x0a);
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
 * Descobre dinamicamente a interface e o endpoint de saída (OUT) em qualquer impressora USB (Bematech, Epson, Elgin)
 */
async function sendToWebUsbDevice(device, escPosBytes) {
  await device.open();
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }

  const interfaces = device.configuration.interfaces || [];
  let targetInterfaceNumber = null;
  let targetAlternateSetting = 0;
  let targetEndpointNumber = null;

  // Varre todas as interfaces e alternates procurando endpoint de direção 'out'
  for (const iface of interfaces) {
    for (const alt of iface.alternates || []) {
      const outEp = (alt.endpoints || []).find((ep) => ep.direction === 'out');
      if (outEp) {
        targetInterfaceNumber = iface.interfaceNumber;
        targetAlternateSetting = alt.alternateSetting;
        targetEndpointNumber = outEp.endpointNumber;
        // Prioriza classe de impressora USB (0x07) se existir
        if (alt.interfaceClass === 7) break;
      }
    }
    if (targetEndpointNumber !== null) break;
  }

  if (targetInterfaceNumber === null || targetEndpointNumber === null) {
    await device.close();
    throw new Error('Endpoint de saída USB não encontrado neste dispositivo.');
  }

  await device.claimInterface(targetInterfaceNumber);
  if (targetAlternateSetting !== 0) {
    await device.selectAlternateInterface(targetInterfaceNumber, targetAlternateSetting);
  }

  // Envia em blocos seguros de 512 bytes para evitar overflow de buffer em diferentes controladoras
  const chunkSize = 512;
  for (let i = 0; i < escPosBytes.length; i += chunkSize) {
    const slice = escPosBytes.slice(i, i + chunkSize);
    await device.transferOut(targetEndpointNumber, slice);
  }

  await device.close();
}

/**
 * Envia o buffer ESC/POS para uma porta WebSerial tentando taxas de transmissão padrão de impressoras térmicas
 */
async function sendToWebSerialPort(port, escPosBytes) {
  const baudRates = [9600, 115200, 38400, 19200];
  let opened = false;

  for (const baudRate of baudRates) {
    try {
      await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
      opened = true;
      break;
    } catch (err) {
      if (err && err.name === 'InvalidStateError') {
        // Porta já estava aberta
        opened = true;
        break;
      }
    }
  }

  if (!opened) {
    throw new Error('Não foi possível abrir a porta serial da impressora.');
  }

  const writer = port.writable.getWriter();
  await writer.write(escPosBytes);
  writer.releaseLock();
  await port.close();
}

/**
 * Tenta envio silencioso apenas se o usuário já tiver autorizado e salvo uma impressora anteriormente
 */
export async function trySilentDirectHardwarePrint(escPosBytes) {
  let savedPref = null;
  try {
    savedPref = JSON.parse(localStorage.getItem(STORAGE_PREF_KEY) || 'null');
  } catch (e) {
    savedPref = null;
  }

  if (!savedPref) return false;

  if (savedPref.type === 'usb' && typeof navigator !== 'undefined' && navigator.usb) {
    try {
      const devices = await navigator.usb.getDevices();
      const matched =
        devices.find(
          (d) => d.vendorId === savedPref.vendorId && d.productId === savedPref.productId
        ) || devices[0];
      if (matched) {
        await sendToWebUsbDevice(matched, escPosBytes);
        return true;
      }
    } catch (err) {
      console.warn('Impressão USB silenciosa falhou, abrindo seletor/spooler:', err);
    }
  }

  if (savedPref.type === 'serial' && typeof navigator !== 'undefined' && navigator.serial) {
    try {
      const ports = await navigator.serial.getPorts();
      if (ports && ports.length > 0) {
        await sendToWebSerialPort(ports[0], escPosBytes);
        return true;
      }
    } catch (err) {
      console.warn('Impressão Serial silenciosa falhou, abrindo seletor/spooler:', err);
    }
  }

  return false;
}

function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Gera o documento HTML/JS completo para impressão térmica universal (80mm x Altura Dinâmica + Seleção Dinâmica USB/Serial)
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
        <tr style="border-bottom: 1px dashed #000; page-break-inside: avoid;">
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
  const alturaInicialMm = Math.max(90, 75 + itens.length * 14);

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
          gap: 6px;
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
          height: fit-content !important;
          max-height: fit-content !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .paper-sheet {
          width: 80mm !important;
          max-width: 80mm !important;
          height: fit-content !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        #receipt-container {
          width: 72mm !important;
          max-width: 72mm !important;
          height: fit-content !important;
          margin: 0 auto !important;
          padding: 2mm 0 3mm 0 !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
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
      .hw-bar {
        display: flex;
        gap: 6px;
        width: 100%;
      }
      .btn-direto {
        flex: 1;
        background: #10B981 !important;
        color: #070B16 !important;
        padding: 7px 8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
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
          <button class="btn-imprimir" onclick="executarImpressao()">🖨️ Imprimir Bobina (80mm)</button>
          <button class="btn-fechar" onclick="window.close()">✕ Fechar</button>
        </div>
        <div class="hw-bar">
          <button class="btn-direto" onclick="selecionarPortaUsb()">🔌 Selecionar USB (ESC/POS)</button>
          <button class="btn-direto" onclick="selecionarPortaSerial()">⚡ Selecionar Porta Serial</button>
        </div>
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

        <div style="height: 6mm; line-height: 6mm; text-align: center;">&nbsp;</div>
      </div>
    </div>

    <script>
      var ESCPOS_BASE64 = "${escPosBase64}";
      var STORAGE_KEY = "${STORAGE_PREF_KEY}";

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
          var alturaMm = Math.max(75, Math.ceil((alturaPx * 25.4) / 96) + 2);
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

      // Listagem e seleção dinâmica de qualquer impressora USB pelo navegador
      async function selecionarPortaUsb() {
        var statusEl = document.getElementById('status-msg');
        var navUsb = navigator.usb || (window.opener && window.opener.navigator && window.opener.navigator.usb);
        if (!navUsb) {
          alert('Seu navegador não suporta WebUSB direto. Use o botão Imprimir Bobina (80mm).');
          return;
        }
        try {
          var payload = base64ToUint8Array(ESCPOS_BASE64);
          var device = await navUsb.requestDevice({ filters: [] });
          await device.open();
          if (device.configuration === null) {
            await device.selectConfiguration(1);
          }
          var interfaces = device.configuration.interfaces || [];
          var targetIface = null;
          var targetAlt = 0;
          var targetEp = null;

          for (var i = 0; i < interfaces.length; i++) {
            var alts = interfaces[i].alternates || [];
            for (var j = 0; j < alts.length; j++) {
              var eps = alts[j].endpoints || [];
              for (var k = 0; k < eps.length; k++) {
                if (eps[k].direction === 'out') {
                  targetIface = interfaces[i].interfaceNumber;
                  targetAlt = alts[j].alternateSetting;
                  targetEp = eps[k].endpointNumber;
                  if (alts[j].interfaceClass === 7) break;
                }
              }
              if (targetEp !== null) break;
            }
            if (targetEp !== null) break;
          }

          if (targetIface === null || targetEp === null) {
            await device.close();
            alert('Endpoint de saída não encontrado nesta impressora USB.');
            return;
          }

          await device.claimInterface(targetIface);
          if (targetAlt !== 0) {
            await device.selectAlternateInterface(targetIface, targetAlt);
          }

          for (var offset = 0; offset < payload.length; offset += 512) {
            await device.transferOut(targetEp, payload.slice(offset, offset + 512));
          }
          await device.close();

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              type: 'usb',
              vendorId: device.vendorId,
              productId: device.productId
            }));
          } catch (e) {}

          if (statusEl) statusEl.innerText = 'USB ENVIADO!';
        } catch (err) {
          if (err && err.name !== 'NotFoundError') {
            alert('Não foi possível acessar a porta USB diretamente (' + err.message + '). Tente Selecionar Porta Serial ou Imprimir Bobina (80mm).');
          }
        }
      }

      // Listagem e seleção dinâmica de qualquer porta Serial/COM/ACM pelo navegador
      async function selecionarPortaSerial() {
        var statusEl = document.getElementById('status-msg');
        var navSerial = navigator.serial || (window.opener && window.opener.navigator && window.opener.navigator.serial);
        if (!navSerial) {
          alert('Seu navegador não suporta WebSerial direto. Use o botão Imprimir Bobina (80mm).');
          return;
        }
        try {
          var payload = base64ToUint8Array(ESCPOS_BASE64);
          var port = await navSerial.requestPort();
          var bauds = [9600, 115200, 38400, 19200];
          var opened = false;
          for (var i = 0; i < bauds.length; i++) {
            try {
              await port.open({ baudRate: bauds[i], dataBits: 8, stopBits: 1, parity: 'none' });
              opened = true;
              break;
            } catch (openErr) {
              if (openErr && openErr.name === 'InvalidStateError') {
                opened = true;
                break;
              }
            }
          }
          if (!opened) throw new Error('Falha ao abrir porta serial.');

          var writer = port.writable.getWriter();
          await writer.write(payload);
          writer.releaseLock();
          await port.close();

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'serial' }));
          } catch (e) {}

          if (statusEl) statusEl.innerText = 'SERIAL ENVIADO!';
        } catch (err) {
          if (err && err.name !== 'NotFoundError') {
            alert('Erro ao comunicar com a porta selecionada: ' + err.message);
          }
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

/**
 * Dispara a impressão térmica limpa usando Iframe Oculto na mesma origem HTTPS (evita about:blank e bloqueio de popup)
 * ou janela dedicada caso solicitado.
 */
export function triggerCleanIframePrint(htmlDoc) {
  let iframe = document.getElementById('refresca-thermal-iframe');
  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement('iframe');
  iframe.id = 'refresca-thermal-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '80mm';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlDoc);
  doc.close();
}
