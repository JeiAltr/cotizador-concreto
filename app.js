// ===== CONFIGURATION =====
const CONFIG = {
    whatsappNumber: '51901399575',
    prices: {
        175: { min: 280, max: 320 },
        210: { min: 310, max: 360 },
        245: { min: 350, max: 400 },
        280: { min: 390, max: 450 }
    },
    mixerCapacity: 8,
    businessName: 'ConcreTEC',
    bombaAjuste: 0.5
};

// ===== STATE =====
let state = {
    areas: [],
    descuentos: [],
    vigas: [],
    fc: 210,
    nextId: 1
};

// Store last result for PDF/share actions
let lastResult = null;
let lastQuotationId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initResistanceButtons();
    addZone('area');  // Start with one area zone
    updateSubtotals();
    renderHistoryBadge();
});

// ===== SAVE/RESTORE INPUT VALUES =====
function saveInputValues(prefix, items, fields) {
    const saved = {};
    items.forEach(item => {
        saved[item.id] = {};
        fields.forEach(f => {
            const el = document.getElementById(`${prefix}-${f}-${item.id}`);
            if (el) saved[item.id][f] = el.value;
        });
    });
    return saved;
}

function restoreInputValues(prefix, items, fields, saved) {
    items.forEach(item => {
        if (saved[item.id]) {
            fields.forEach(f => {
                const el = document.getElementById(`${prefix}-${f}-${item.id}`);
                if (el && saved[item.id][f] !== undefined) el.value = saved[item.id][f];
            });
        }
    });
}

// ===== ZONE MANAGEMENT =====
function addZone(type) {
    const id = state.nextId++;
    switch (type) {
        case 'area':
            state.areas.push({ id, nombre: `Zona ${state.areas.length + 1}` });
            renderAreas();
            break;
        case 'descuento':
            state.descuentos.push({ id, nombre: `Descuento ${state.descuentos.length + 1}`, tipo: 'otro' });
            renderDescuentos();
            break;
        case 'viga':
            state.vigas.push({ id, nombre: `Viga ${state.vigas.length + 1}` });
            renderVigas();
            break;
    }
}

function removeZone(type, id) {
    switch (type) {
        case 'area':
            state.areas = state.areas.filter(a => a.id !== id);
            renderAreas();
            break;
        case 'descuento':
            state.descuentos = state.descuentos.filter(d => d.id !== id);
            renderDescuentos();
            break;
        case 'viga':
            state.vigas = state.vigas.filter(v => v.id !== id);
            renderVigas();
            break;
    }
    updateSubtotals();
}

// ===== RENDER AREAS =====
function renderAreas() {
    const saved = saveInputValues('area', state.areas, ['largo', 'ancho']);
    const container = document.getElementById('areasList');
    container.innerHTML = state.areas.map((area, i) => `
        <div class="zone-row" data-id="${area.id}">
            <span class="zone-name">Zona ${i + 1}</span>
            <div class="zone-inputs">
                <div class="field-group">
                    <label>Largo</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="area-largo-${area.id}" oninput="updateSubtotals()">
                </div>
                <span class="zone-x">×</span>
                <div class="field-group">
                    <label>Ancho</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="area-ancho-${area.id}" oninput="updateSubtotals()">
                </div>
            </div>
            <span class="zone-result" id="area-result-${area.id}">= 0 m²</span>
            ${state.areas.length > 1 ? `
                <button class="zone-remove" onclick="removeZone('area', ${area.id})" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            ` : ''}
        </div>
    `).join('');
    restoreInputValues('area', state.areas, ['largo', 'ancho'], saved);
    updateSubtotals();
}

