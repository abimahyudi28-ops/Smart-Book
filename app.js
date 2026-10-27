// Format mata uang Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};

// Data Mockup - SINGLE SOURCE OF TRUTH
let transactions = [
    { id: 1, date: '17/08/2026', desc: 'Modal awal usaha', amount: 20000000, debitAcc: 'Kas', creditAcc: 'Modal Pemilik', type: 'Penerimaan Modal', status: 'Lunas' },
    { id: 2, date: '17/08/2026', desc: 'Penjualan barang A', amount: 5000000, debitAcc: 'Kas', creditAcc: 'Pendapatan Penjualan', type: 'Penjualan Tunai', status: 'Lunas' },
    { id: 3, date: '17/08/2026', desc: 'Bayar listrik toko', amount: 500000, debitAcc: 'Beban Listrik', creditAcc: 'Kas', type: 'Pembayaran Beban', status: 'Lunas' },
];

// Saldo Awal (sebagai baseline)
let baselineBalances = {
    'Kas': 1000000
};

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    updateAllViews();
    setupNavigation();
    setupAILogic();
    setupChatLogic();
});

// Update Semua View berdasarkan data transactions
function updateAllViews() {
    renderTransactions(); // Dashboard & History
    renderJournal(); // Jurnal Umum
    renderLedgerAndReports(); // Dashboard Summary, Neraca Saldo, Laba Rugi, Utang Piutang
}

function renderTransactions() {
    const tbodyDashboard = document.getElementById('transactions-list');
    const tbodyHistory = document.getElementById('history-list');
    
    if (tbodyDashboard) tbodyDashboard.innerHTML = '';
    if (tbodyHistory) tbodyHistory.innerHTML = '';
    
    transactions.forEach(trx => {
        // Untuk Dashboard
        if (tbodyDashboard) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${trx.date}</td>
                <td><strong>${trx.desc}</strong></td>
                <td>${formatRupiah(trx.amount)}</td>
                <td><span class="badge success">${trx.status}</span></td>
            `;
            tbodyDashboard.appendChild(tr);
        }
        
        // Untuk History
        if (tbodyHistory) {
            const trHist = document.createElement('tr');
            trHist.innerHTML = `
                <td>${trx.date}</td>
                <td><strong>${trx.desc}</strong></td>
                <td>${formatRupiah(trx.amount)}</td>
                <td><span class="badge success">${trx.status}</span></td>
                <td>
                    <button class="btn-secondary" onclick="deleteTransaction(${trx.id})" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--danger); border-color: var(--danger);"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbodyHistory.appendChild(trHist);
        }
    });
}

window.deleteTransaction = function(id) {
    if(confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        transactions = transactions.filter(t => t.id !== id);
        updateAllViews();
        alert("Transaksi berhasil dihapus dan laporan telah diperbarui otomatis.");
    }
}

function renderJournal() {
    const tbodyJournal = document.getElementById('journal-list');
    if (!tbodyJournal) return;
    tbodyJournal.innerHTML = '';

    transactions.forEach((trx) => {
        // Baris Debit
        tbodyJournal.innerHTML += `
            <tr>
                <td>${trx.date}</td>
                <td><strong>${trx.debitAcc}</strong></td>
                <td>J-${trx.id}</td>
                <td>${formatRupiah(trx.amount)}</td>
                <td>-</td>
            </tr>
        `;
        // Baris Kredit
        tbodyJournal.innerHTML += `
            <tr>
                <td></td>
                <td style="padding-left: 2rem;">${trx.creditAcc}</td>
                <td>J-${trx.id}</td>
                <td>-</td>
                <td>${formatRupiah(trx.amount)}</td>
            </tr>
        `;
    });
}

