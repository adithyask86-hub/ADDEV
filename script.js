// ============================================
// Finance Toolkit - Main JavaScript
// ============================================

// State Management
const state = {
    currency: '₹',
    theme: 'light',
    calculations: {
        emi: null,
        loan: null,
        sip: null,
        lumpsum: null,
        interest: null
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadFromLocalStorage();
    renderDashboard();
});

// ============================================
// Initialization
// ============================================

function initializeApp() {
    // Set theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Set currency
    const savedCurrency = localStorage.getItem('currency') || '₹';
    state.currency = savedCurrency;
    updateCurrencyDisplay();
}

function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Currency Toggle
    document.getElementById('currencyToggle').addEventListener('click', toggleCurrency);

    // EMI Calculator
    setupCalculatorListeners('emi', calculateEMI);

    // Loan Calculator
    setupCalculatorListeners('loan', calculateLoan);

    // SIP Calculator
    setupCalculatorListeners('sip', calculateSIP);

    // Lump Sum Calculator
    setupCalculatorListeners('lumpsum', calculateLumpSum);

    // Interest Calculator
    setupCalculatorListeners('interest', calculateInterest);

    // Tenure Toggle
    document.querySelectorAll('.tenure-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = e.target.closest('.input-group');
            group.querySelectorAll('.tenure-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const type = e.target.dataset.tenure;
            const prefix = e.target.closest('.calculator-inputs').querySelector('input').id.split('Amount')[0];

            if (type === 'months') {
                document.getElementById(`${prefix}TenureUnit`).textContent = 'months';
                document.getElementById(`${prefix}TenureSlider`).max = 360;
                document.getElementById(`${prefix}TenureSlider`).value = 240;
                document.getElementById(`${prefix}Tenure`).value = 240;
            } else {
                document.getElementById(`${prefix}TenureUnit`).textContent = 'years';
                document.getElementById(`${prefix}TenureSlider`).max = 30;
                document.getElementById(`${prefix}TenureSlider`).value = 20;
                document.getElementById(`${prefix}Tenure`).value = 20;
            }

            const calc = prefix === 'emi' ? calculateEMI : calculateLoan;
            calc();
        });
    });

    // Interest Type Toggle
    document.querySelectorAll('.interest-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.interest-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const type = e.target.dataset.interest;
            const compoundOnly = document.querySelector('.compound-only');

            if (type === 'compound') {
                compoundOnly.style.display = 'flex';
            } else {
                compoundOnly.style.display = 'none';
            }

            calculateInterest();
        });
    });

    // Save Calculation Buttons
    document.getElementById('emiSaveBtn').addEventListener('click', () => saveCalculation('emi'));
    document.getElementById('loanSaveBtn').addEventListener('click', () => saveCalculation('loan'));
    document.getElementById('sipSaveBtn').addEventListener('click', () => saveCalculation('sip'));
    document.getElementById('lumpsumSaveBtn').addEventListener('click', () => saveCalculation('lumpsum'));
    document.getElementById('interestSaveBtn').addEventListener('click', () => saveCalculation('interest'));
}

function setupCalculatorListeners(type, callback) {
    const inputs = document.querySelectorAll(`#${type}Amount, #${type}Rate, #${type}Tenure, #${type}Years, #${type}Principal, #${type}Time, #${type}Compounding`);
    const sliders = document.querySelectorAll(`#${type}AmountSlider, #${type}RateSlider, #${type}TenureSlider, #${type}YearsSlider, #${type}PrincipalSlider, #${type}RateSlider, #${type}TimeSlider`);

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            syncInputWithSlider(input);
            callback();
        });
    });

    sliders.forEach(slider => {
        slider.addEventListener('input', () => {
            syncSliderWithInput(slider);
            callback();
        });
    });
}

function syncInputWithSlider(input) {
    const id = input.id;
    const sliderId = id + 'Slider';
    const slider = document.getElementById(sliderId);

    if (slider) {
        slider.value = input.value || 0;
    }
}

function syncSliderWithInput(slider) {
    const id = slider.id.replace('Slider', '');
    const input = document.getElementById(id);

    if (input) {
        input.value = slider.value;
    }
}

// ============================================
// EMI Calculator
// ============================================

function calculateEMI() {
    const principal = parseFloat(document.getElementById('emiAmount').value) || 0;
    const rate = parseFloat(document.getElementById('emiRate').value) || 0;
    let tenure = parseFloat(document.getElementById('emiTenure').value) || 1;

    // Check if tenure is in years
    const tenureUnit = document.querySelector('.calculator-inputs #emiTenureUnit').textContent;
    if (tenureUnit === 'years') {
        tenure = tenure * 12;
    }

    if (principal <= 0 || rate < 0 || tenure <= 0) {
        resetOutput(['emiOutput', 'emiTotalInterest', 'emiTotalPayment']);
        return;
    }

    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - principal;

    updateOutput('emiOutput', emi);
    updateOutput('emiTotalInterest', totalInterest);
    updateOutput('emiTotalPayment', totalPayment);

    state.calculations.emi = {
        principal,
        rate,
        tenure,
        emi,
        totalInterest,
        totalPayment
    };

    drawEMIChart(principal, totalInterest);
    renderDashboard();
}