// ===== RENDER DESCUENTOS =====
function renderDescuentos() {
    const saved = saveInputValues('desc', state.descuentos, ['largo', 'ancho']);
    const container = document.getElementById('descuentosList');
    const tipos = ['escalera', 'tragaluz', 'ducto', 'patio', 'otro'];

    container.innerHTML = state.descuentos.map((desc, i) => `
        <div class="zone-row" data-id="${desc.id}">
            <select class="zone-type-select" id="desc-tipo-${desc.id}" onchange="updateDescTipo(${desc.id}, this.value)" style="
                background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 6px;
                color: var(--text-primary); font-size: 11px; font-family: 'Inter', sans-serif;
                padding: 4px 6px; min-width: 80px; cursor: pointer;
            ">
                ${tipos.map(t => `<option value="${t}" ${desc.tipo === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
            </select>
            <div class="zone-inputs">
                <div class="field-group">
                    <label>Largo</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="desc-largo-${desc.id}" oninput="updateSubtotals()">
                </div>
                <span class="zone-x">×</span>
                <div class="field-group">
                    <label>Ancho</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="desc-ancho-${desc.id}" oninput="updateSubtotals()">
                </div>
            </div>
            <span class="zone-result" id="desc-result-${desc.id}">= 0 m²</span>
            <button class="zone-remove" onclick="removeZone('descuento', ${desc.id})" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    `).join('');
    restoreInputValues('desc', state.descuentos, ['largo', 'ancho'], saved);
    updateSubtotals();
}

function updateDescTipo(id, tipo) {
    const desc = state.descuentos.find(d => d.id === id);
    if (desc) desc.tipo = tipo;
}

// ===== RENDER VIGAS =====
function renderVigas() {
    const saved = saveInputValues('viga', state.vigas, ['largo', 'ancho', 'alto']);
    const container = document.getElementById('vigasList');
    container.innerHTML = state.vigas.map((viga, i) => `
        <div class="zone-row" data-id="${viga.id}">
            <span class="zone-name">Viga ${i + 1}</span>
            <div class="zone-inputs">
                <div class="field-group">
                    <label>Largo</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="viga-largo-${viga.id}" oninput="updateSubtotals()">
                </div>
                <span class="zone-x">×</span>
                <div class="field-group">
                    <label>Ancho</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="viga-ancho-${viga.id}" oninput="updateSubtotals()">
                </div>
                <span class="zone-x">×</span>
                <div class="field-group">
                    <label>Peralte</label>
                    <input type="number" placeholder="m" step="0.01" min="0" id="viga-alto-${viga.id}" oninput="updateSubtotals()">
                </div>
            </div>
            <span class="zone-result" id="viga-result-${viga.id}">= 0 m³</span>
            <button class="zone-remove" onclick="removeZone('viga', ${viga.id})" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    `).join('');
    restoreInputValues('viga', state.vigas, ['largo', 'ancho', 'alto'], saved);
    updateSubtotals();
}

// ===== UPDATE SUBTOTALS (live) =====
function updateSubtotals() {
    // Areas
    let areaBruta = 0;
    state.areas.forEach(area => {
        const largo = getVal(`area-largo-${area.id}`);
        const ancho = getVal(`area-ancho-${area.id}`);
        const resultado = largo * ancho;
        areaBruta += resultado;
        const el = document.getElementById(`area-result-${area.id}`);
        if (el) el.textContent = `= ${resultado.toFixed(2)} m²`;
    });

    // Descuentos
    let areaDesc = 0;
    state.descuentos.forEach(desc => {
        const largo = getVal(`desc-largo-${desc.id}`);
        const ancho = getVal(`desc-ancho-${desc.id}`);
        const resultado = largo * ancho;
        areaDesc += resultado;
        const el = document.getElementById(`desc-result-${desc.id}`);
        if (el) el.textContent = `= ${resultado.toFixed(2)} m²`;
    });

    const areaConstruida = Math.max(0, areaBruta - areaDesc);

    // Vigas
    let volVigas = 0;
    state.vigas.forEach(viga => {
        const largo = getVal(`viga-largo-${viga.id}`);
        const ancho = getVal(`viga-ancho-${viga.id}`);
        const alto = getVal(`viga-alto-${viga.id}`);
        const resultado = largo * ancho * alto;
        volVigas += resultado;
        const el = document.getElementById(`viga-result-${viga.id}`);
        if (el) el.textContent = `= ${resultado.toFixed(3)} m³`;
    });

    // Update subtotals
    document.getElementById('subtotalAreaBruta').textContent = `${areaBruta.toFixed(2)} m²`;
    document.getElementById('subtotalAreaConstruida').textContent = `${areaConstruida.toFixed(2)} m²`;
    document.getElementById('subtotalVigas').textContent = `${volVigas.toFixed(3)} m³`;
}

// ===== TOGGLE ESCALERA =====
function toggleEscalera() {
    const checked = document.getElementById('checkEscalera').checked;
    const fields = document.getElementById('escaleraFields');
    if (checked) {
        fields.classList.remove('hidden');
    } else {
        fields.classList.add('hidden');
    }
}

// ===== RESISTANCE BUTTONS =====
function initResistanceButtons() {
    document.querySelectorAll('.resistance-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.resistance-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.fc = parseInt(btn.dataset.fc);
        });
    });
}

// ===== MAIN CALCULATION =====
function calculate() {
    // 1. Area bruta
    let areaBruta = 0;
    state.areas.forEach(area => {
        const largo = getVal(`area-largo-${area.id}`);
        const ancho = getVal(`area-ancho-${area.id}`);
        areaBruta += largo * ancho;
    });

    if (areaBruta <= 0) {
        highlightError('area-largo-' + state.areas[0].id);
        highlightError('area-ancho-' + state.areas[0].id);
        return;
    }

    // 2. Area descuentos
    let areaDescuentos = 0;
    state.descuentos.forEach(desc => {
        const largo = getVal(`desc-largo-${desc.id}`);
        const ancho = getVal(`desc-ancho-${desc.id}`);
        areaDescuentos += largo * ancho;
    });

    // 3. Area construida
    const areaConstruida = Math.max(0, areaBruta - areaDescuentos);

    // 4. Espesor de losa
    const espesorLosa = getVal('espesorLosa');
    if (espesorLosa <= 0) { highlightError('espesorLosa'); return; }

    // 5. Volumen macizo
    const volumenMacizo = areaConstruida * espesorLosa;

    // 6. Bloquetas
    const bloquetaL = getVal('bloquetaLargo');
    const bloquetaA = getVal('bloquetaAncho');
    const bloquetaH = getVal('bloquetaAlto');
    const areaBloqueta = bloquetaL * bloquetaA;
    const volBloquetaUnit = bloquetaL * bloquetaA * bloquetaH;
    const cantBloquetas = areaBloqueta > 0 ? Math.floor(areaConstruida / areaBloqueta) : 0;
    const volBloquetas = cantBloquetas * volBloquetaUnit;

    // 7. Volumen losa aligerada
    const volLosa = Math.max(0, volumenMacizo - volBloquetas);

    // 8. Vigas peraltadas
    let volVigas = 0;
    state.vigas.forEach(viga => {
        const largo = getVal(`viga-largo-${viga.id}`);
        const ancho = getVal(`viga-ancho-${viga.id}`);
        const alto = getVal(`viga-alto-${viga.id}`);
        volVigas += largo * ancho * alto;
    });

    // 9. Escalera
    let volEscalera = 0;
    let escaleraInfo = null;
    const usaEscalera = document.getElementById('checkEscalera').checked;
    if (usaEscalera) {
        const alturaE = getVal('escaleraAltura');
        const longitudE = getVal('escaleraLongitud');
        const anchoE = getVal('escaleraAncho');
        const espesorE = getVal('escaleraEspesor');
        const contrapasoE = getVal('escaleraContrapaso');
        const pasoE = getVal('escaleraPaso');

        // Longitud inclinada (hipotenusa)
        const longInclinada = Math.sqrt(longitudE * longitudE + alturaE * alturaE);

        // Volumen losa inclinada
        const volLosaEscalera = longInclinada * anchoE * espesorE;

        // Número de pasos y volumen de peldaños
        const numPasos = contrapasoE > 0 ? Math.round(alturaE / contrapasoE) : 0;
        const volPeldanos = (contrapasoE * pasoE / 2) * anchoE * numPasos;

        volEscalera = volLosaEscalera + volPeldanos;

        escaleraInfo = {
            longInclinada: longInclinada.toFixed(2),
            volLosa: volLosaEscalera.toFixed(3),
            numPasos,
            volPeldanos: volPeldanos.toFixed(3),
            total: volEscalera.toFixed(3)
        };
    }

    // 10. Bomba pluma
    const usaBomba = document.getElementById('checkBomba').checked;
    const ajusteBomba = usaBomba ? CONFIG.bombaAjuste : 0;

    // 11. TOTAL
    const totalConcreto = volLosa + volVigas + volEscalera + ajusteBomba;

    // Store result
    const resultado = {
        areaBruta,
        areaDescuentos,
        areaConstruida,
        espesorLosa,
        volumenMacizo,
        cantBloquetas,
        volBloquetas,
        volLosa,
        volVigas,
        usaEscalera,
        volEscalera,
        escaleraInfo,
        usaBomba,
        ajusteBomba,
        totalConcreto,
        fc: state.fc
    };

    showResults(resultado);
}

// ===== SHOW RESULTS =====
function showResults(r) {
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    // Store for PDF/share
    lastResult = r;

    // Total
    const totalEl = document.getElementById('resultTotal');
    animateDecimal(totalEl, 0, r.totalConcreto, 800);

    // Desglose table
    const table = document.getElementById('desgloseTable');
    let rows = '';

    // Areas
    rows += row('Área bruta total', `${r.areaBruta.toFixed(2)} m²`);
    if (r.areaDescuentos > 0) {
        rows += row('(-) Descuentos', `- ${r.areaDescuentos.toFixed(2)} m²`, 'negative');
    }
    rows += row('Área construida', `${r.areaConstruida.toFixed(2)} m²`, 'subtotal');

    rows += divider();

    // Losa
    rows += row('Espesor de losa', `${r.espesorLosa} m`, 'info');
    rows += row('Volumen macizo (área × espesor)', `${r.volumenMacizo.toFixed(3)} m³`);
    rows += row(`Bloquetas: ${r.cantBloquetas} unidades`, `- ${r.volBloquetas.toFixed(3)} m³`, 'negative');
    rows += row('Volumen losa aligerada', `${r.volLosa.toFixed(3)} m³`, 'subtotal');

    // Vigas
    if (r.volVigas > 0) {
        rows += divider();
        rows += row(`Vigas peraltadas (${state.vigas.length})`, `${r.volVigas.toFixed(3)} m³`);
    }

    // Escalera
    if (r.usaEscalera && r.volEscalera > 0) {
        rows += divider();
        rows += row(`Escalera (${r.escaleraInfo.numPasos} pasos)`, `${r.volEscalera.toFixed(3)} m³`);
    }

    // Bomba
    if (r.usaBomba) {
        rows += divider();
        rows += row('Ajuste bomba pluma (batea)', `+ ${r.ajusteBomba.toFixed(2)} m³`, 'info');
    }

    // Total
    rows += divider();
    rows += row('TOTAL CONCRETO', `${r.totalConcreto.toFixed(2)} m³`, 'total');

    table.innerHTML = rows;

    // Price
    const priceRange = CONFIG.prices[r.fc];
    const minPrice = Math.round(r.totalConcreto * priceRange.min);
    const maxPrice = Math.round(r.totalConcreto * priceRange.max);
    document.getElementById('priceMin').textContent = minPrice.toLocaleString();
    document.getElementById('priceMax').textContent = maxPrice.toLocaleString();

    // Mixer
    const mixerCount = Math.ceil(r.totalConcreto / CONFIG.mixerCapacity);
    document.getElementById('mixerCount').textContent = mixerCount;

    // WhatsApp — use onclick with window.open for reliable new tab
    const msg = buildWhatsAppMessage(r);
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    const waBtn = document.getElementById('whatsappBtn');
    waBtn.href = waUrl;
    waBtn.onclick = function (e) {
        e.preventDefault();
        window.open(waUrl, '_blank');
    };

    // Action Buttons Actions
    document.getElementById('pdfBtn').onclick = downloadPDF;
    document.getElementById('shareBtn').onclick = shareQuotation;

    // Auto-save to history
    lastQuotationId = saveQuotation(r);
    showToast('Cotización guardada automáticamente');

    // Scroll on mobile
    if (window.innerWidth <= 900) {
        document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function row(label, value, cls = '') {
    return `<div class="desglose-row ${cls}"><span class="dl">${label}</span><span class="dv">${value}</span></div>`;
}

function divider() {
    return '<div class="desglose-divider"></div>';
}

// ===== WHATSAPP MESSAGE =====
function buildWhatsAppMessage(r) {
    let msg = `🏗️ *METRADO DE LOSA ALIGERADA*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `📐 *ÁREAS*\n`;
    msg += `   Área bruta: ${r.areaBruta.toFixed(2)} m²\n`;
    if (r.areaDescuentos > 0) {
        msg += `   Descuentos: -${r.areaDescuentos.toFixed(2)} m²\n`;
    }
    msg += `   *Área construida: ${r.areaConstruida.toFixed(2)} m²*\n\n`;

    msg += `🧱 *LOSA ALIGERADA*\n`;
    msg += `   Espesor: ${r.espesorLosa} m\n`;
    msg += `   Vol. macizo: ${r.volumenMacizo.toFixed(3)} m³\n`;
    msg += `   Bloquetas: ${r.cantBloquetas} unidades\n`;
    msg += `   (-) Vol. bloquetas: ${r.volBloquetas.toFixed(3)} m³\n`;
    msg += `   *Vol. losa: ${r.volLosa.toFixed(3)} m³*\n\n`;

    if (r.volVigas > 0) {
        msg += `📏 *VIGAS PERALTADAS*\n`;
        msg += `   ${state.vigas.length} viga(s): ${r.volVigas.toFixed(3)} m³\n\n`;
    }

    if (r.usaEscalera && r.volEscalera > 0) {
        msg += `🪜 *ESCALERA*\n`;
        msg += `   ${r.escaleraInfo.numPasos} pasos\n`;
        msg += `   Vol. escalera: ${r.volEscalera.toFixed(3)} m³\n\n`;
    }

    if (r.usaBomba) {
        msg += `🔧 *BOMBA PLUMA*\n`;
        msg += `   Ajuste batea: +${r.ajusteBomba} m³\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `📊 *TOTAL: ${r.totalConcreto.toFixed(2)} m³*\n`;
    msg += `🧱 Resistencia: f'c ${r.fc} kg/cm²\n`;
    msg += `🚛 Mixers: ${Math.ceil(r.totalConcreto / CONFIG.mixerCapacity)} camión(es)\n\n`;

    const priceRange = CONFIG.prices[r.fc];
    const minP = Math.round(r.totalConcreto * priceRange.min);
    const maxP = Math.round(r.totalConcreto * priceRange.max);
    msg += `💰 *Precio est.: S/ ${minP.toLocaleString()} — S/ ${maxP.toLocaleString()}*\n\n`;
    msg += `Calculado en ${CONFIG.businessName}\n`;
    msg += `¡Quiero confirmar mi cotización! 🙋‍♂️`;

    return msg;
}

// ===== PDF GENERATION =====
function generatePDF(r) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const qid = lastQuotationId || generateQuotationId();

    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = margin;

    // --- HEADER with orange accent bar ---
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageW, 4, 'F');

    // Logo text
    y = 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22);
    doc.text('ConcreTEC', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Concreto Premezclado — Metrado Profesional', margin, y + 6);

    // Quotation ID and date (right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(249, 115, 22);
    doc.text(qid, pageW - margin, y - 2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${dateStr}  ${timeStr}`, pageW - margin, y + 5, { align: 'right' });

    // Separator
    y += 14;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // --- TITLE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text('COTIZACIÓN DE CONCRETO PREMEZCLADO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Losa Aligerada — Metrado de Obra', margin, y);
    y += 12;

    // --- DESGLOSE ---
    function sectionTitle(title) {
        doc.setFillColor(249, 115, 22);
        doc.rect(margin, y - 4, 3, 14, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(title, margin + 7, y + 4);
        y += 14;
    }

    function dataRow(label, value, bold = false) {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(10);
        doc.setTextColor(bold ? 30 : 80, bold ? 30 : 80, bold ? 30 : 80);
        doc.text(label, margin + 7, y);
        doc.text(value, pageW - margin, y, { align: 'right' });
        y += 6;
    }

    function separator() {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(margin + 7, y - 2, pageW - margin, y - 2);
        y += 3;
    }

    // AREAS
    sectionTitle('ÁREAS');
    dataRow('Área bruta total', `${r.areaBruta.toFixed(2)} m²`);
    if (r.areaDescuentos > 0) {
        dataRow('(-) Descuentos', `- ${r.areaDescuentos.toFixed(2)} m²`);
    }
    dataRow('Área construida', `${r.areaConstruida.toFixed(2)} m²`, true);
    y += 4;

    // LOSA
    sectionTitle('LOSA ALIGERADA');
    dataRow('Espesor de losa', `${r.espesorLosa} m`);
    dataRow('Volumen macizo (área × espesor)', `${r.volumenMacizo.toFixed(3)} m³`);
    dataRow(`Bloquetas: ${r.cantBloquetas} unidades`, `- ${r.volBloquetas.toFixed(3)} m³`);
    dataRow('Volumen losa aligerada', `${r.volLosa.toFixed(3)} m³`, true);
    y += 4;

    // VIGAS
    if (r.volVigas > 0) {
        sectionTitle('VIGAS PERALTADAS');
        dataRow(`${state.vigas.length} viga(s)`, `${r.volVigas.toFixed(3)} m³`, true);
        y += 4;
    }

    // ESCALERA
    if (r.usaEscalera && r.volEscalera > 0) {
        sectionTitle('ESCALERA');
        dataRow(`${r.escaleraInfo.numPasos} pasos`, `${r.volEscalera.toFixed(3)} m³`, true);
        y += 4;
    }

    // BOMBA
    if (r.usaBomba) {
        sectionTitle('BOMBA PLUMA');
        dataRow('Ajuste batea', `+ ${r.ajusteBomba.toFixed(2)} m³`);
        y += 4;
    }

    // --- TOTAL BOX ---
    y += 2;
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(margin, y - 4, contentW, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL CONCRETO', margin + 10, y + 6);
    doc.setFontSize(16);
    doc.text(`${r.totalConcreto.toFixed(2)} m³`, pageW - margin - 10, y + 6, { align: 'right' });
    y += 24;

    // --- DETAILS ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    dataRow('Resistencia', `f'c ${r.fc} kg/cm²`);
    const mixers = Math.ceil(r.totalConcreto / CONFIG.mixerCapacity);
    dataRow('Camiones mixer estimados', `${mixers} camión(es) de 8 m³`);
    y += 4;

    // --- PRICE ---
    const priceRange = CONFIG.prices[r.fc];
    const minP = Math.round(r.totalConcreto * priceRange.min);
    const maxP = Math.round(r.totalConcreto * priceRange.max);

    doc.setFillColor(255, 247, 237);
    doc.roundedRect(margin, y - 4, contentW, 22, 3, 3, 'F');
    doc.setDrawColor(249, 200, 150);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y - 4, contentW, 22, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 90, 10);
    doc.text('PRECIO ESTIMADO', margin + 8, y + 4);
    doc.setFontSize(14);
    doc.setTextColor(200, 80, 0);
    doc.text(`S/ ${minP.toLocaleString()} — S/ ${maxP.toLocaleString()}`, pageW - margin - 8, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 120, 80);
    doc.text('* Precio referencial. El precio final depende de la distancia y acceso a la obra.', margin + 8, y + 13);
    y += 30;

    // --- FOOTER ---
    separator();
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(249, 115, 22);
    doc.text('ConcreTEC', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Concreto Premezclado', margin + 30, y);
    y += 6;
    doc.text('WhatsApp: 901 399 575', margin, y);
    y += 5;
    doc.text('Huancayo, Junín — Perú', margin, y);
    y += 5;
    doc.text('Plantas: Zona 3 de Diciembre', margin, y);

    // Bottom accent bar
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 293, pageW, 4, 'F');

    return doc;
}

function downloadPDF() {
    if (!lastResult) return;

    const doc = generatePDF(lastResult);
    const qid = lastQuotationId || 'cotizacion';
    const filename = `${qid}_ConcreTEC.pdf`;

    // Generate blob for sharing
    const pdfBlob = doc.output('blob');

    // Check if Web Share API with files is supported (mobile)
    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        navigator.share({
            title: `Cotización ConcreTEC — ${lastResult.totalConcreto.toFixed(2)} m³`,
            text: `Metrado de losa aligerada: ${lastResult.totalConcreto.toFixed(2)} m³ de concreto f'c ${lastResult.fc}`,
            files: [file]
        }).catch(() => {
            // User cancelled share, just download
            doc.save(filename);
        });
    } else {
        // Desktop or no share support: direct download
        doc.save(filename);
    }

    showToast('📄 PDF generado');
}

