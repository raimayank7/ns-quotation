/* NS documents: the editor, live A4 preview, saving and history for every document site.
   A site picks its document type with <section id="tool" data-doc="invoice">.
   Screen text comes from NS.t (the user's language); the printed document is always in English. */
(function () {
  'use strict';
  var $ = NS.$, $$ = NS.$$, esc = NS.esc, num = NS.num, r2 = NS.r2, t = NS.t;

  var TYPES = {
    invoice: { prefix: 'INV', kinds: ['tax', 'supply', 'plain'], due: true, copy: true, rc: true, qr: true, pay: true },
    /* quotation site: two kinds with their own number series, GST shown or not, a validity date, and "Make invoice" */
    quote: { prefix: 'QT', prefixes: { quote: 'QT', estimate: 'EST' }, kinds: ['quote', 'estimate'], valid: true, gstFlag: true, status: ['open', 'acc', 'dec', 'inv'], toInvoice: true }
  };
  var BILLING = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8861/' : 'https://billing.niveshsahayak.in/';

  /* words printed on the document (English only, readable by every buyer, bank and tax officer) */
  var P = { tax: 'TAX INVOICE', supply: 'BILL OF SUPPLY', plain: 'INVOICE', no: 'Invoice No.', date: 'Date', due: 'Due date', pos: 'Place of supply', rc: 'Reverse charge', ref: 'Order ref.', billto: 'Bill to', shipto: 'Ship to', gstin: 'GSTIN', ph: 'Phone', item: 'Item / service', hsn: 'HSN/SAC', qty: 'Qty', rate: 'Rate', disc: 'Disc.', taxable: 'Taxable value', gst: 'GST', amount: 'Amount', subtotal: 'Taxable value', cgst: 'CGST', sgst: 'SGST', igst: 'IGST', round: 'Round off', total: 'Total', words: 'Amount in words', summary: 'Tax summary', bank: 'Bank details', acc: 'A/c no.', ifsc: 'IFSC', branch: 'Branch', upi: 'Scan to pay by UPI', notes: 'Notes', terms: 'Terms and conditions', for: 'For', sign: 'Authorised signatory', yes: 'Yes', no2: 'No', supplynote: 'Composition taxable person, not eligible to collect tax on supplies.', quote: 'QUOTATION', estimate: 'ESTIMATE', qno: 'Quotation No.', eno: 'Estimate No.', valid: 'Valid until', qref: 'Enquiry ref.', qfor: 'Quotation for', efor: 'Estimate for', price: 'Amount', qnote: 'This is a quotation, not a tax invoice.', enote: 'This is an estimate. The final bill may differ.', paid: 'PAID', orig: 'Original for recipient', dup: 'Duplicate for transporter', trip: 'Triplicate for supplier' };
  var UNITS = ['Nos', 'Pcs', 'Kg', 'Gm', 'Ltr', 'Ml', 'Mtr', 'Sq ft', 'Box', 'Pack', 'Set', 'Pair', 'Dozen', 'Bag', 'Ton', 'Hrs', 'Days', 'Month', 'Job'];
  var RATES = [0, 0.25, 3, 5, 12, 18, 28, 40];
  var ACCENTS = ['#0B3B5B', '#1D4ED8', '#047857', '#B45309', '#9D174D', '#334155'];
  var UT = { '04': 1, '26': 1, '31': 1, '35': 1, '38': 1 }; /* Union Territories without a legislature charge UTGST */

  var root, T, type, doc, editingId = null, sheet;
  /* settings made in the Configuration Hub (my.niveshsahayak.in), shared through the data home */
  var CFG = {}, lastAuto = '';
  function dset() {
    if (type === 'invoice') return CFG.invoice || {};
    /* the invoice defaults (GST rate, unit, colour, round off) also serve the other documents */
    var inv = CFG.invoice || {}, base = { gst: inv.gst, unit: inv.unit, round: inv.round, accent: inv.accent };
    return Object.assign(base, CFG[type] || {});
  }
  function taxOn(d) { return T.gstFlag ? d.withGst !== false : d.kind === 'tax'; }
  function W() { return { doc: t('doc.' + type), docs: t('docs.' + type), Doc: t('Doc.' + type) }; }
  function tw(k, v) { return t(k, Object.assign(W(), v || {})); }

  function blank() {
    var c = dset();
    return {
      type: type, kind: c.kind || T.kinds[0], no: '', date: NS.today(), due: '', pos: '', rc: false, ref: '',
      seller: { name: '', addr: '', city: '', pin: '', state: '', gstin: '', phone: '', email: '', logo: '', sign: '', bankName: '', bankAcc: '', bankIfsc: '', bankBranch: '', upi: '' },
      buyer: { name: '', addr: '', city: '', pin: '', state: '', gstin: '', phone: '' }, ship: null, einv: null, irn: null,
      items: [{ desc: '', hsn: '', qty: 1, unit: c.unit || 'Nos', rate: '', disc: '', gst: c.gst != null && c.gst !== '' ? +c.gst : 18 }],
      round: c.round !== false, comp: true, notes: c.notes || '', terms: c.terms || '', accent: c.accent || ACCENTS[0],
      status: T.status ? T.status[0] : 'unpaid', copyLabel: T.copy ? 'orig' : '', withGst: T.gstFlag ? true : undefined, valid: ''
    };
  }

  /* ---------- totals ---------- */
  function totals(d) {
    var noTax = !taxOn(d);
    var origin = d.seller.state, dest = d.pos || d.buyer.state || origin;
    var intra = !origin || !dest || origin === dest;
    var tt = { rows: [], taxable: 0, cgst: 0, sgst: 0, igst: 0, intra: intra, noTax: noTax, sum: {} };
    d.items.forEach(function (it) {
      var q = num(it.qty), rate = num(it.rate);
      if (!it.desc && !rate) return;
      var gross = q * rate, disc = gross * num(it.disc) / 100, taxable = r2(gross - disc);
      var g = noTax ? 0 : num(it.gst), tax = r2(taxable * g / 100);
      tt.rows.push({ it: it, taxable: taxable, g: g, tax: tax, amount: r2(taxable + tax) });
      tt.taxable += taxable;
      if (!noTax) {
        if (intra) { tt.cgst += tax / 2; tt.sgst += tax / 2; } else tt.igst += tax;
        var k = (it.hsn || '—') + '|' + g;
        var s = tt.sum[k] || (tt.sum[k] = { hsn: it.hsn || '—', g: g, taxable: 0, tax: 0 });
        s.taxable += taxable; s.tax += tax;
      }
    });
    tt.taxable = r2(tt.taxable); tt.cgst = r2(tt.cgst); tt.sgst = r2(tt.sgst); tt.igst = r2(tt.igst);
    var total = r2(tt.taxable + tt.cgst + tt.sgst + tt.igst);
    tt.roundOff = d.round ? r2(Math.round(total) - total) : 0;
    tt.grand = r2(total + tt.roundOff);
    return tt;
  }
  function sgstName(d) { return UT[d.seller.state] && totals(d).intra ? 'UTGST' : 'SGST'; }

  /* ---------- extensions (e-invoice and e-way bill files): NS.docExt.push({ editor, wire, fill, sheet, drawn }) ---------- */
  var API = {
    doc: function () { return doc; }, totals: function () { return totals(doc); }, type: function () { return type; },
    changed: function () { draw(); saveDraft(); }, field: function (id, label, o) { return field(id, label, o); }, showTab: function (w) { showTab(w); }
  };
  function ext(hook, arg) {
    return (NS.docExt || []).map(function (x) { try { return x[hook] ? x[hook](arg, API) || '' : ''; } catch (e) { console.error(e); return ''; } });
  }

  /* ---------- editor ---------- */
  function stateOptions(first) {
    return '<option value="">' + esc(first) + '</option>' + NS.STATES.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + ' (' + s[0] + ')</option>'; }).join('');
  }
  function field(id, label, o) {
    o = o || {};
    var type_ = o.type || 'text', hint = o.hint ? '<small class="hint">' + esc(o.hint) + '</small>' : '';
    var input = type_ === 'textarea' ? '<textarea id="' + id + '" rows="' + (o.rows || 2) + '" dir="auto" placeholder="' + esc(o.ph || '') + '"></textarea>'
      : type_ === 'state' ? '<select id="' + id + '"></select>'
      : '<input id="' + id + '" type="' + type_ + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + ' placeholder="' + esc(o.ph || '') + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.ltr ? ' dir="ltr"' : ' dir="auto"') + '>';
    return '<div class="f' + (o.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + input + hint + '<small class="err" id="' + id + '-err" hidden></small></div>';
  }
  function buildEditor() {
    var ed = $('#ed', root);
    var hub = (window.NS_CFG && NS_CFG.vault ? new URL(NS_CFG.vault, location.href).origin : 'https://my.niveshsahayak.in') + '/';
    ed.innerHTML =
      '<p class="hub-link"><a href="' + hub + '" target="_blank" rel="noopener">' + esc(t('hub.link')) + ' ›</a></p>' +
      '<fieldset class="card"><legend>' + esc(t('lg.biz')) + '</legend><div class="fg">' +
        field('s-name', t('l.bname'), { ph: t('ph.bname'), wide: true, hint: t('h.bname') }) +
        field('s-addr', t('l.addr'), { type: 'textarea', wide: true, ph: t('ph.addr') }) +
        field('s-city', t('l.city'), {}) + field('s-pin', t('l.pin'), { mode: 'numeric', max: 6, ltr: 1, hint: type === 'invoice' ? t('h.pin') : '' }) +
        field('s-state', t('l.state'), { type: 'state' }) +
        field('s-gstin', t('l.gstin'), { ph: t('ph.gstin'), max: 15, ltr: 1 }) +
        field('s-phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
        field('s-email', t('l.email'), { type: 'email', ltr: 1 }) +
      '</div><details class="more"><summary>' + esc(t('more')) + '</summary><div class="fg">' +
        '<div class="f"><label for="s-logo">' + esc(t('l.logo')) + '</label><input id="s-logo" type="file" accept="image/*"><button type="button" class="link" data-clear="logo" hidden>' + esc(t('rm.logo')) + '</button></div>' +
        '<div class="f"><label for="s-sign">' + esc(t('l.sign')) + '</label><input id="s-sign" type="file" accept="image/*"><button type="button" class="link" data-clear="sign" hidden>' + esc(t('rm.sign')) + '</button></div>' +
        field('s-bankName', t('l.bank')) + field('s-bankAcc', t('l.acc'), { mode: 'numeric', ltr: 1 }) +
        field('s-bankIfsc', t('l.ifsc'), { max: 11, ltr: 1 }) + field('s-bankBranch', t('l.branch')) +
        field('s-upi', t('l.upi'), { ph: 'name@bank', wide: true, ltr: 1 }) +
      '</div></details></fieldset>' +

      '<fieldset class="card"><legend>' + esc(tw('lg.details')) + '</legend><div class="fg">' +
        '<div class="f wide"><label for="d-kind">' + esc(t('l.type')) + '</label><select id="d-kind">' + T.kinds.map(function (k) { return '<option value="' + k + '">' + esc(t('k.' + k)) + '</option>'; }).join('') + '</select><small class="hint" id="kind-hint"></small></div>' +
        (T.gstFlag ? '<div class="f wide"><label class="chk"><input id="d-gst" type="checkbox"> ' + esc(t('l.withgst')) + '</label><small class="hint">' + esc(t('h.withgst')) + '</small></div>' : '') +
        '<div class="f wide" id="comp-box" hidden><label class="chk"><input id="d-comp" type="checkbox"> ' + esc(t('comp')) + '</label></div>' +
        field('d-no', tw('l.no'), { max: 16, hint: T.valid ? t('h.qno') : t('h.no'), ltr: 1 }) +
        field('d-date', t('l.date'), { type: 'date' }) +
        (T.due ? field('d-due', t('l.due'), { type: 'date' }) : '') +
        (T.valid ? field('d-valid', t('l.valid'), { type: 'date', hint: t('h.valid') }) : '') +
        field('d-pos', t('l.pos'), { type: 'state', hint: t('h.pos') }) +
        field('d-ref', T.valid ? t('l.qref') : t('l.ref'), {}) +
        (T.rc ? '<div class="f"><label class="chk"><input id="d-rc" type="checkbox"> ' + esc(t('l.rc')) + '</label></div>' : '') +
      '</div></fieldset>' +

      '<fieldset class="card"><legend>' + esc(t(T.valid ? 'lg.qto' : 'lg.billto')) + '</legend><div class="fg">' +
        field('b-name', t('l.cname'), { ph: t('ph.cname'), wide: true, hint: t('h.cname') }) +
        field('b-addr', t('l.addr'), { type: 'textarea', wide: true }) +
        field('b-city', t('l.city'), {}) + field('b-pin', t('l.pin'), { mode: 'numeric', max: 6, ltr: 1, hint: type === 'invoice' ? t('h.pin') : '' }) +
        field('b-state', t('l.state'), { type: 'state' }) +
        field('b-gstin', t('l.cgstin'), { max: 15, ltr: 1 }) +
        field('b-phone', t('l.phone'), { type: 'tel', mode: 'tel', ltr: 1 }) +
        '<div class="f"><label class="chk"><input id="b-ship" type="checkbox"> ' + esc(t('l.ship')) + '</label></div>' +
      '</div><div class="fg" id="ship-box" hidden>' +
        field('sh-name', t('l.shname'), { wide: true }) + field('sh-addr', t('l.shaddr'), { type: 'textarea', wide: true }) + field('sh-city', t('l.shcity'), {}) + field('sh-pin', t('l.shpin'), { mode: 'numeric', max: 6, ltr: 1 }) + field('sh-state', t('l.shstate'), { type: 'state' }) +
      '</div></fieldset>' +

      '<fieldset class="card"><legend>' + esc(t('lg.items')) + '</legend><div id="items" class="items"></div>' +
        '<button type="button" class="btn" id="add-item">' + esc(t('add.item')) + '</button>' +
        '<datalist id="dl-units">' + UNITS.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist>' +
        '<datalist id="dl-rates">' + RATES.map(function (u) { return '<option value="' + u + '">'; }).join('') + '</datalist>' +
        '<div class="sums" id="ed-sums" aria-live="polite"></div>' +
      '</fieldset>' +

      '<fieldset class="card"><legend>' + esc(t('lg.notes')) + '</legend><div class="fg">' +
        field('d-notes', t('l.notes'), { type: 'textarea', wide: true, ph: t('ph.notes') }) +
        field('d-terms', t('l.terms'), { type: 'textarea', wide: true, ph: t(T.valid ? 'ph.qterms' : 'ph.terms') }) +
        (T.copy ? '<div class="f"><label for="d-copy">' + esc(t('l.copy')) + '</label><select id="d-copy"><option value="orig">' + esc(t('cp.orig')) + '</option><option value="dup">' + esc(t('cp.dup')) + '</option><option value="trip">' + esc(t('cp.trip')) + '</option><option value="">' + esc(t('cp.none')) + '</option></select></div>' : '') +
        (T.pay ? '<div class="f"><label for="d-status">' + esc(t('l.pay')) + '</label><select id="d-status"><option value="unpaid">' + esc(t('pay.unpaid')) + '</option><option value="paid">' + esc(t('pay.paid')) + '</option></select></div>'
          : '<div class="f"><label for="d-status">' + esc(t('l.qstat')) + '</label><select id="d-status">' + T.status.map(function (k) { return '<option value="' + k + '">' + esc(t('qs.' + k)) + '</option>'; }).join('') + '</select></div>') +
        '<div class="f"><span class="lbl" id="acc-lbl">' + esc(t('l.colour')) + '</span><div class="swatches" role="radiogroup" aria-labelledby="acc-lbl">' + ACCENTS.map(function (c, i) { return '<button type="button" role="radio" class="sw" data-accent="' + c + '" style="--c:' + c + '" aria-label="' + esc(t('colour.n', { n: i + 1 })) + '"></button>'; }).join('') + '</div></div>' +
        '<div class="f"><label class="chk"><input id="d-round" type="checkbox"> ' + esc(t('l.round')) + '</label></div>' +
        '<p class="hint wide print-note">' + esc(tw('print.en')) + '</p>' +
      '</div></fieldset>' +
      ext('editor').join('');

    $$('select[id$="state"]', ed).forEach(function (s) { s.innerHTML = stateOptions(t('choose.state')); });
    $('#d-pos', ed).innerHTML = stateOptions(t('same.buyer'));
    $('#add-item', ed).addEventListener('click', function () { doc.items.push({ desc: '', hsn: '', qty: 1, unit: dset().unit || 'Nos', rate: '', disc: '', gst: doc.items.length ? doc.items[doc.items.length - 1].gst : 18 }); renderItems(); var d = $$('#items .it-desc', ed); d[d.length - 1].focus(); });
    $$('[data-accent]', ed).forEach(function (b) { b.addEventListener('click', function () { doc.accent = b.getAttribute('data-accent'); fillForm(true); draw(); saveDraft(); }); });
    ['logo', 'sign'].forEach(function (k) {
      $('#s-' + k, ed).addEventListener('change', function (e) { var f = e.target.files[0]; if (f) shrink(f, k === 'logo' ? 360 : 420).then(function (u) { doc.seller[k] = u; fillForm(true); draw(); saveDraft(); }); });
      $('[data-clear="' + k + '"]', ed).addEventListener('click', function () { doc.seller[k] = ''; $('#s-' + k, ed).value = ''; fillForm(true); draw(); saveDraft(); });
    });
    NS.suggest($('#s-name', ed), function () { return NSStore.list('biz'); }, function (x) { return x.name; }, function (b) {
      doc.seller = Object.assign(blank().seller, b); delete doc.seller.id; delete doc.seller.created; delete doc.seller.updated;
      fillForm(); suggestNumber(true); draw(); saveDraft();
    });
    NS.suggest($('#b-name', ed), function () { return NSStore.list('party'); }, function (x) { return x.name; }, function (p) {
      doc.buyer = { name: p.name, addr: p.addr || '', city: p.city || '', pin: p.pin || '', state: p.state || '', gstin: p.gstin || '', phone: p.phone || '' };
      if (p.ship && p.ship.addr) doc.ship = { name: p.ship.name || p.name, addr: p.ship.addr, city: p.ship.city || '', pin: p.ship.pin || '', state: p.ship.state || p.state || '' };
      fillForm(); draw(); saveDraft();
    });
    ext('wire', ed);
  }

  function renderItems() {
    var box = $('#items', root);
    box.innerHTML = doc.items.map(function (it, i) {
      var id = function (k) { return 'it-' + k + '-' + i; };
      var f = function (k, lbl, extra) { return '<div class="f' + (k === 'gst' ? ' it-gst' : '') + '"><label for="' + id(k) + '">' + esc(lbl) + '</label><input id="' + id(k) + '" data-k="' + k + '" value="' + esc(it[k]) + '"' + (extra || '') + '></div>'; };
      return '<div class="it" data-i="' + i + '"><div class="it-head"><span>' + esc(t('it.n', { n: i + 1 })) + '</span>' + (doc.items.length > 1 ? '<button type="button" class="link" data-del="' + i + '">' + esc(t('it.rm')) + '</button>' : '') + '</div>' +
        '<div class="it-grid">' +
        '<div class="f it-d"><label for="' + id('desc') + '">' + esc(t('l.desc')) + '</label><input id="' + id('desc') + '" class="it-desc" data-k="desc" dir="auto" value="' + esc(it.desc) + '" placeholder="' + esc(t('ph.desc')) + '"></div>' +
        f('hsn', t('l.hsn'), ' inputmode="numeric" maxlength="8" dir="ltr"') + f('qty', t('l.qty'), ' inputmode="decimal" dir="ltr"') + f('unit', t('l.unit'), ' list="dl-units" dir="ltr"') +
        f('rate', t('l.rate'), ' inputmode="decimal" dir="ltr"') + f('disc', t('l.disc'), ' inputmode="decimal" dir="ltr"') + f('gst', t('l.gst'), ' inputmode="decimal" list="dl-rates" dir="ltr"') +
        '</div></div>';
    }).join('');
    $$('[data-del]', box).forEach(function (b) { b.addEventListener('click', function () { doc.items.splice(+b.getAttribute('data-del'), 1); renderItems(); draw(); saveDraft(); }); });
    $$('.it-desc', box).forEach(function (inp) {
      var i = +inp.closest('.it').getAttribute('data-i');
      NS.suggest(inp, function () { return NSStore.list('item'); }, function (x) { return x.desc; }, function (m) {
        var it = doc.items[i];
        it.desc = m.desc; it.hsn = m.hsn || ''; it.unit = m.unit || it.unit; if (m.rate != null) it.rate = m.rate; if (m.gst != null && m.gst !== '') it.gst = m.gst;
        renderItems(); draw(); saveDraft();
      });
    });
    $$('.it-gst', box).forEach(function (f) { f.hidden = !taxOn(doc); });
  }

  var SMAP = { 's-name': 'name', 's-addr': 'addr', 's-city': 'city', 's-pin': 'pin', 's-state': 'state', 's-gstin': 'gstin', 's-phone': 'phone', 's-email': 'email', 's-bankName': 'bankName', 's-bankAcc': 'bankAcc', 's-bankIfsc': 'bankIfsc', 's-bankBranch': 'bankBranch', 's-upi': 'upi' };
  var BMAP = { 'b-name': 'name', 'b-addr': 'addr', 'b-city': 'city', 'b-pin': 'pin', 'b-state': 'state', 'b-gstin': 'gstin', 'b-phone': 'phone' };
  var SHMAP = { 'sh-name': 'name', 'sh-addr': 'addr', 'sh-city': 'city', 'sh-pin': 'pin', 'sh-state': 'state' };
  var DMAP = { 'd-kind': 'kind', 'd-no': 'no', 'd-date': 'date', 'd-due': 'due', 'd-valid': 'valid', 'd-pos': 'pos', 'd-ref': 'ref', 'd-notes': 'notes', 'd-terms': 'terms', 'd-status': 'status', 'd-copy': 'copyLabel' };

  function fillForm(onlyLook) {
    var ed = $('#ed', root);
    if (!onlyLook) {
      Object.keys(SMAP).forEach(function (id) { var e = $('#' + id, ed); if (e) e.value = doc.seller[SMAP[id]] || ''; });
      Object.keys(BMAP).forEach(function (id) { $('#' + id, ed).value = doc.buyer[BMAP[id]] || ''; });
      Object.keys(DMAP).forEach(function (id) { var e = $('#' + id, ed); if (e) e.value = doc[DMAP[id]] == null ? '' : doc[DMAP[id]]; });
      if ($('#d-rc', ed)) $('#d-rc', ed).checked = !!doc.rc;
      if ($('#d-gst', ed)) $('#d-gst', ed).checked = doc.withGst !== false;
      $('#d-round', ed).checked = !!doc.round; $('#d-comp', ed).checked = doc.comp !== false;
      $('#b-ship', ed).checked = !!doc.ship; $('#ship-box', ed).hidden = !doc.ship;
      if (doc.ship) Object.keys(SHMAP).forEach(function (id) { $('#' + id, ed).value = doc.ship[SHMAP[id]] || ''; });
      renderItems();
      ['s-gstin', 'b-gstin'].forEach(checkGstin);
      ext('fill', ed);
    }
    $$('[data-accent]', ed).forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-accent') === doc.accent)); });
    $('[data-clear="logo"]', ed).hidden = !doc.seller.logo; $('[data-clear="sign"]', ed).hidden = !doc.seller.sign;
    $('#kind-hint', ed).textContent = t('kh.' + doc.kind);
    $$('.it-gst', ed).forEach(function (f) { f.hidden = !taxOn(doc); });
    $('#comp-box', ed).hidden = doc.kind !== 'supply';
  }

  function checkGstin(id) {
    var inp = $('#' + id, root), err = $('#' + id + '-err', root), r = NS.gstinCheck(inp.value);
    err.hidden = r.ok; err.textContent = r.ok ? '' : r.msg;
    inp.setAttribute('aria-invalid', String(!r.ok));
    return r;
  }

  function onInput(e) {
    var el = e.target, id = el.id;
    if (SMAP[id]) doc.seller[SMAP[id]] = el.value;
    else if (BMAP[id]) doc.buyer[BMAP[id]] = el.value;
    else if (SHMAP[id]) { doc.ship = doc.ship || {}; doc.ship[SHMAP[id]] = el.value; }
    else if (DMAP[id]) doc[DMAP[id]] = el.value;
    else if (id === 'd-rc') doc.rc = el.checked;
    else if (id === 'd-gst') { doc.withGst = el.checked; fillForm(true); }
    else if (id === 'd-round') doc.round = el.checked;
    else if (id === 'd-comp') doc.comp = el.checked;
    else if (id === 'b-ship') { doc.ship = el.checked ? (doc.ship || { name: '', addr: '', city: '', pin: '', state: '' }) : null; $('#ship-box', root).hidden = !el.checked; }
    else if (el.getAttribute('data-k')) { var i = +el.closest('.it').getAttribute('data-i'); doc.items[i][el.getAttribute('data-k')] = el.value; }
    else return;
    if (id === 's-gstin' || id === 'b-gstin') {
      el.value = el.value.toUpperCase();
      var who = id[0] === 's' ? doc.seller : doc.buyer; who.gstin = el.value;
      var r = checkGstin(id);
      if (r.ok && r.state && !who.state && e.type === 'change') { who.state = r.state; $('#' + id[0] + '-state', root).value = r.state; }
    }
    if (id === 'd-kind') { fillForm(true); if (T.prefixes && !editingId) suggestNumber(false); }
    if (id === 'd-date' && e.type === 'change') suggestNumber(false);
    draw(); saveDraft();
  }

  /* ---------- numbering: prefix/FY/serial, one series per business and financial year ---------- */
  function suggestNumber(force) {
    if (editingId && !force) return Promise.resolve();
    var c = dset(), fy = NS.fy(doc.date), short = fy.slice(2, 4) + '-' + fy.slice(5);
    var pre = String(T.prefixes ? (c.prefixes || {})[doc.kind] || T.prefixes[doc.kind] : c.prefix != null ? c.prefix : T.prefix).trim().replace(/[^A-Za-z0-9\/\-]/g, '');
    var prefix = (pre ? pre + '/' : '') + (c.fy === false ? '' : short + '/'), digits = Math.min(6, Math.max(1, +c.digits || 3));
    return NSStore.list('doc').then(function (all) {
      var key = (doc.seller.name || '').trim().toLowerCase(), max = 0;
      all.forEach(function (d) {
        if (d.type !== doc.type || d.id === editingId || NS.fy(d.date) !== fy) return;
        if (T.prefixes && (d.kind || T.kinds[0]) !== doc.kind) return;
        if ((d.seller && d.seller.name || '').trim().toLowerCase() !== key) return;
        var m = String(d.no || '').match(/(\d+)\s*$/);
        if (m) max = Math.max(max, +m[1]);
      });
      if (force || !doc.no || doc.no === lastAuto || /^[A-Z]+\/\d\d-\d\d\/\d+$/.test(doc.no)) {
        doc.no = lastAuto = prefix + String(max + 1).padStart(digits, '0');
        var n = $('#d-no', root); if (n) n.value = doc.no;
        draw();
      }
    });
  }

  /* ---------- preview (English, like the printout) ---------- */
  function party(p, title) {
    if (!p || !(p.name || p.addr)) return '<div class="pt"><h4>' + title + '</h4><p class="ph">Customer name and address</p></div>';
    return '<div class="pt"><h4>' + title + '</h4><b>' + esc(p.name) + '</b>' + (p.addr ? '<p>' + esc(p.addr).replace(/\n/g, '<br>') + '</p>' : '') +
      (p.state ? '<p>' + esc(NS.stateName(p.state)) + ' (' + p.state + ')</p>' : '') +
      (p.gstin ? '<p>' + P.gstin + ': <b class="mono">' + esc(p.gstin) + '</b></p>' : '') +
      (p.phone ? '<p>' + P.ph + ': ' + esc(p.phone) + '</p>' : '') + '</div>';
  }
  function draw() {
    if (!sheet) return;
    var d = doc, s = d.seller, tt = totals(d), tax = taxOn(d), SG = sgstName(d), Q = !!T.valid, est = d.kind === 'estimate';
    var posCode = d.pos || d.buyer.state;
    var cols = tax ? 9 : 7;
    var h = '<div class="sh" style="--ac:' + esc(d.accent) + '" lang="en-IN" dir="ltr">' +
      (T.pay && d.status === 'paid' ? '<div class="stamp">' + P.paid + '</div>' : '') +
      '<header class="sh-top"><div class="sh-from">' + (s.logo ? '<img class="logo" src="' + s.logo + '" alt="">' : '') +
        '<div><h2>' + (s.name ? esc(s.name) : '<span class="ph">Your business name</span>') + '</h2>' +
        (s.addr ? '<p>' + esc(s.addr).replace(/\n/g, '<br>') + '</p>' : '<p class="ph">Address</p>') +
        (s.state ? '<p>' + esc(NS.stateName(s.state)) + ' (' + s.state + ')</p>' : '') +
        (s.gstin ? '<p>' + P.gstin + ': <b class="mono">' + esc(s.gstin) + '</b></p>' : '') +
        ((s.phone || s.email) ? '<p>' + [s.phone ? P.ph + ': ' + esc(s.phone) : '', esc(s.email)].filter(Boolean).join(' · ') + '</p>' : '') +
      '</div></div><div class="sh-title"><p class="dt">' + P[d.kind] + '</p>' + (T.copy && d.copyLabel ? '<p class="copy">' + P[d.copyLabel] + '</p>' : '') + '</div></header>' +
      ext('sheet', d).join('') +
      '<table class="meta"><tr><th>' + (Q ? (est ? P.eno : P.qno) : P.no) + '</th><td class="mono">' + esc(d.no) + '</td><th>' + P.date + '</th><td>' + NS.fmtDate(d.date) + '</td></tr>' +
        '<tr>' + (T.due ? '<th>' + P.due + '</th><td>' + NS.fmtDate(d.due) + '</td>' : T.valid ? '<th>' + P.valid + '</th><td>' + NS.fmtDate(d.valid) + '</td>' : '') + '<th>' + P.pos + '</th><td' + (T.due || T.valid ? '' : ' colspan="3"') + '>' + (posCode ? esc(NS.stateName(posCode)) + ' (' + posCode + ')' : '') + '</td></tr>' +
        (Q ? (d.ref ? '<tr><th>' + P.qref + '</th><td colspan="3">' + esc(d.ref) + '</td></tr>' : '')
          : tax || d.ref ? '<tr>' + (tax ? '<th>' + P.rc + '</th><td>' + (d.rc ? P.yes : P.no2) + '</td>' : '') + '<th>' + P.ref + '</th><td' + (tax ? '' : ' colspan="3"') + '>' + esc(d.ref) + '</td></tr>' : '') +
      '</table>' +
      '<div class="parties">' + party(d.buyer, Q ? (est ? P.efor : P.qfor) : P.billto) + (d.ship ? party(d.ship, P.shipto) : '') + '</div>' +
      '<table class="lines"><thead><tr><th>#</th><th class="l">' + P.item + '</th><th>' + P.hsn + '</th><th class="n">' + P.qty + '</th><th class="n">' + P.rate + '</th><th class="n">' + P.disc + '</th><th class="n">' + (Q && !tax ? P.price : P.taxable) + '</th>' + (tax ? '<th class="n">' + P.gst + '</th><th class="n">' + P.amount + '</th>' : '') + '</tr></thead><tbody>' +
      (tt.rows.length ? tt.rows.map(function (r, i) {
        return '<tr><td>' + (i + 1) + '</td><td class="l">' + esc(r.it.desc) + '</td><td class="mono">' + esc(r.it.hsn) + '</td><td class="n">' + NS.qty(num(r.it.qty)) + ' ' + esc(r.it.unit) + '</td><td class="n">' + NS.money(num(r.it.rate), false) + '</td><td class="n">' + (num(r.it.disc) ? num(r.it.disc) + '%' : '') + '</td><td class="n">' + NS.money(r.taxable, false) + '</td>' +
          (tax ? '<td class="n">' + r.g + '%</td><td class="n">' + NS.money(r.amount, false) + '</td>' : '') + '</tr>';
      }).join('') : '<tr><td colspan="' + cols + '" class="ph">Items you add appear here</td></tr>') +
      '</tbody></table>' +
      '<div class="foot"><div class="foot-l">' +
        '<p class="words"><span>' + P.words + ':</span> <b>' + NS.inWords(tt.grand) + '</b></p>' +
        (tax && Object.keys(tt.sum).length ? summaryTable(tt, SG) : '') +
        (d.kind === 'supply' && d.comp !== false ? '<p class="small">' + P.supplynote + '</p>' : '') +
        (Q ? '<p class="small">' + (est ? P.enote : P.qnote) + '</p>' : '') +
        (s.bankAcc || s.bankName ? '<div class="bank"><h4>' + P.bank + '</h4><p>' + esc(s.bankName) + (s.bankAcc ? '<br>' + P.acc + ' <b class="mono">' + esc(s.bankAcc) + '</b>' : '') + (s.bankIfsc ? '<br>' + P.ifsc + ' <b class="mono">' + esc(s.bankIfsc) + '</b>' : '') + (s.bankBranch ? '<br>' + P.branch + ': ' + esc(s.bankBranch) : '') + '</p></div>' : '') +
      '</div><div class="foot-r"><table class="tot"><tr><th>' + (Q && !tax ? P.price : P.subtotal) + '</th><td>' + NS.money(tt.taxable) + '</td></tr>' +
        (tax ? (tt.intra ? '<tr><th>' + P.cgst + '</th><td>' + NS.money(tt.cgst) + '</td></tr><tr><th>' + SG + '</th><td>' + NS.money(tt.sgst) + '</td></tr>' : '<tr><th>' + P.igst + '</th><td>' + NS.money(tt.igst) + '</td></tr>') : '') +
        (tt.roundOff ? '<tr><th>' + P.round + '</th><td>' + (tt.roundOff > 0 ? '+' : '−') + NS.money(Math.abs(tt.roundOff)) + '</td></tr>' : '') +
        '<tr class="grand"><th>' + P.total + '</th><td>' + NS.money(tt.grand) + '</td></tr></table>' +
        (T.qr && s.upi && tt.grand > 0 && d.status !== 'paid' ? '<div class="qr"><div class="qr-img" data-qr></div><small>' + P.upi + '<br><b class="mono">' + esc(s.upi) + '</b></small></div>' : '') +
      '</div></div>' +
      (d.notes || d.terms ? '<div class="nt">' + (d.notes ? '<div><h4>' + P.notes + '</h4><p>' + esc(d.notes).replace(/\n/g, '<br>') + '</p></div>' : '') + (d.terms ? '<div><h4>' + P.terms + '</h4><p>' + esc(d.terms).replace(/\n/g, '<br>') + '</p></div>' : '') + '</div>' : '') +
      '<div class="signbox"><p>' + P['for'] + ' <b>' + esc(s.name || '') + '</b></p>' + (s.sign ? '<img src="' + s.sign + '" alt="">' : '<div class="sp"></div>') + '<p>' + P.sign + '</p></div>' +
      '<p class="made">Made free at ' + esc(/^(localhost|127\.)/.test(location.hostname) ? (window.NS_CFG && NS_CFG.host || 'billing.niveshsahayak.in') : location.hostname.replace(/^www\./, '')) + '</p>' +
      '</div>';
    sheet.innerHTML = h;
    var q = $('[data-qr]', sheet);
    if (q) drawQr(q, s, d, tt.grand);
    ext('drawn', sheet);
    var es = $('#ed-sums', root);
    if (es) es.innerHTML = '<span>' + esc(t('sum.items', { n: tt.rows.length })) + '</span><span>' + esc(t('sum.taxable', { v: NS.money(tt.taxable) })) + '</span>' +
      (tax ? '<span>' + esc(t('sum.gst', { v: NS.money(tt.cgst + tt.sgst + tt.igst) })) + (tt.intra ? ' (CGST + ' + SG + ')' : ' (IGST)') + '</span>' : '') + '<b>' + esc(t('sum.total', { v: NS.money(tt.grand) })) + '</b>';
    fit();
  }
  function summaryTable(tt, SG) {
    var rows = Object.keys(tt.sum).map(function (k) { return tt.sum[k]; });
    return '<table class="sum"><caption>' + P.summary + '</caption><thead><tr><th>' + P.hsn + '</th><th class="n">' + P.taxable + '</th><th class="n">' + P.gst + '</th>' +
      (tt.intra ? '<th class="n">' + P.cgst + '</th><th class="n">' + SG + '</th>' : '<th class="n">' + P.igst + '</th>') + '</tr></thead><tbody>' +
      rows.map(function (s) { return '<tr><td class="mono">' + esc(s.hsn) + '</td><td class="n">' + NS.money(s.taxable, false) + '</td><td class="n">' + s.g + '%</td>' + (tt.intra ? '<td class="n">' + NS.money(s.tax / 2, false) + '</td><td class="n">' + NS.money(s.tax / 2, false) + '</td>' : '<td class="n">' + NS.money(s.tax, false) + '</td>') + '</tr>'; }).join('') +
      '</tbody></table>';
  }
  function drawQr(box, s, d, amount) {
    if (!window.qrcode) return;
    var link = 'upi://pay?pa=' + encodeURIComponent(s.upi.trim()) + '&pn=' + encodeURIComponent((s.name || '').slice(0, 40)) + '&am=' + amount.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(('Invoice ' + d.no).slice(0, 40));
    try { var qr = qrcode(0, 'M'); qr.addData(link); qr.make(); box.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); } catch (e) { box.hidden = true; }
  }
  function fit() {
    var wrap = $('.pv', root), sc = $('.pv-scale', root);
    if (!wrap || !sc || !wrap.clientWidth) return;
    var k = Math.min(1, wrap.clientWidth / 794);
    sc.style.transform = 'scale(' + k + ')';
    wrap.style.height = (sheet.offsetHeight * k) + 'px';
  }

  /* ---------- images: shrink before storing ---------- */
  function shrink(file, max) {
    return new Promise(function (res) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/png'));
      };
      img.onerror = function () { NS.toast(t('img.bad'), 'bad'); res(''); };
      img.src = url;
    });
  }

  /* ---------- draft (so a reload never loses typing) ---------- */
  var dkey;
  function saveDraft() { try { localStorage.setItem(dkey, JSON.stringify({ doc: doc, id: editingId })); } catch (e) {} }
  function loadDraft() { try { var j = JSON.parse(localStorage.getItem(dkey) || 'null'); return j && j.doc ? j : null; } catch (e) { return null; } }

  /* ---------- save, masters ---------- */
  function key(s) { return String(s || '').trim().toLowerCase(); }
  function upsert(store, match, obj) {
    return NSStore.list(store).then(function (all) {
      var hit = all.filter(match)[0];
      return NSStore.put(store, Object.assign(hit || {}, obj));
    });
  }
  function validate() {
    var tt = totals(doc), probs = [];
    if (!doc.seller.name.trim()) probs.push(['s-name', t('v.bname')]);
    if (!tt.rows.length) probs.push(['it-desc-0', t('v.item')]);
    if (!String(doc.no).trim()) probs.push(['d-no', tw('v.no')]);
    if (String(doc.no).length > 16) probs.push(['d-no', t('v.len')]);
    if (/[^A-Za-z0-9\/\-]/.test(doc.no)) probs.push(['d-no', t('v.chars')]);
    if (!NS.gstinCheck(doc.seller.gstin).ok) probs.push(['s-gstin', t('v.sg')]);
    if (!NS.gstinCheck(doc.buyer.gstin).ok) probs.push(['b-gstin', t('v.bg')]);
    if (doc.kind === 'tax' && !doc.seller.gstin) probs.push(['s-gstin', t('v.tax')]);
    if (T.gstFlag && taxOn(doc) && !doc.seller.gstin) probs.push(['s-gstin', t('v.qtax')]);
    return probs;
  }
  function save() {
    var probs = validate();
    if (probs.length) {
      var p = probs[0], f = $('#' + p[0], root);
      NS.toast(p[1], 'bad');
      if (f) { var det = f.closest('details'); if (det) det.open = true; showTab('edit'); f.focus(); }
      return Promise.reject(new Error(p[1]));
    }
    return NSStore.list('doc').then(function (all) {
      var dup = all.filter(function (d) { return d.id !== editingId && d.type === doc.type && key(d.no) === key(doc.no) && NS.fy(d.date) === NS.fy(doc.date) && key(d.seller && d.seller.name) === key(doc.seller.name); })[0];
      if (dup && !confirm(tw(T.valid ? 'c.qdup' : 'c.dup', { no: doc.no }))) throw new Error('cancel');
    }).then(function () {
      var s = doc.seller, b = doc.buyer, jobs = [];
      jobs.push(upsert('biz', function (x) { return key(x.name) === key(s.name); }, JSON.parse(JSON.stringify(s))));
      if (b.name.trim()) jobs.push(upsert('party', function (x) { return key(x.name) === key(b.name); }, { name: b.name.trim(), addr: b.addr, city: b.city, pin: b.pin, state: b.state, gstin: b.gstin, phone: b.phone }));
      doc.items.forEach(function (it) {
        if (!String(it.desc).trim()) return;
        jobs.push(upsert('item', function (x) { return key(x.desc) === key(it.desc); }, { desc: String(it.desc).trim(), hsn: it.hsn, unit: it.unit, rate: it.rate, gst: it.gst }));
      });
      return Promise.all(jobs);
    }).then(function () {
      var rec = JSON.parse(JSON.stringify(doc));
      rec.total = totals(doc).grand;
      if (editingId) rec.id = editingId;
      return NSStore.put('doc', rec);
    }).then(function (rec) {
      editingId = rec.id; saveDraft();
      /* an invoice made from a quotation marks that quotation "Invoice made" */
      if (doc.fromId) NSStore.get('doc', doc.fromId).then(function (q) { if (q && q.status !== 'inv') { q.status = 'inv'; q.invNo = doc.no; return NSStore.put('doc', q); } }).catch(function () {});
      NS.toast(tw('saved', { no: doc.no }));
      NS.folderWrite(false);
      NS.checkReminder();
      setStatus();
      return rec;
    }).catch(function (e) { if (e.message !== 'cancel') NS.toast(t('nosave', { e: e.message }), 'bad'); throw e; });
  }
  function setStatus() {
    var st = $('#tool-status', root);
    if (st) st.textContent = editingId ? tw('st.edit', { no: doc.no }) : tw('st.new');
  }

  function startNew() {
    var seller = doc.seller;
    doc = blank(); editingId = null;
    doc.seller = seller;
    fillForm(); suggestNumber(true); draw(); saveDraft(); setStatus();
  }
  function openDoc(rec, asCopy) {
    doc = Object.assign(blank(), JSON.parse(JSON.stringify(rec)));
    delete doc.id; delete doc.created; delete doc.updated; delete doc.total;
    editingId = asCopy ? null : rec.id;
    if (asCopy) { doc.date = NS.today(); doc.due = ''; doc.valid = ''; doc.status = blank().status; doc.irn = null; delete doc.fromId; delete doc.invNo; }
    fillForm(); if (asCopy) suggestNumber(true); draw(); saveDraft(); setStatus(); showTab('edit');
    window.scrollTo({ top: root.offsetTop - 10, behavior: 'smooth' });
  }

  /* ---------- history ---------- */
  var histOpen = false;
  function renderHistory() {
    var dlg = $('#ns-history'); if (!dlg) return;
    var list = $('[data-hist-list]', dlg), q = $('[data-hist-q]', dlg);
    NSStore.list('doc').then(function (all) {
      var v = key(q.value);
      var rows = all.filter(function (d) { return d.type === doc.type; }).filter(function (d) {
        return !v || [d.no, d.buyer && d.buyer.name, d.seller && d.seller.name].join(' ').toLowerCase().indexOf(v) >= 0;
      }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || (b.updated || 0) - (a.updated || 0); });
      list.innerHTML = rows.length ? rows.map(function (d) {
        var st = T.pay ? '<span class="pill ' + (d.status === 'paid' ? 'ok' : '') + '">' + esc(t(d.status === 'paid' ? 'h.paidp' : 'h.unpaidp')) + '</span>'
          : '<span class="pill ' + (d.status === 'acc' || d.status === 'inv' ? 'ok' : '') + '">' + esc(t('qs.' + (d.status || 'open'))) + (d.invNo ? ' ' + esc(d.invNo) : '') + '</span>';
        return '<li><div><b class="mono">' + esc(d.no) + '</b> · ' + NS.fmtDate(d.date) + '<br><span>' + esc(d.buyer && d.buyer.name || t('h.nocust')) + '</span> · <b>' + NS.money(d.total || 0) + '</b> ' + st + '</div>' +
          '<div class="row"><button type="button" class="btn sm" data-h="open" data-id="' + d.id + '">' + esc(t('h.open')) + '</button><button type="button" class="btn sm" data-h="copy" data-id="' + d.id + '">' + esc(t('h.copy')) + '</button>' +
          (T.pay ? '<button type="button" class="btn sm" data-h="paid" data-id="' + d.id + '">' + esc(t(d.status === 'paid' ? 'h.unpaid' : 'h.paid')) + '</button>' : '') +
          (T.toInvoice ? '<button type="button" class="btn sm" data-h="inv" data-id="' + d.id + '">' + esc(t('b.toinv')) + '</button>' : '') +
          '<button type="button" class="btn sm danger" data-h="del" data-id="' + d.id + '">' + esc(t('h.del')) + '</button></div></li>';
      }).join('') : '<li class="empty">' + esc(t(v ? 'h.nomatch' : 'h.none')) + '</li>';
    });
  }
  function openHistory() {
    var dlg = $('#ns-history'); if (!dlg) return;
    if (!dlg._wired) {
      dlg._wired = true;
      $('[data-hist-q]', dlg).addEventListener('input', renderHistory);
      dlg.addEventListener('close', function () { histOpen = false; });
      $('[data-hist-list]', dlg).addEventListener('click', function (e) {
        var b = e.target.closest('[data-h]'); if (!b) return;
        var id = b.getAttribute('data-id'), act = b.getAttribute('data-h');
        NSStore.get('doc', id).then(function (rec) {
          if (!rec) return;
          if (act === 'open' || act === 'copy') { dlg.close(); openDoc(rec, act === 'copy'); }
          else if (act === 'inv') { location.href = BILLING + '?from=' + encodeURIComponent(id); }
          else if (act === 'paid') { rec.status = rec.status === 'paid' ? 'unpaid' : 'paid'; return NSStore.put('doc', rec).then(function () { if (editingId === id) { doc.status = rec.status; fillForm(); draw(); } renderHistory(); }); }
          else if (act === 'del' && confirm(tw('c.del', { no: rec.no }))) {
            return NSStore.del('doc', id).then(function () { if (editingId === id) { editingId = null; setStatus(); } renderHistory(); NS.toast(t('deleted')); });
          }
        });
      });
    }
    histOpen = true;
    renderHistory();
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  }

  /* ---------- print, share ---------- */
  function printDoc() {
    var old = document.title;
    document.title = docName() + ' ' + (doc.no || '') + (doc.buyer.name ? ' - ' + doc.buyer.name : '');
    showTab('preview', true);
    fit();
    setTimeout(function () { window.print(); document.title = old; }, 60);
  }
  /* the English name used in file names and shared messages */
  function docName() { return { quote: 'Quotation', estimate: 'Estimate' }[doc.kind] || 'Invoice'; }
  function shareDoc() {
    var tt = totals(doc);
    var txt = docName() + ' ' + doc.no + ' from ' + (doc.seller.name || '') + '\nDate: ' + NS.fmtDate(doc.date) + (doc.due ? '\nDue: ' + NS.fmtDate(doc.due) : '') + (doc.valid ? '\nValid until: ' + NS.fmtDate(doc.valid) : '') + '\nAmount: ' + NS.money(tt.grand) +
      (doc.seller.upi ? '\nPay by UPI: ' + doc.seller.upi : '') + (doc.seller.bankAcc ? '\nBank: ' + doc.seller.bankName + ' A/c ' + doc.seller.bankAcc + ' IFSC ' + doc.seller.bankIfsc : '');
    if (navigator.share) navigator.share({ title: docName() + ' ' + doc.no, text: txt }).catch(function () {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  }

  /* ---------- quotation -> invoice: the quotation is saved first, then the billing site opens it by id from the shared data home ---------- */
  function toInvoice() {
    save().then(function (rec) { location.href = BILLING + '?from=' + encodeURIComponent(rec.id); }).catch(function () {});
  }
  function fromQuote(id) {
    return NSStore.get('doc', id).then(function (q) {
      if (!q || q.type === type) { NS.toast(t('conv.none'), 'bad'); return false; }
      var inv = blank(), qd = JSON.parse(JSON.stringify(q));
      inv.seller = Object.assign(inv.seller, qd.seller); delete inv.seller.id; delete inv.seller.created; delete inv.seller.updated;
      inv.buyer = qd.buyer; inv.ship = qd.ship || null; inv.pos = qd.pos || ''; inv.items = qd.items; inv.notes = qd.notes || inv.notes;
      inv.round = qd.round !== false; inv.accent = qd.accent || inv.accent;
      inv.kind = qd.withGst === false ? (inv.seller.gstin ? 'supply' : 'plain') : 'tax';
      inv.ref = ({ quote: 'Quotation ', estimate: 'Estimate ' }[qd.kind] || '') + qd.no;
      inv.fromId = q.id;
      doc = inv; editingId = null;
      NS.toast(t('conv.done', { doc: t('doc.' + (qd.kind === 'estimate' ? 'estimate' : 'quote')), no: qd.no }));
      return true;
    }).catch(function () { NS.toast(t('conv.none'), 'bad'); return false; });
  }

  /* ---------- phone tabs ---------- */
  function showTab(which, quiet) {
    root.setAttribute('data-tab', which);
    $$('[data-tab-btn]', root).forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab-btn') === which)); });
    if (!quiet && which === 'preview') fit();
  }

  /* ---------- labels of the fixed buttons ---------- */
  function labelButtons() {
    var L = { 'new': tw('b.new'), history: tw('b.hist'), save: t('b.save'), print: t('b.print'), share: t('b.share'), toinv: t('b.toinv') };
    $$('[data-do]').forEach(function (b) { var k = b.getAttribute('data-do'); if (L[k]) b.textContent = L[k]; });
    $$('[data-tab-btn]', root).forEach(function (b) { b.textContent = t('tab.' + b.getAttribute('data-tab-btn')); });
    var pv = $('.pv', root); if (pv) pv.setAttribute('aria-label', t('tab.preview'));
    var dlg = $('#ns-history');
    if (dlg) { $('h2', dlg).textContent = t('h.title'); $('label', dlg).textContent = t('h.search'); }
  }

  /* ---------- start ---------- */
  function init() {
    root = $('#tool');
    if (!root) return;
    type = root.getAttribute('data-doc') || 'invoice';
    T = TYPES[type] || TYPES.invoice;
    sheet = $('#sheet', root);
    dkey = 'ns-draft-' + type;
    var ed = $('#ed', root);
    ed.addEventListener('input', onInput);
    ed.addEventListener('change', onInput);
    doc = blank();
    var dr = loadDraft();
    if (dr) { doc = Object.assign(blank(), dr.doc); delete doc.lang; editingId = dr.id || null; }
    function render() { buildEditor(); fillForm(); draw(); setStatus(); labelButtons(); if (histOpen) renderHistory(); }
    render();
    document.addEventListener('ns-lang', render);
    NSStore.ready().then(function () {
      return NSStore.meta('settings').then(function (c) { CFG = c || {}; }, function () {});
    }).then(function () {
      var from = new URLSearchParams(location.search).get('from');
      if (from) {
        history.replaceState(null, '', location.pathname + location.hash);
        return fromQuote(from).then(function (ok) { if (ok) { render(); saveDraft(); return suggestNumber(true); } });
      }
      if (dr) return;
      /* a fresh start: the hub's defaults and the default business */
      var seller = doc.seller;
      doc = blank(); doc.seller = seller;
      return (CFG.defBiz ? NSStore.get('biz', CFG.defBiz).catch(function () {}) : Promise.resolve()).then(function (b) {
        if (b && !doc.seller.name) { doc.seller = Object.assign(blank().seller, b); delete doc.seller.id; delete doc.seller.created; delete doc.seller.updated; }
        render();
        return suggestNumber(true);
      });
    }).then(function () {
      NS.checkReminder();
      NSStore.persist().catch(function () {});
      root.classList.add('live');
    });
    $$('[data-tab-btn]', root).forEach(function (b) { b.addEventListener('click', function () { showTab(b.getAttribute('data-tab-btn')); }); });
    $$('[data-do]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-do');
        if (a === 'save') save().catch(function () {});
        else if (a === 'print') printDoc();
        else if (a === 'share') shareDoc();
        else if (a === 'new') { if (!editingId && totals(doc).rows.length && !confirm(tw('c.new'))) return; startNew(); }
        else if (a === 'history') openHistory();
        else if (a === 'toinv') toInvoice();
      });
    });
    NS.onRestore = function () { if (!editingId) suggestNumber(true); };
    window.addEventListener('resize', fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe($('.pv', root));
    window.addEventListener('beforeprint', fit);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save().catch(function () {}); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); printDoc(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