// ============================================
// Loan Calculator
// ============================================

function calculateLoan() {
    const principal = parseFloat(document.getElementById('loanAmount').value) || 0;
    const rate = parseFloat(document.getElementById('loanRate').value) || 0;
    let tenure = parseFloat(document.getElementById('loanTenure').value) || 1;

    const tenureUnit = document.querySelector('.calculator-inputs #loanTenureUnit').textContent;
    if (tenureUnit === 'years') {
        tenure = tenure * 12;
    }

    if (principal <= 0 || rate < 0 || tenure <= 0) {
        resetOutput(['loanOutput', 'loanTotalInterest', 'loanTotalPayment']);
        return;
    }

    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - principal;

    updateOutput('loanOutput', emi);
    updateOutput('loanTotalInterest', totalInterest);
    updateOutput('loanTotalPayment', totalPayment);

    state.calculations.loan = {
        principal,
        rate,
        tenure,
        emi,
        totalInterest,
        totalPayment
    };

    drawLoanChart(principal, totalInterest);
    renderDashboard();
}

// ============================================
// SIP Calculator
// ============================================

function calculateSIP() {
    const monthlyInvestment = parseFloat(document.getElementById('sipAmount').value) || 0;
    const rate = parseFloat(document.getElementById('sipRate').value) || 0;
    const years = parseFloat(document.getElementById('sipYears').value) || 0;

    if (monthlyInvestment <= 0 || rate < 0 || years <= 0) {
        resetOutput(['sipInvested', 'sipReturns', 'sipTotal']);
        return;
    }

    const months = years * 12;
    const monthlyRate = rate / 12 / 100;

    // Future Value of SIP Formula
    const fv = monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    const invested = monthlyInvestment * months;
    const returns = fv - invested;

    updateOutput('sipInvested', invested);
    updateOutput('sipReturns', returns);
    updateOutput('sipTotal', fv);

    state.calculations.sip = {
        monthlyInvestment,
        rate,
        years,
        invested,
        returns,
        total: fv
    };

    drawSIPChart(invested, returns);
    renderDashboard();
}

// ============================================
// Lump Sum Calculator
// ============================================

function calculateLumpSum() {
    const principal = parseFloat(document.getElementById('lumpsumAmount').value) || 0;
    const rate = parseFloat(document.getElementById('lumpsumRate').value) || 0;
    const years = parseFloat(document.getElementById('lumpsumYears').value) || 0;
    const frequency = document.getElementById('lumpsumCompounding').value;

    if (principal <= 0 || rate < 0 || years <= 0) {
        resetOutput(['lumpsumDisplayAmount', 'lumpsumInterestEarned', 'lumpsumFutureValue']);
        return;
    }

    let compoundFrequency = 1;
    if (frequency === 'semiannually') compoundFrequency = 2;
    else if (frequency === 'quarterly') compoundFrequency = 4;
    else if (frequency === 'monthly') compoundFrequency = 12;

    const r = rate / 100;
    const fv = principal * Math.pow(1 + r / compoundFrequency, compoundFrequency * years);
    const interest = fv - principal;

    updateOutput('lumpsumDisplayAmount', principal);
    updateOutput('lumpsumInterestEarned', interest);
    updateOutput('lumpsumFutureValue', fv);

    state.calculations.lumpsum = {
        principal,
        rate,
        years,
        fv,
        interest
    };

    drawLumpSumChart(principal, interest);
    renderDashboard();
}

// ============================================
// Interest Calculator
// ============================================

function calculateInterest() {
    const principal = parseFloat(document.getElementById('interestPrincipal').value) || 0;
    const rate = parseFloat(document.getElementById('interestRate').value) || 0;
    const time = parseFloat(document.getElementById('interestTime').value) || 0;

    if (principal <= 0 || rate < 0 || time <= 0) {
        resetOutput(['interestPrincipalDisplay', 'interestAmount', 'interestTotal']);
        return;
    }

    const type = document.querySelector('.interest-btn.active').dataset.interest;
    let interest, total;

    if (type === 'simple') {
        // SI = (P * R * T) / 100
        interest = (principal * rate * time) / 100;
        total = principal + interest;
    } else {
        // CI = P(1 + r/100)^t - P
        const amount = principal * Math.pow(1 + rate / 100, time);
        interest = amount - principal;
        total = amount;
    }

    updateOutput('interestPrincipalDisplay', principal);
    updateOutput('interestAmount', interest);
    updateOutput('interestTotal', total);

    state.calculations.interest = {
        principal,
        rate,
        time,
        interest,
        total,
        type
    };

    renderDashboard();
}