function renderLedgerAndReports() {
    // 1. Hitung Saldo Tiap Akun
    let accounts = { ...baselineBalances };
    
    // Klasifikasi Sifat Akun
    const isDebitNormal = (acc) => !acc.includes('Modal') && !acc.includes('Utang') && !acc.includes('Pendapatan') && !acc.includes('Penjualan');
    
    transactions.forEach(trx => {
        if (!accounts[trx.debitAcc]) accounts[trx.debitAcc] = 0;
        if (!accounts[trx.creditAcc]) accounts[trx.creditAcc] = 0;

        // Aturan penambahan/pengurangan berdasarkan sifat normal akun
        if (isDebitNormal(trx.debitAcc)) {
            accounts[trx.debitAcc] += trx.amount;
        } else {
            accounts[trx.debitAcc] -= trx.amount;
        }

        if (isDebitNormal(trx.creditAcc)) {
            accounts[trx.creditAcc] -= trx.amount;
        } else {
            accounts[trx.creditAcc] += trx.amount;
        }
    });

    // --- DASHBOARD SUMMARY ---
    let totalKas = accounts['Kas'] || 0;
    
    let totalPendapatan = 0;
    let totalBeban = 0;
    let totalUtang = accounts['Utang Usaha'] || 0;
    let totalPiutang = accounts['Piutang Usaha'] || 0;

    Object.keys(accounts).forEach(acc => {
        if(acc.includes('Pendapatan') || acc.includes('Penjualan')) {
            totalPendapatan += accounts[acc];
        }
        if(acc.includes('Beban') || acc.includes('Pengeluaran')) {
            totalBeban += accounts[acc];
        }
    });

    const labaBersih = totalPendapatan - totalBeban;

    // Update Dashboard DOM
    const elSaldo = document.getElementById('saldo-saat-ini');
    const elPendapatan = document.getElementById('total-pendapatan');
    const elPengeluaran = document.getElementById('total-pengeluaran');
    const elLaba = document.getElementById('laba-bersih');

    if (elSaldo) elSaldo.innerText = formatRupiah(totalKas);
    if (elPendapatan) elPendapatan.innerText = formatRupiah(totalPendapatan);
    if (elPengeluaran) elPengeluaran.innerText = formatRupiah(totalBeban);
    if (elLaba) elLaba.innerText = formatRupiah(labaBersih);

    // --- UTANG PIUTANG ---
    const elTotalUtang = document.getElementById('debt-total');
    const elTotalPiutang = document.getElementById('receivable-total');
    const elDebtStatus = document.getElementById('debt-status-msg');

    if(elTotalUtang) elTotalUtang.innerText = formatRupiah(totalUtang);
    if(elTotalPiutang) elTotalPiutang.innerText = formatRupiah(totalPiutang);
    
    if(elDebtStatus) {
        if (totalUtang === 0 && totalPiutang === 0) {
            elDebtStatus.innerHTML = `<i class="fa-solid fa-face-smile" style="font-size: 3rem; color: var(--secondary); margin-bottom: 1rem;"></i>
                    <h4>Bagus! Saat ini Anda tidak memiliki tanggungan utang/piutang yang belum lunas.</h4>`;
        } else {
            elDebtStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h4>Perhatian! Anda memiliki tagihan utang/piutang berjalan.</h4>`;
        }
    }

    // --- NERACA SALDO ---
    const tbList = document.getElementById('tb-list');
    let sumDebit = 0;
    let sumCredit = 0;
    
    if (tbList) {
        tbList.innerHTML = '';
        Object.keys(accounts).forEach(acc => {
            const balance = accounts[acc];
            if (balance === 0) return;
            
            let d = 0;
            let c = 0;
            if (isDebitNormal(acc)) {
                if (balance > 0) d = balance; else c = Math.abs(balance);
            } else {
                if (balance > 0) c = balance; else d = Math.abs(balance);
            }

            sumDebit += d;
            sumCredit += c;

            tbList.innerHTML += `
                <div class="journal-row">
                    <div>${acc}</div>
                    <div>${d > 0 ? formatRupiah(d) : '-'}</div>
                    <div>${c > 0 ? formatRupiah(c) : '-'}</div>
                </div>
            `;
        });

        const tdDebit = document.getElementById('tb-total-debit');
        const tdCredit = document.getElementById('tb-total-credit');
        if(tdDebit) tdDebit.innerText = formatRupiah(sumDebit);
        if(tdCredit) tdCredit.innerText = formatRupiah(sumCredit);
        
        const tbStatus = document.getElementById('tb-status');
        if(tbStatus) {
            if(sumDebit === sumCredit) {
                tbStatus.className = 'badge success';
                tbStatus.innerHTML = '<i class="fa-solid fa-check"></i> SEIMBANG';
            } else {
                tbStatus.className = 'badge';
                tbStatus.style.backgroundColor = 'var(--danger)';
                tbStatus.style.color = 'white';
                tbStatus.innerHTML = '<i class="fa-solid fa-xmark"></i> TIDAK SEIMBANG';
            }
        }
    }

    // --- LABA RUGI ---
    const plRevList = document.getElementById('pl-revenue-list');
    const plExpList = document.getElementById('pl-expense-list');
    
    if (plRevList) {
        plRevList.innerHTML = '';
        plExpList.innerHTML = '';

        Object.keys(accounts).forEach(acc => {
            const balance = accounts[acc];
            if (balance === 0) return;

            if (acc.includes('Pendapatan') || acc.includes('Penjualan')) {
                plRevList.innerHTML += `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span>${acc}</span><span>${formatRupiah(balance)}</span></div>`;
            } else if (acc.includes('Beban') || acc.includes('Pengeluaran')) {
                plExpList.innerHTML += `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"><span>${acc}</span><span>${formatRupiah(balance)}</span></div>`;
            }
        });

        document.getElementById('pl-total-revenue').innerText = formatRupiah(totalPendapatan);
        document.getElementById('pl-total-expense').innerText = formatRupiah(totalBeban);
        document.getElementById('pl-net-profit').innerText = formatRupiah(labaBersih);
    }
}