// ===== SHARE QUOTATION (text via Web Share API) =====
function shareQuotation() {
    if (!lastResult) return;

    const msg = buildWhatsAppMessage(lastResult);

    // Try native share first
    if (navigator.share) {
        navigator.share({
            title: `Cotización ConcreTEC`,
            text: msg
        }).catch(() => {
            // Fallback to WhatsApp
            const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
        });
    } else {
        // No share API: open WhatsApp without specific number so user picks contact
        const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    }
}

// ===== QUOTATION HISTORY (localStorage) =====
function generateQuotationId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const history = getHistory();
    const todayCount = history.filter(q => q.id.includes(dateStr)).length + 1;
    return `CT-${dateStr}-${String(todayCount).padStart(3, '0')}`;
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem('concretec_history') || '[]');
    } catch { return []; }
}

function saveQuotation(r) {
    const history = getHistory();
    const id = generateQuotationId();
    const now = new Date();

    const priceRange = CONFIG.prices[r.fc];
    const minP = Math.round(r.totalConcreto * priceRange.min);
    const maxP = Math.round(r.totalConcreto * priceRange.max);

    const entry = {
        id,
        timestamp: now.toISOString(),
        totalConcreto: r.totalConcreto,
        fc: r.fc,
        areaConstruida: r.areaConstruida,
        mixers: Math.ceil(r.totalConcreto / CONFIG.mixerCapacity),
        precioMin: minP,
        precioMax: maxP,
        resultado: r // Full result for re-opening
    };

    history.unshift(entry); // newest first

    // Keep max 50 entries
    if (history.length > 50) history.pop();

    localStorage.setItem('concretec_history', JSON.stringify(history));
    renderHistoryBadge();
    return id;
}

