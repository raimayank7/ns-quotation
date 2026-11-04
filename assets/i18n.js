/* NS i18n: screen text in the user's language. The printed document always stays in English.
   Packs live in /assets/lang/<code>.js and call NS.addLang(code, {key: text}). Missing keys fall back to English.
   Rule (owner): use the words people say at shops and offices today, often the English business word in local script. */
(function () {
  'use strict';
  var NS = window.NS = window.NS || {};
  /* the address extras as the page opened (?from=… etc.), kept when we move the visitor to their language's page */
  var EXTRA = location.search + location.hash;

  /* code, name in its own script, English name, Google font family (null = Latin), right-to-left */
  NS.LANGS = [
    ['en', 'English', 'English', null, 0],
    ['hi', 'हिन्दी', 'Hindi', 'Noto Sans Devanagari', 0],
    ['bn', 'বাংলা', 'Bengali', 'Noto Sans Bengali', 0],
    ['mr', 'मराठी', 'Marathi', 'Noto Sans Devanagari', 0],
    ['te', 'తెలుగు', 'Telugu', 'Noto Sans Telugu', 0],
    ['ta', 'தமிழ்', 'Tamil', 'Noto Sans Tamil', 0],
    ['gu', 'ગુજરાતી', 'Gujarati', 'Noto Sans Gujarati', 0],
    ['ur', 'اردو', 'Urdu', 'Noto Nastaliq Urdu', 1],
    ['kn', 'ಕನ್ನಡ', 'Kannada', 'Noto Sans Kannada', 0],
    ['or', 'ଓଡ଼ିଆ', 'Odia', 'Noto Sans Oriya', 0],
    ['ml', 'മലയാളം', 'Malayalam', 'Noto Sans Malayalam', 0],
    ['pa', 'ਪੰਜਾਬੀ', 'Punjabi', 'Noto Sans Gurmukhi', 0],
    ['as', 'অসমীয়া', 'Assamese', 'Noto Sans Bengali', 0],
    ['mai', 'मैथिली', 'Maithili', 'Noto Sans Devanagari', 0],
    ['bho', 'भोजपुरी', 'Bhojpuri', 'Noto Sans Devanagari', 0],
    ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ', 'Santali', 'Noto Sans Ol Chiki', 0],
    ['ks', 'کٲشُر', 'Kashmiri', 'Noto Nastaliq Urdu', 1],
    ['ne', 'नेपाली', 'Nepali', 'Noto Sans Devanagari', 0],
    ['kok', 'कोंकणी', 'Konkani', 'Noto Sans Devanagari', 0],
    ['sd', 'سنڌي', 'Sindhi', 'Noto Naskh Arabic', 1],
    ['doi', 'डोगरी', 'Dogri', 'Noto Sans Devanagari', 0],
    ['mni', 'ꯃꯩꯇꯩꯂꯣꯟ', 'Manipuri', 'Noto Sans Meetei Mayek', 0],
    ['brx', 'बड़ो', 'Bodo', 'Noto Sans Devanagari', 0],
    ['sa', 'संस्कृतम्', 'Sanskrit', 'Noto Sans Devanagari', 0]
  ];

  var EN = {
    'skip': 'Skip to content', 'mydata': 'My data', 'theme': 'Colour theme', 'lang': 'Language', 'close': 'Close', 'rights': 'All rights reserved.', 'later': 'Later', 'sp.label': 'Sponsored',
    'nav.formats': 'Invoice formats', 'nav.rules': 'GST rules', 'nav.billing': 'Billing', 'nav.move': 'Use on another computer',
    'f.make': 'Make a bill', 'f.maker': 'GST invoice maker', 'f.formats': 'Invoice formats by business', 'f.supply': 'Bill of supply', 'f.move': 'Use on another computer',
    'f.guides': 'GST guides', 'f.must': 'What a GST invoice must show', 'f.which': 'CGST, SGST or IGST?', 'f.num': 'Invoice number rules', 'f.hsn': 'HSN and SAC codes', 'f.einv': 'E-invoice and e-way bill', 'f.tools': 'Tools',
    'f.about': 'About', 'f.privacy': 'Privacy policy', 'f.terms': 'Terms of use', 'f.disc': 'Disclaimer', 'f.contact': 'Contact',
    'guide.en': 'This guide is in English for now. The tool itself works in your language.',

    'gst.len': 'A GSTIN has 15 letters and numbers, for example 03ABCDE1234F1Z5.',
    'gst.chk': 'This GSTIN’s last character doesn’t match. Please check it for a typing mistake.',
    'bk.saved': 'Backup file saved. Keep it somewhere safe: a pen drive, Google Drive, or WhatsApp to yourself.',
    'bk.notours': 'This is not a Nivesh Sahayak backup file.',
    'bk.restored': '{n} records brought back. Newer records you already had were kept.',
    'bk.nothing': 'Nothing new in that file: you already have everything in it.',
    'bk.unread': 'That file could not be read.',
    'rm.ago': 'Your last backup was {n} days ago. Save a backup file so your work is safe if this browser is cleared.',
    'rm.none': 'You have {n} saved documents and no backup yet. Save a backup file so your work is safe if this browser is cleared.',
    'af.on': 'Auto-save is on: every save also updates the backup file in “{name}”.', 'af.off': 'Auto-save to folder is off.',
    'md.loading': 'Loading your data…', 'md.biz': 'my businesses', 'md.party': 'customers and suppliers', 'md.item': 'items and services', 'md.doc': 'saved documents',
    'md.shared': 'Your data is kept in this browser on this device, in one place shared by every Nivesh Sahayak document tool. Nothing is sent to us.',
    'md.local': 'Your data is kept in this browser on this device. Nothing is sent to us. The shared data home could not be reached just now, so this site keeps it for now and moves it there automatically.',
    'md.last': 'Last backup:', 'md.never': 'never', 'md.save': 'Save a backup file', 'md.restore': 'Restore from a backup file',
    'md.move': 'To use your data on another computer or phone: save a backup file, copy it to a pen drive (or send it to yourself), then open this site there and press Restore.',
    'md.autot': 'Auto-save to a folder (computer only)',
    'md.auton': 'On: every save updates {file} in the folder {name}.', 'md.autoask': 'The browser needs your OK again after a restart.',
    'md.autooff': 'Pick a folder once (a OneDrive or Google Drive folder is best) and every save keeps a backup file there automatically.',
    'md.allow': 'Allow auto-save again', 'md.turnoff': 'Turn auto-save off', 'md.choose': 'Choose a folder',
    'md.seeall': 'See and edit everything on {link}.', 'md.err': 'Your data could not be opened. Please reload the page.',

    'doc.invoice': 'invoice', 'docs.invoice': 'invoices', 'Doc.invoice': 'Invoice',
    'k.tax': 'Tax invoice', 'k.supply': 'Bill of supply', 'k.plain': 'Invoice (not GST registered)',
    'kh.tax': 'For GST-registered sellers charging GST.', 'kh.supply': 'For composition dealers, or for goods and services exempt from GST. No tax is charged.', 'kh.plain': 'For sellers who are not registered under GST. No tax is charged.',
    'comp': 'I am in the composition scheme (prints the note the rules require)',
    'lg.biz': 'Your business', 'l.bname': 'Business name', 'ph.bname': 'Type your business name', 'h.bname': 'Saved businesses appear as you type.',
    'l.addr': 'Address', 'ph.addr': 'Shop no., street, city, PIN', 'l.state': 'State', 'l.gstin': 'GSTIN', 'ph.gstin': '15 characters', 'l.phone': 'Phone', 'l.email': 'Email',
    'more': 'Logo, signature and bank details', 'l.logo': 'Logo', 'rm.logo': 'Remove logo', 'l.sign': 'Signature or stamp', 'rm.sign': 'Remove signature',
    'l.bank': 'Bank name', 'l.acc': 'Account number', 'l.ifsc': 'IFSC', 'l.branch': 'Branch', 'l.upi': 'UPI ID (for the pay-by-QR code)',
    'lg.details': '{Doc} details', 'l.type': 'Type', 'l.no': '{Doc} number', 'h.no': 'Up to 16 letters, numbers, / or -. A new number is suggested for each bill.',
    'l.date': 'Date', 'l.due': 'Due date', 'l.pos': 'Place of supply', 'h.pos': 'Usually the buyer’s state. It decides CGST + SGST or IGST.', 'same.buyer': 'Same as buyer’s state', 'choose.state': 'Choose state',
    'l.ref': 'Order / PO number', 'l.rc': 'Tax payable on reverse charge',
    'lg.billto': 'Bill to', 'l.cname': 'Customer name', 'ph.cname': 'Type the customer’s name', 'h.cname': 'Saved customers appear as you type.', 'l.cgstin': 'GSTIN (if registered)',
    'l.ship': 'Ship to a different address', 'l.shname': 'Ship to name', 'l.shaddr': 'Ship to address', 'l.shstate': 'Ship to state',
    'lg.items': 'Items', 'it.n': 'Item {n}', 'it.rm': 'Remove', 'l.desc': 'Description', 'ph.desc': 'Item or service', 'l.hsn': 'HSN/SAC', 'l.qty': 'Qty', 'l.unit': 'Unit', 'l.rate': 'Rate (₹)', 'l.disc': 'Disc. %', 'l.gst': 'GST %', 'add.item': '+ Add item',
    'sum.items': '{n} items', 'sum.taxable': 'Taxable {v}', 'sum.gst': 'GST {v}', 'sum.total': 'Total {v}',
    'lg.notes': 'Notes and look', 'l.notes': 'Notes', 'ph.notes': 'For example: Thank you for your business.', 'l.terms': 'Terms and conditions', 'ph.terms': 'For example: Payment within 15 days. Interest at 18% a year after the due date.',
    'l.copy': 'Copy label', 'cp.orig': 'Original for recipient', 'cp.dup': 'Duplicate for transporter', 'cp.trip': 'Triplicate for supplier', 'cp.none': 'No label',
    'l.colour': 'Colour', 'colour.n': 'Colour {n}', 'l.round': 'Round off the total', 'l.pay': 'Payment', 'pay.unpaid': 'Not paid yet', 'pay.paid': 'Paid',
    'print.en': 'The printed {doc} is always in English, so your customer, bank and tax officer can all read it. Names and items print exactly as you type them.',
    'v.bname': 'Type your business name.', 'v.item': 'Add at least one item with a rate.', 'v.no': 'Give this {doc} a number.', 'v.len': 'GST rules allow up to 16 characters in the number.', 'v.chars': 'Use only letters, numbers, / and - in the number.',
    'v.sg': 'Your GSTIN looks wrong.', 'v.bg': 'The customer’s GSTIN looks wrong.', 'v.tax': 'A tax invoice needs your GSTIN. If you are not registered, choose “Invoice (not GST registered)” as the type.',
    'c.dup': 'There is already a saved {doc} {no} for this business in this financial year. GST rules need a different number for every bill. Save anyway?',
    'saved': '{Doc} {no} saved.', 'nosave': 'Could not save: {e}', 'st.edit': 'Editing saved {doc} {no}', 'st.new': 'New {doc} (not saved yet)', 'st.load': 'Loading…',
    'c.new': 'Start a new {doc}? This one is not saved yet.', 'img.bad': 'That picture could not be read.',
    'h.title': 'Saved documents', 'h.search': 'Search by number or name', 'h.open': 'Open', 'h.copy': 'Copy as new', 'h.paid': 'Mark paid', 'h.unpaid': 'Mark not paid', 'h.del': 'Delete',
    'h.paidp': 'Paid', 'h.unpaidp': 'Not paid', 'h.nocust': 'No customer', 'h.none': 'Nothing saved yet. Press Save after making one.', 'h.nomatch': 'Nothing matches your search.',
    'c.del': 'Delete {doc} {no}? This cannot be undone (unless you have a backup file).', 'deleted': 'Deleted.',
    'b.new': 'New {doc}', 'b.hist': 'Saved {docs}', 'b.save': 'Save', 'b.print': 'Print / PDF', 'b.share': 'Share', 'tab.edit': 'Edit', 'tab.preview': 'Preview',

    'my.title': 'Settings and saved data', 'my.intro': 'One place to set up every Nivesh Sahayak document tool: your businesses, customers and suppliers, items and services, numbering and defaults. It stays in this browser. Nothing is sent to us.',
    'my.auto': 'Auto-save and storage', 'my.t.biz': 'My businesses', 'my.t.party': 'Customers and suppliers', 'my.t.item': 'Items and services', 'my.t.doc': 'Documents',
    'my.search': 'Search', 'my.ph': 'Type a name, number or code', 'my.edit': 'Edit', 'my.savech': 'Save changes', 'my.cancel': 'Cancel', 'my.noname': '(no name)',
    'my.empty': 'Nothing saved here yet. It fills up as you use the document tools.', 'my.vault': 'Shared by every Nivesh Sahayak document tool in this browser.', 'my.local': 'Kept in this browser.',
    'my.wipe.t': 'Delete everything', 'my.wipe.p': 'Removes all saved businesses, customers, items and documents from this browser. Save a backup file first if you may need them again.',
    'my.wipe.b': 'Delete everything on this device', 'my.wipe.c1': 'Delete ALL saved businesses, customers, items and documents on this device? Save a backup file first if you may need them.',
    'my.wipe.c2': 'Type DELETE to confirm.', 'my.wiped': 'Everything was deleted from this device.', 'my.c.del': 'Delete “{name}”? This cannot be undone without a backup file.', 'my.saved': 'Saved.',
    'my.f.name': 'Name', 'my.f.addr': 'Address', 'my.f.state': 'State code', 'my.f.gstin': 'GSTIN', 'my.f.phone': 'Phone', 'my.f.email': 'Email', 'my.f.bank': 'Bank', 'my.f.acc': 'Account no.', 'my.f.ifsc': 'IFSC', 'my.f.upi': 'UPI ID',
    'my.f.desc': 'Description', 'my.f.hsn': 'HSN/SAC', 'my.f.unit': 'Unit', 'my.f.rate': 'Rate', 'my.f.gst': 'GST %',

    /* Configuration Hub (my.niveshsahayak.in) */
    'my.t.settings': 'Settings', 'hub.home': 'Overview', 'hub.backup': 'Backup and other devices', 'hub.link': 'Saved businesses, customers, items and settings',
    'hub.start': 'Get set up', 'hub.done': 'done', 'hub.s1': 'Add your business (name, GSTIN, bank, logo)', 'hub.s2': 'Add your customers and suppliers', 'hub.s3': 'Add the items and services you sell',
    'hub.s4': 'Choose invoice numbering and defaults', 'hub.s5': 'Make your first invoice', 'hub.s6': 'Save a backup file',
    'hub.tools': 'Tools that use this data', 'hub.billing': 'GST tax invoice, bill of supply and plain invoice maker', 'hub.toolsp': 'Everything you add here shows up as a suggestion in every Nivesh Sahayak document tool in this browser. Nothing fills in by itself: you pick it.',
    'hub.add.biz': 'Add a business', 'hub.add.party': 'Add a customer or supplier', 'hub.add.item': 'Add an item or service',
    'hub.edit.biz': 'Edit business', 'hub.edit.party': 'Edit customer or supplier', 'hub.edit.item': 'Edit item or service', 'hub.newdoc': 'Make a new invoice',
    'hub.p.biz': 'The businesses you make documents for. Their name, address, GSTIN, bank details, logo and signature print on your documents.',
    'hub.p.party': 'The people and firms you bill or buy from. Type a name in any tool and pick it to fill the address, state and GSTIN.',
    'hub.p.item': 'Goods and services with their HSN/SAC code, unit, rate and GST. Pick one in any tool to fill the line.',
    'hub.p.doc': 'Every document saved in this browser. Open, copy or mark one paid from the tool that made it.',
    'hub.empty.biz': 'No business saved yet. Add yours to start.', 'hub.empty.party': 'No customers or suppliers yet. Add them one by one or import a CSV file from Excel.',
    'hub.empty.item': 'No items or services yet. Add them one by one or import a CSV file from Excel.', 'hub.empty.doc': 'No documents saved yet.',
    'hub.imp': 'Import CSV', 'hub.exp': 'Export CSV', 'hub.tpl': 'Download a blank CSV template',
    'hub.imp.empty': 'This file has no rows to import.', 'hub.imp.nohead': 'This file has no “{col}” column. Start from the blank template.',
    'hub.imp.done': 'Imported: {a} new, {u} updated.', 'hub.imp.bad': 'Rows skipped because of a wrong GSTIN: {rows}.',
    'hub.role': 'Type', 'hub.r.customer': 'Customer', 'hub.r.supplier': 'Supplier', 'hub.r.both': 'Customer and supplier', 'hub.h.ship': 'Only if goods usually go to a different address.',
    'hub.f.iname': 'Item or service name', 'hub.f.code': 'Item code (optional)', 'hub.k.goods': 'Goods', 'hub.k.service': 'Service',
    'hub.rmimg': 'Remove picture', 'hub.save': 'Save', 'hub.saveadd': 'Save and add another',
    'hub.gst.typing': '{n} more characters', 'hub.gst.ok': 'Looks right: state {state}, PAN {pan}.',
    'hub.v.name': 'Please type a name.', 'hub.v.dup': '“{name}” is already saved. Edit that one instead.', 'hub.v.ifsc': 'An IFSC has 11 characters, like SBIN0001234.',
    'hub.default': 'Default', 'hub.makedef': 'Make default',
    'hub.p.settings': 'These settings are used by every Nivesh Sahayak document tool in this browser when you start a new document.',
    'hub.g.gen': 'General', 'hub.defbiz': 'Default business', 'hub.nodef': 'None (start empty)', 'hub.h.defbiz': 'A new document starts with this business filled in.',
    'hub.remind': 'Remind me to save a backup', 'hub.every': 'Every {n} days', 'hub.never': 'Never', 'hub.h.lang': 'Change it from the language menu at the top. Every tool follows it.',
    'hub.g.num': 'Invoice numbering', 'hub.prefix': 'Prefix', 'hub.digits': 'Digits in the serial number', 'hub.fy': 'Add the financial year (26-27)', 'hub.next': 'The first invoice of a year will be',
    'hub.h.num': 'Each business gets its own series, and the serial starts again from 1 every financial year (1 April). GST allows up to 16 characters: letters, numbers, / and -.',
    'hub.g.new': 'New invoice defaults', 'hub.defgst': 'GST rate for a new line', 'hub.defunit': 'Unit for a new line', 'hub.h.new': 'You can still change all of these on each document.',
    'hub.saveset': 'Save settings', 'hub.reset': 'Back to standard settings', 'hub.c.reset': 'Go back to the standard numbering and defaults? Your saved data is not touched.', 'hub.setsaved': 'Settings saved.',
    'hub.p.backup': 'Your data lives only in this browser. Save a backup file now and then, and use it to move to another computer or phone.',
    'hub.used': 'Space used in this browser: {mb} MB.', 'hub.move': 'Moving to another computer? See {link}.',

    /* e-invoice and e-way bill files (einv.js) */
    'l.city': 'City / town', 'l.pin': 'PIN code', 'h.pin': 'Needed for e-invoice and e-way bill.', 'l.shcity': 'Ship-to city / town', 'l.shpin': 'Ship-to PIN code',
    'lg.einv': 'E-invoice and e-way bill',
    'ei.intro': 'For businesses that must make e-invoices (turnover above ₹5 crore) or e-way bills (goods worth more than ₹50,000 on the move). Download the file here, upload it on the government portal, then load the portal’s reply here: the invoice then prints with the IRN and QR code.',
    'ei.guide': 'Step by step',
    'ei.sup': 'Type of supply', 'ei.s.B2B': 'Sale to a GST-registered business (B2B)', 'ei.s.SEZWP': 'To an SEZ, with IGST paid', 'ei.s.SEZWOP': 'To an SEZ, without IGST (LUT or bond)',
    'ei.s.EXPWP': 'Export, with IGST paid', 'ei.s.EXPWOP': 'Export, without IGST (LUT or bond)', 'ei.s.DEXP': 'Deemed export',
    'ei.tr': 'Transport details (for the e-way bill)', 'ei.dist': 'Distance in km', 'ei.h.dist': 'Leave 0 and the portal works it out from the PIN codes.',
    'ei.mode': 'Transport mode', 'ei.m.1': 'Road', 'ei.m.2': 'Rail', 'ei.m.3': 'Air', 'ei.m.4': 'Ship',
    'ei.veh': 'Vehicle number', 'ei.h.veh': 'For example PB10AB1234. You can also add it later on the portal.', 'ei.vtype': 'Vehicle type', 'ei.v.R': 'Regular', 'ei.v.O': 'Over-dimensional cargo (ODC)',
    'ei.tid': 'Transporter ID or GSTIN', 'ei.tname': 'Transporter name', 'ei.tdoc': 'LR / RR / AWB number', 'ei.tdate': 'LR / RR / AWB date',
    'ei.addewb': 'Also make the e-way bill together with the e-invoice (adds these transport details to the e-invoice file)',
    'ei.b.einv': 'Download e-invoice file', 'ei.b.ewb': 'Download e-way bill file', 'ei.b.load': 'Load the portal’s reply file', 'ei.b.use': 'Use these numbers', 'ei.b.rm': 'Remove IRN and e-way bill details',
    'ei.manual': 'Or type the numbers from the portal', 'ei.irn': 'IRN (64 letters and numbers)', 'ei.ack': 'Ack No.', 'ei.ackdt': 'Ack date', 'ei.qr': 'Signed QR code text',
    'ei.h.qr': 'The long text that starts with eyJ. Without it the invoice prints without the e-invoice QR code.',
    'ei.ewbno': 'E-way bill number', 'ei.ewbdt': 'E-way bill date', 'ei.ewbtill': 'Valid until',
    'ei.have': 'Registered: IRN {irn}, Ack No. {ack}.', 'ei.haveewb': 'E-way bill {no}.',
    'ei.noqr': 'The signed QR code is missing. Load the portal’s reply file or paste the QR text, so the printed invoice carries the QR code.',
    'ei.changed': 'This invoice was changed after it was registered. The portal still has the old details: cancel it on the portal (allowed within 24 hours) and register it again, or undo the change.',
    'ei.made': 'File saved: {file}. Now upload it on the e-invoice portal (Bulk Upload).', 'ei.madeewb': 'File saved: {file}. Now upload it on the e-way bill portal (Generate Bulk).',
    'ei.loaded': 'Portal reply loaded. The IRN and QR code now appear on the invoice.', 'ei.loadedewb': 'E-way bill number loaded. It now appears on the invoice.',
    'ei.saveit': 'Press Save to keep these details with the invoice.',
    'ei.nomatch': 'That reply is for invoice {no}, not this one.', 'ei.which': 'That file has replies for several invoices, but none for this invoice number.',
    'ei.noreply': 'No IRN or e-way bill number found.', 'ei.badfile': 'That file could not be read. Choose the JSON file you downloaded from the portal.',
    'ei.v.irn': 'An IRN has exactly 64 letters (a to f) and numbers.', 'ei.v.ewb': 'An e-way bill number has 12 digits.', 'ei.v.qr': 'That is not a signed QR code text. Copy the whole text that starts with eyJ.',
    'ei.c.rm': 'Remove the IRN and e-way bill details from this invoice? The registration on the portal stays as it is.',
    'ev.fix': 'Please fix these first:', 'ev.tax': 'An e-invoice can only be made for a Tax invoice. Change the type to Tax invoice.',
    'ev.sg': 'Your business GSTIN is needed.', 'ev.ewbseller': 'An e-way bill file needs your business GSTIN.', 'ev.bg': 'The customer’s GSTIN is needed for this type of supply.',
    'ev.same': 'Your GSTIN and the customer’s GSTIN cannot be the same.', 'ev.bname': 'Type the customer’s name.',
    'ev.addr': 'Type the address.', 'ev.city': 'Type the city or town (at least 3 letters).', 'ev.pin': 'Type the 6-digit PIN code.', 'ev.state': 'Choose the state.',
    'ev.ship': 'Type the ship-to city and 6-digit PIN code.',
    'ev.no': 'For the portal, the invoice number must start with a letter or 1 to 9 (not 0, / or -) and have at most 16 characters.',
    'ev.future': 'The invoice date is in the future. The portal does not accept that.',
    'ev.hsn': 'Item {n}: the HSN/SAC code must have 4, 6 or 8 digits.', 'ev.rate': 'Item {n}: {r}% is not a GST rate the portal accepts.',
    'ev.igst': 'SEZ and export supplies with tax need IGST. Choose a place of supply outside your state, so the invoice charges IGST.',
    'ev.wop': 'For a supply without IGST (LUT or bond), set GST % to 0 on every item.',
    'ev.old': 'This invoice is more than 30 days old. Businesses with turnover of ₹10 crore or more can no longer register it.',
    'ev.dist': 'Distance must be a whole number from 0 to 4000 km.', 'ev.veh': 'The vehicle number looks wrong. Write it without spaces, for example PB10AB1234.',
    'ev.tid': 'A transporter ID has 15 characters.', 'ev.small': 'This bill is ₹50,000 or less. An e-way bill is usually not needed below that, unless your state or the goods need one.',

    /* quotation and estimate (quotation.niveshsahayak.in) */
    'doc.quote': 'quotation', 'docs.quote': 'quotations', 'Doc.quote': 'Quotation', 'doc.estimate': 'estimate',
    'k.quote': 'Quotation', 'k.estimate': 'Estimate',
    'kh.quote': 'A firm price, promised until the validity date.', 'kh.estimate': 'Your best guess of the cost. The final bill may differ.',
    'l.withgst': 'Show GST on this document', 'h.withgst': 'Untick if you are not GST registered or are in the composition scheme: then you quote one price without tax.',
    'h.qno': 'Up to 16 letters, numbers, / or -. Quotations and estimates each have their own series.',
    'l.valid': 'Valid until', 'h.valid': 'The last date on which these prices are promised.', 'l.qref': 'Enquiry reference', 'lg.qto': 'Customer',
    'ph.qterms': 'For example: Valid for 15 days. 30% advance with order. Delivery in 10 days. GST as applicable.',
    'l.qstat': 'Status', 'qs.open': 'Waiting for reply', 'qs.acc': 'Accepted', 'qs.dec': 'Not accepted', 'qs.inv': 'Invoice made',
    'v.qtax': 'To show GST you need your GSTIN. If you are not registered, untick “Show GST on this document”.',
    'c.qdup': 'A {doc} with number {no} is already saved for this business in this financial year. Save anyway?',
    'b.toinv': 'Make invoice', 'conv.done': 'Filled in from {doc} {no}. Check the details, then save the invoice.', 'conv.none': 'That quotation could not be found in the saved data of this browser.',
    'nav.quote': 'Quotation', 'nav.qformats': 'Quotation formats', 'nav.qvs': 'Quotation or estimate?',
    'f.qmake': 'Make a quotation', 'f.qmaker': 'Quotation and estimate maker', 'f.qformats': 'Quotation formats by business', 'f.qvs': 'Quotation, estimate or proforma?',
    'f.qguides': 'Quotation guides', 'f.qfmt': 'What to put on a quotation', 'f.qterms': 'Terms and conditions', 'f.qgst': 'GST on a quotation', 'f.qinv': 'From quotation to invoice',
    'hub.quote': 'Quotation and estimate maker that becomes an invoice in one click'
  };

  var packs = { en: EN }, cur = 'en';
  NS.addLang = function (code, table) { packs[code] = table; };
  NS.lang = function () { return cur; };
  /* NS.t('saved', {doc:'invoice', no:'INV/1'}) ; {Doc} = doc word with a capital (English only) */
  NS.t = function (key, v) {
    var p = packs[cur] || EN, s = p[key] != null ? p[key] : EN[key] != null ? EN[key] : key;
    if (v) s = s.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; });
    return s;
  };

  var fontDone = {};
  function font(fam) {
    if (!fam || fontDone[fam]) return;
    fontDone[fam] = true;
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+') + ':wght@400;600;700&display=swap' }));
  }
  function load(code) {
    if (packs[code]) return Promise.resolve();
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.src = '/assets/lang/' + code + '.js?v=' + (window.NS_CFG && NS_CFG.langv || '1');
      s.onload = s.onerror = function () { res(); };
      document.head.appendChild(s);
    });
  }
  /* translate the page chrome: data-i18n (text), data-i18n-ph (placeholder), data-i18n-label (aria-label), data-i18n-title */
  NS.applyLang = function (root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll('[data-i18n]'), function (e) { e.textContent = NS.t(e.getAttribute('data-i18n')); });
    [['data-i18n-ph', 'placeholder'], ['data-i18n-label', 'aria-label'], ['data-i18n-title', 'title']].forEach(function (a) {
      Array.prototype.forEach.call(root.querySelectorAll('[' + a[0] + ']'), function (e) { e.setAttribute(a[1], NS.t(e.getAttribute(a[0]))); });
    });
  };
  function info(code) { return NS.LANGS.filter(function (l) { return l[0] === code; })[0]; }
  NS.setLang = function (code, quiet) {
    var L = info(code) || NS.LANGS[0];
    code = L[0];
    return load(code).then(function () {
      cur = packs[code] ? code : 'en';
      var root = document.documentElement;
      root.setAttribute('lang', cur === 'en' ? 'en-IN' : cur);
      root.setAttribute('dir', L[4] ? 'rtl' : 'ltr');
      root.style.setProperty('--script', L[3] ? '"' + L[3] + '"' : 'system-ui');
      font(L[3]);
      try { localStorage.setItem('ns-lang', cur); } catch (e) {}
      if (!quiet && window.NSStore) NSStore.meta('lang', cur).catch(function () {});
      NS.applyLang();
      Array.prototype.forEach.call(document.querySelectorAll('[data-lang-pick]'), function (s) { s.value = cur; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-guide-en]'), function (n) { n.hidden = cur === 'en'; });
      document.dispatchEvent(new CustomEvent('ns-lang', { detail: cur }));
    });
  };
  function guess() {
    var ls = (navigator.languages || [navigator.language || 'en']).map(function (x) { return String(x).toLowerCase().split('-')[0]; });
    for (var i = 0; i < ls.length; i++) if (info(ls[i])) return ls[i];
    return 'en';
  }
  NS.initLang = function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang-pick]'), function (s) {
      s.innerHTML = NS.LANGS.map(function (l) { return '<option value="' + l[0] + '" lang="' + l[0] + '" title="' + l[2] + '">' + l[1] + '</option>'; }).join('');
      s.addEventListener('change', function () {
        var code = s.value;
        /* open the same page in the chosen language when it exists; a translated page goes back to English otherwise */
        var to = ALT[code] || (pageLang !== 'en' ? ALT.en : null);
        NS.setLang(code).then(function () { if (to && to !== location.pathname) location.href = to; });
      });
    });
    var ALT = window.NS_ALT || {}, pageLang = document.documentElement.getAttribute('data-page-lang') || 'en';
    var saved; try { saved = localStorage.getItem('ns-lang'); } catch (e) {}
    if (pageLang === 'en' && saved && saved !== 'en' && ALT[saved] && ALT[saved] !== location.pathname) { NS.leaving = true; location.replace(ALT[saved] + EXTRA); return Promise.resolve(); }
    var first = NS.setLang(pageLang !== 'en' ? pageLang : (saved || guess()), true);
    /* the language chosen on any Nivesh Sahayak tool is shared through the data home */
    if (!saved && window.NSStore) NSStore.ready().then(function () { return NSStore.meta('lang'); }).then(function (l) { if (l && l !== cur) NS.setLang(l, true); }).catch(function () {});
    return first;
  };
})();