// Navigasi
function setupNavigation() {
    const navLinks = [
        { id: 'nav-dashboard', view: 'view-dashboard', title: 'Beranda' },
        { id: 'nav-transaction', view: 'view-transaction', title: 'Catat Transaksi' },
        { id: 'nav-history', view: 'view-history', title: 'Riwayat Transaksi' },
        { id: 'nav-debt', view: 'view-debt', title: 'Utang & Piutang' },
        { id: 'nav-journal', view: 'view-journal', title: 'Jurnal Umum' },
        { id: 'nav-trial-balance', view: 'view-trial-balance', title: 'Neraca Saldo' },
        { id: 'nav-profit-loss', view: 'view-profit-loss', title: 'Laporan Laba Rugi' },
        { id: 'nav-chat', view: 'view-chat', title: 'Tanya Keuangan AI' }
    ];

    const headerTitle = document.querySelector('.topbar h2');
    const allViews = document.querySelectorAll('.view-section');

    navLinks.forEach(linkObj => {
        const navEl = document.getElementById(linkObj.id);
        if (!navEl) return;

        navEl.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            allViews.forEach(v => v.style.display = 'none');
            const targetView = document.getElementById(linkObj.view);
            if (targetView) targetView.style.display = 'block';

            document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
            navEl.parentElement.classList.add('active');
            headerTitle.innerText = linkObj.title;
        });
    });
}

// Quick Prompt Template Auto-fill
window.fillPrompt = function(promptText, methodVal) {
    const descInput = document.getElementById('input-description');
    const methodInput = document.getElementById('input-method');
    if(descInput) descInput.value = promptText;
    if(methodInput && methodVal) methodInput.value = methodVal;
};