function renderHistoryBadge() {
    const history = getHistory();
    const badge = document.getElementById('historyBadge');
    if (!badge) return;
    if (history.length > 0) {
        badge.textContent = history.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal.classList.contains('hidden')) {
        renderHistory();
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function renderHistory() {
    const history = getHistory();
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = `
            <div class="history-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>Aún no tienes cotizaciones guardadas.<br>Calcula un metrado y se guardará automáticamente aquí.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(q => {
        const date = new Date(q.timestamp);
        const dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="history-card">
                <div class="history-card-header">
                    <span class="history-card-id">${q.id}</span>
                    <span class="history-card-date">${dateStr} · ${timeStr}</span>
                </div>
                <div class="history-card-data">
                    <div class="history-data-item">
                        <span class="history-data-label">Volumen</span>
                        <span class="history-data-value">${q.totalConcreto.toFixed(2)} m³</span>
                    </div>
                    <div class="history-data-item">
                        <span class="history-data-label">Resistencia</span>
                        <span class="history-data-value">f'c ${q.fc}</span>
                    </div>
                    <div class="history-data-item">
                        <span class="history-data-label">Precio est.</span>
                        <span class="history-data-value">S/ ${q.precioMin.toLocaleString()}</span>
                    </div>
                </div>
                <div class="history-card-actions">
                    <button class="history-action-btn" onclick="historyDownloadPDF('${q.id}')">📄 PDF</button>
                    <button class="history-action-btn" onclick="historyShare('${q.id}')">📲 Compartir</button>
                    <button class="history-action-btn delete" onclick="deleteQuotation('${q.id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function historyDownloadPDF(id) {
    const history = getHistory();
    const entry = history.find(q => q.id === id);
    if (!entry || !entry.resultado) return;

    const prevId = lastQuotationId;
    const prevResult = lastResult;

    lastResult = entry.resultado;
    lastQuotationId = entry.id;
    downloadPDF();

    lastResult = prevResult;
    lastQuotationId = prevId;
}

function historyShare(id) {
    const history = getHistory();
    const entry = history.find(q => q.id === id);
    if (!entry || !entry.resultado) return;

    const prevResult = lastResult;
    lastResult = entry.resultado;
    shareQuotation();
    lastResult = prevResult;
}

function deleteQuotation(id) {
    let history = getHistory();
    history = history.filter(q => q.id !== id);
    localStorage.setItem('concretec_history', JSON.stringify(history));
    renderHistoryBadge();
    renderHistory();
    showToast('Cotización eliminada');
}

// ===== TOAST NOTIFICATION =====
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    msgEl.textContent = message;

    if (toastTimeout) clearTimeout(toastTimeout);

    toast.classList.remove('hidden');
    // Force reflow
    toast.offsetHeight;
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 400);
    }, 3000);
}

// ===== RESET =====
function resetCalculator() {
    document.getElementById('resultsPlaceholder').classList.remove('hidden');
    document.getElementById('resultsContent').classList.add('hidden');

    // Reset state
    state.areas = [];
    state.descuentos = [];
    state.vigas = [];
    state.nextId = 1;
    lastResult = null;
    lastQuotationId = null;

    // Reset inputs
    document.getElementById('espesorLosa').value = '0.20';
    document.getElementById('bloquetaLargo').value = '0.30';
    document.getElementById('bloquetaAncho').value = '0.30';
    document.getElementById('bloquetaAlto').value = '0.15';
    document.getElementById('checkEscalera').checked = false;
    document.getElementById('escaleraFields').classList.add('hidden');
    document.getElementById('checkBomba').checked = false;

    // Reset resistance
    document.querySelectorAll('.resistance-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('fc-210').classList.add('active');
    state.fc = 210;

    // Re-add initial zone
    addZone('area');
    renderDescuentos();
    renderVigas();
    updateSubtotals();

    if (window.innerWidth <= 900) {
        document.getElementById('cotizador').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===== UTILITIES =====
function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseFloat(el.value);
    return isNaN(v) ? 0 : v;
}

function highlightError(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('error');
        el.focus();
        setTimeout(() => el.classList.remove('error'), 1500);
    }
}

function animateDecimal(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;
        el.textContent = current.toFixed(2);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ===== PARTICLES =====
function initParticles() {
    const container = document.getElementById('particles');
    const count = window.innerWidth < 600 ? 10 : 20;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        container.appendChild(p);
    }
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ===== CLOSE MODAL ON OVERLAY CLICK =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        toggleHistoryModal();
    }
});