// ============================================
// Output & Display Functions
// ============================================

function updateOutput(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formatCurrency(value);
        element.classList.add('animated-number');
        setTimeout(() => element.classList.remove('animated-number'), 500);
    }
}

function resetOutput(elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = `${state.currency} 0`;
        }
    });
}

function formatCurrency(value) {
    return `${state.currency} ${Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// ============================================
// Chart Functions
// ============================================

let emiChart, loanChart, sipChart, lumpsumChart, dashboardChart;

function drawEMIChart(principal, interest) {
    const ctx = document.getElementById('emiChart');
    if (!ctx) return;

    if (emiChart) {
        emiChart.destroy();
    }

    emiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function drawLoanChart(principal, interest) {
    const ctx = document.getElementById('loanChart');
    if (!ctx) return;

    if (loanChart) {
        loanChart.destroy();
    }

    loanChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(249, 115, 22, 0.8)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(249, 115, 22, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function drawSIPChart(invested, returns) {
    const ctx = document.getElementById('sipChart');
    if (!ctx) return;

    if (sipChart) {
        sipChart.destroy();
    }

    sipChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Invested', 'Returns'],
            datasets: [{
                label: 'Amount',
                data: [invested, returns],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function drawLumpSumChart(principal, interest) {
    const ctx = document.getElementById('lumpsumChart');
    if (!ctx) return;

    if (lumpsumChart) {
        lumpsumChart.destroy();
    }

    lumpsumChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function renderDashboard() {
    let totalEMI = 0, totalSIP = 0, totalGrowth = 0, totalInterest = 0;

    if (state.calculations.emi) {
        totalEMI = state.calculations.emi.emi;
        totalInterest += state.calculations.emi.totalInterest;
    }

    if (state.calculations.sip) {
        totalSIP = state.calculations.sip.monthlyInvestment;
        totalGrowth += state.calculations.sip.returns;
    }

    if (state.calculations.lumpsum) {
        totalGrowth += state.calculations.lumpsum.interest;
    }

    document.getElementById('dashboardEMI').textContent = formatCurrency(totalEMI);
    document.getElementById('dashboardSIP').textContent = formatCurrency(totalSIP);
    document.getElementById('dashboardGrowth').textContent = formatCurrency(totalGrowth);
    document.getElementById('dashboardInterest').textContent = formatCurrency(totalInterest);

    drawDashboardChart(totalGrowth, totalSIP);
}

function drawDashboardChart(growth, sip) {
    const ctx = document.getElementById('dashboardChart');
    if (!ctx) return;

    if (dashboardChart) {
        dashboardChart.destroy();
    }

    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Investment', 'Growth', 'Total'],
            datasets: [{
                label: 'Amount',
                data: [sip, growth, sip + growth],
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                }
            }
        }
    });
}

// ============================================
// Theme & Currency
// ============================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('theme', theme);

    const icon = document.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

function toggleCurrency() {
    state.currency = state.currency === '₹' ? '$' : '₹';
    localStorage.setItem('currency', state.currency);
    updateCurrencyDisplay();
    recalculateAll();
}

function updateCurrencyDisplay() {
    document.querySelectorAll('.currency').forEach(el => {
        el.textContent = state.currency;
    });

    document.getElementById('currencyToggle').querySelector('.currency-symbol').textContent = state.currency;
}

function recalculateAll() {
    calculateEMI();
    calculateLoan();
    calculateSIP();
    calculateLumpSum();
    calculateInterest();
}

// ============================================
// Tab Navigation
// ============================================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active to clicked nav tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Recalculate if needed
    setTimeout(() => {
        if (tabName === 'emi') calculateEMI();
        else if (tabName === 'loan') calculateLoan();
        else if (tabName === 'sip') calculateSIP();
        else if (tabName === 'lumpsum') calculateLumpSum();
        else if (tabName === 'interest') calculateInterest();
        else if (tabName === 'dashboard') renderDashboard();
    }, 100);
}

// ============================================
// LocalStorage Functions
// ============================================

function saveCalculation(type) {
    const calculation = state.calculations[type];
    if (!calculation) {
        showToast('No calculation to save', 'error');
        return;
    }

    const saved = JSON.parse(localStorage.getItem('savedCalculations') || '{}');
    saved[`${type}_${Date.now()}`] = {
        type,
        timestamp: new Date().toLocaleDateString(),
        ...calculation
    };

    localStorage.setItem('savedCalculations', JSON.stringify(saved));
    showToast(`${type.toUpperCase()} calculation saved! ✓`, 'success');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('savedCalculations');
    if (saved) {
        console.log('Saved Calculations:', JSON.parse(saved));
    }
}

// ============================================
// Utilities
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initial calculations
setTimeout(() => {
    calculateEMI();
    calculateLoan();
    calculateSIP();
    calculateLumpSum();
    calculateInterest();
    renderDashboard();
}, 100);