// Helper to parse amount from natural language (e.g. 2jt, 2.5juta, 500rb, 100k, 1.500.000)
function parseAmountFromText(text) {
    const cleanText = text.toLowerCase();
    
    // Check million (juta / jt)
    const jtMatch = cleanText.match(/([\d[\.\,]+)\s*(juta|jt)/);
    if (jtMatch) {
        const val = parseFloat(jtMatch[1].replace(',', '.'));
        if (!isNaN(val)) return Math.round(val * 1000000);
    }

    // Check thousand (ribu / rb / k)
    const rbMatch = cleanText.match(/([\d[\.\,]+)\s*(ribu|rb|k)/);
    if (rbMatch) {
        const val = parseFloat(rbMatch[1].replace(',', '.'));
        if (!isNaN(val)) return Math.round(val * 1000);
    }

    // Check raw formatted number (e.g. 2.000.000 or 2000000)
    const numbers = cleanText.match(/\d[\d\.\,]*/g);
    if (numbers) {
        // take largest digit sequence
        let maxVal = 0;
        numbers.forEach(numStr => {
            const parsed = parseInt(numStr.replace(/[^\d]/g, ''));
            if (!isNaN(parsed) && parsed > maxVal) maxVal = parsed;
        });
        if (maxVal > 0) return maxVal;
    }

    return 0;
}

// Simulasi AI Analysis
function setupAILogic() {
    const btnAnalyze = document.getElementById('btn-analyze');
    const descInput = document.getElementById('input-description');
    const resultSection = document.getElementById('ai-result-section');
    const btnSave = document.getElementById('btn-save');
    const btnCorrect = document.getElementById('btn-correct');

    btnAnalyze.addEventListener('click', () => {
        const text = descInput.value.toLowerCase();
        
        if (text.trim() === '') {
            alert('Silakan tuliskan deskripsi transaksi terlebih dahulu.');
            return;
        }

        btnAnalyze.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menganalisis...';
        
        setTimeout(() => {
            btnAnalyze.innerHTML = '<i class="fa-solid fa-robot"></i> Analisis Transaksi';
            
            let debitAcc = 'Aset Lainnya';
            let creditAcc = 'Kas';
            let transType = 'Pengeluaran';
            const amtEl = document.getElementById('input-amount');
            let extractedAmount = amtEl ? amtEl.value : '';

            if (!extractedAmount) {
                extractedAmount = parseAmountFromText(text);
            }

            // Enhanced AI Classification for Debt & Receivables
            const isUtangWord = text.includes('utang') || text.includes('hutang') || text.includes('ngutang') || text.includes('kredit');
            const isPiutangWord = text.includes('piutang') || text.includes('tagih') || text.includes('nagih');
            const isPayWord = text.includes('bayar') || text.includes('lunas') || text.includes('angsur') || text.includes('cicil');
            const isReceiveWord = text.includes('terima') || text.includes('cair') || text.includes('dapat');

            if (text.includes('bayar utang') || (isUtangWord && isPayWord && !text.includes('jual') && !text.includes('beli'))) {
                debitAcc = 'Utang Usaha';
                creditAcc = 'Kas';
                transType = 'Pembayaran Utang';
            }
            else if (text.includes('terima piutang') || (isPiutangWord && (isReceiveWord || isPayWord))) {
                debitAcc = 'Kas';
                creditAcc = 'Piutang Usaha';
                transType = 'Penerimaan Piutang';
            }
            else if (isPiutangWord || (text.includes('jual') && isUtangWord) || text.includes('kredit ke')) {
                debitAcc = 'Piutang Usaha';
                creditAcc = 'Pendapatan Penjualan';
                transType = 'Penjualan Kredit';
            }
            else if ((text.includes('beli') && isUtangWord) || (isUtangWord && !isPayWord && !isReceiveWord)) {
                if (text.includes('pupuk')) debitAcc = 'Persediaan Pupuk';
                else if (text.includes('mesin')) debitAcc = 'Mesin';
                else if (text.includes('kendaraan')) debitAcc = 'Kendaraan';
                else debitAcc = 'Persediaan Barang';
                
                creditAcc = 'Utang Usaha';
                transType = 'Pembelian Kredit';
            }
            else if (text.includes('beli') || text.includes('pembelian')) {
                if (text.includes('pupuk')) debitAcc = 'Persediaan Pupuk';
                else if (text.includes('mesin')) debitAcc = 'Mesin';
                else if (text.includes('kendaraan')) debitAcc = 'Kendaraan';
                else debitAcc = 'Persediaan Barang';
                
                creditAcc = 'Kas';
                transType = 'Pembelian Tunai';
            }
            else if (text.includes('jual') || text.includes('penjualan')) {
                debitAcc = 'Kas';
                creditAcc = 'Pendapatan Penjualan';
                transType = 'Penjualan Tunai';
            }
            else if (text.includes('gaji')) {
                debitAcc = 'Beban Gaji';
                creditAcc = 'Kas';
                transType = 'Pembayaran Beban';
            }
            else if (text.includes('listrik')) {
                debitAcc = 'Beban Listrik';
                creditAcc = 'Kas';
                transType = 'Pembayaran Beban';
            }
            else if (text.includes('modal')) {
                debitAcc = 'Kas';
                creditAcc = 'Modal Pemilik';
                transType = 'Penerimaan Modal';
            }

            document.getElementById('res-desc').innerText = descInput.value;
            document.getElementById('res-type').innerText = transType;
            document.getElementById('res-debit-acc').innerText = debitAcc;
            document.getElementById('res-credit-acc').innerText = creditAcc;
            
            const fmtAmount = formatRupiah(extractedAmount);
            document.getElementById('res-debit-amt').innerText = fmtAmount;
            document.getElementById('res-credit-amt').innerText = fmtAmount;
            document.getElementById('res-total-debit').innerText = fmtAmount;
            document.getElementById('res-total-credit').innerText = fmtAmount;

            resultSection.style.display = 'block';
            
            // Save state for submission
            resultSection.dataset.amount = extractedAmount;
            resultSection.dataset.desc = descInput.value;
            resultSection.dataset.debit = debitAcc;
            resultSection.dataset.credit = creditAcc;
            resultSection.dataset.type = transType;
        }, 800);
    });

    btnCorrect.addEventListener('click', () => {
        alert("Dalam versi nyata, tombol ini akan membuka dropdown untuk Anda merevisi akun yang terdeteksi AI secara manual.");
    });

    btnSave.addEventListener('click', () => {
        const amount = parseInt(resultSection.dataset.amount);
        const desc = resultSection.dataset.desc;
        const debitAcc = resultSection.dataset.debit;
        const creditAcc = resultSection.dataset.credit;
        const transType = resultSection.dataset.type;
        const dateStr = document.getElementById('input-date').value;
        
        let newId = 1;
        if(transactions.length > 0) {
            newId = Math.max(...transactions.map(t => t.id)) + 1;
        }

        // --- ADD TO SINGLE SOURCE OF TRUTH ---
        transactions.unshift({
            id: newId,
            date: dateStr,
            desc: desc,
            amount: amount,
            debitAcc: debitAcc,
            creditAcc: creditAcc,
            type: transType,
            status: 'Tercatat'
        });

        alert('Berhasil! Transaksi telah disinkronisasi ke seluruh laporan (Buku Besar, Jurnal, Neraca Saldo).');
        
        // Reset form
        descInput.value = '';
        const amtElReset = document.getElementById('input-amount');
        if(amtElReset) amtElReset.value = '';
        resultSection.style.display = 'none';
        
        // Update all views
        updateAllViews();

        // Redirect to dashboard
        document.getElementById('nav-dashboard').click();
    });
}

// Helper for Quick Chat Suggestions
window.askChatSample = function(questionText) {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    if(chatInput) chatInput.value = questionText;
    if(chatSend) chatSend.click();
};

// Fitur Chat AI Cerdas & Dinamis
function setupChatLogic() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    if(!chatInput || !chatSend) return;

    function sendMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        // Tampilkan pesan user
        chatMessages.innerHTML += `
            <div style="margin-bottom: 1.25rem; display: flex; gap: 1rem; flex-direction: row-reverse;">
                <div class="avatar" style="background: #e5e7eb; color: var(--dark); width: 34px; height: 34px; flex-shrink: 0;"><i class="fa-solid fa-user"></i></div>
                <div style="background: var(--primary-gradient); color: white; padding: 0.9rem 1.25rem; border-radius: 18px 18px 0 18px; box-shadow: 0 4px 14px rgba(79,70,229,0.25); max-width: 80%; font-size: 0.95rem;">
                    ${text}
                </div>
            </div>
        `;
        
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Proses AI Dinamis berdasarkan data Single Source of Truth
        setTimeout(() => {
            const labaText = document.getElementById('laba-bersih') ? document.getElementById('laba-bersih').innerText : 'Rp 0';
            const kasText = document.getElementById('saldo-saat-ini') ? document.getElementById('saldo-saat-ini').innerText : 'Rp 0';
            const pendapatanText = document.getElementById('total-pendapatan') ? document.getElementById('total-pendapatan').innerText : 'Rp 0';
            const pengeluaranText = document.getElementById('total-pengeluaran') ? document.getElementById('total-pengeluaran').innerText : 'Rp 0';
            const utangText = document.getElementById('debt-total') ? document.getElementById('debt-total').innerText : 'Rp 0';
            const piutangText = document.getElementById('receivable-total') ? document.getElementById('receivable-total').innerText : 'Rp 0';

            const t = text.toLowerCase();
            let reply = "";

            // 1. Kas / Uang / Saldo
            if (t.includes('kas') || t.includes('uang') || t.includes('saldo') || t.includes('dompet') || t.includes('duit')) {
                reply = `Berdasarkan data real-time, saldo uang tunai (Kas) usaha Anda saat ini adalah **${kasText}**.\n\n*Catatan: Pastikan tetap menjaga likuiditas kas untuk operasional harian.*`;
            }
            // 2. Laba / Rugi / Profit / Untung
            else if (t.includes('laba') || t.includes('untung') || t.includes('rugi') || t.includes('profit') || t.includes('performa')) {
                if (labaText.includes('-')) {
                    reply = `Bisnis Anda saat ini tercatat posisi **Rugi** sebesar **${labaText}**. Cobalah menekan pengeluaran beban atau meningkatkan volume penjualan tunai.`;
                } else {
                    reply = `Selamat! Bisnis Anda tercatat posisi **Laba Bersih** sebesar **${labaText}** (Total Pendapatan: ${pendapatanText} dikurangi Total Beban: ${pengeluaranText}). 🚀`;
                }
            }
            // 3. Pendapatan / Penjualan / Omset
            else if (t.includes('jual') || t.includes('pendapatan') || t.includes('omset') || t.includes('pemasukan') || t.includes('dapat')) {
                reply = `Total omset / pendapatan penjualan Anda saat ini mencapai **${pendapatanText}** dari total ${transactions.length} transaksi tercatat.`;
            }
            // 4. Pengeluaran / Beban / Biaya
            else if (t.includes('pengeluaran') || t.includes('beban') || t.includes('biaya') || t.includes('keluar') || t.includes('paling besar')) {
                reply = `Total pengeluaran (beban) Anda tercatat sebesar **${pengeluaranText}**.\n\n*Tip AI: Periksa halaman Laporan Laba Rugi untuk melihat rincian tiap akun beban.*`;
            }
            // 5. Utang / Hutang
            else if (t.includes('utang') || t.includes('hutang') || t.includes('pinjaman')) {
                if (utangText === 'Rp 0' || utangText === 'Rp0') {
                    reply = `Luar biasa! Saat ini Anda **tidak memiliki saldo utang** berjalan yang belum dilunasi. 🎉`;
                } else {
                    reply = `Saat ini Anda memiliki total kewajiban utang sebesar **${utangText}**. Anda bisa melunasinya di menu *Catat Transaksi* dengan mengodekan kalimat *"Bayar utang Rp..."*.`;
                }
            }
            // 6. Piutang / Tagihan / Budi / Pelanggan
            else if (t.includes('piutang') || t.includes('tagih') || t.includes('nagih') || t.includes('budi')) {
                if (piutangText === 'Rp 0' || piutangText === 'Rp0') {
                    reply = `Saat ini **tidak ada piutang** dari pelanggan yang tertahan.`;
                } else {
                    reply = `Total piutang usaha yang belum Anda terima dari pelanggan adalah **${piutangText}**. Lakukan penagihan secara berkala untuk memperlancar saldo kas.`;
                }
            }
            // 7. Riwayat / Jumlah Transaksi
            else if (t.includes('transaksi') || t.includes('riwayat') || t.includes('berapa kali') || t.includes('terakhir')) {
                const latestTrx = transactions.length > 0 ? transactions[0] : null;
                if (latestTrx) {
                    reply = `Anda memiliki total **${transactions.length} transaksi**. Transaksi paling terbaru Anda adalah **"${latestTrx.desc}"** senilai **${formatRupiah(latestTrx.amount)}** pada ${latestTrx.date}.`;
                } else {
                    reply = `Belum ada transaksi yang tercatat di sistem.`;
                }
            }
            // 8. Saran Keuangan / Tips / Rekomendasi
            else if (t.includes('saran') || t.includes('tips') || t.includes('rekomendasi') || t.includes('hemat') || t.includes('gimana') || t.includes('bagaimana')) {
                reply = `💡 **Rekomendasi Keuangan AI SmartBuku:**\n1. Uang Kas Anda: **${kasText}**. Pertahankan minimal 20% kas sebagai dana darurat.\n2. Saldo Utang: **${utangText}**. Prioritaskan pelunasan utang yang mendekati jatuh tempo.\n3. Saldo Piutang: **${piutangText}**. Segera lakukan penagihan agar menjadi uang kas masuk.`;
            }
            // 9. Salam & Casual Chat Gen Z
            else if (t.includes('halo') || t.includes('hai') || t.includes('hi') || t.includes('p') || t.includes('siapa')) {
                reply = `Halo! Saya SmartAI Keuangan Anda. Mau cek kas, laba rugi, utang, piutang, atau transaksi hari ini? Langsung tanyakan aja! ✨`;
            }
            else if (t.includes('makasih') || t.includes('terima kasih') || t.includes('thanks') || t.includes('mantap') || t.includes('keren')) {
                reply = `Sama-sama! Senang bisa membantu keuangan bisnis Anda tetap rapi dan akurat! 🚀`;
            }
            // 10. Dynamic Fallback
            else {
                reply = `Saya mengerti pertanyaan Anda tentang "${text}". Ringkasan keuangan Anda saat ini:\n• **Kas:** ${kasText}\n• **Laba Bersih:** ${labaText}\n• **Total Utang:** ${utangText}\n• **Total Piutang:** ${piutangText}\n\nAda detail lain yang ingin Anda ketahui?`;
            }

            // Convert newlines to <br> for clean display
            const formattedReply = reply.replace(/\n/g, '<br>');

            chatMessages.innerHTML += `
                <div style="margin-bottom: 1.25rem; display: flex; gap: 1rem;">
                    <div class="avatar" style="background: var(--primary-gradient); width: 34px; height: 34px; flex-shrink: 0;"><i class="fa-solid fa-robot"></i></div>
                    <div style="background: white; padding: 1rem 1.25rem; border-radius: 0 18px 18px 18px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(15,23,42,0.03); max-width: 80%; font-size: 0.95rem; line-height: 1.5; color: var(--text-primary);">
                        ${formattedReply}
                    </div>
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 600);
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
}
