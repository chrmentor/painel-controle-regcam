// Variáveis globais
let currentUser = null;
let visitsChart = null;
let currentPage = 1;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupEventListeners();
});

// Verificar sessão
async function checkSession() {
    try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.admin;
            showMainPanel();
            loadDashboard();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        showLoginScreen();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Códigos
    document.getElementById('addCodeBtn').addEventListener('click', () => openCodeModal());
    document.getElementById("generateSiteCodeBtn").addEventListener("click", generateSiteCode);
    document.getElementById('codeForm').addEventListener('submit', handleCodeSubmit);
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeCodeModal);
    document.querySelector('.modal-cancel').addEventListener('click', closeCodeModal);
    
    // Visitas
    document.getElementById('exportVisitsBtn').addEventListener('click', exportVisits);
    document.getElementById('filterVisitsBtn').addEventListener('click', filterVisits);
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.admin;
            showMainPanel();
            loadDashboard();
        } else {
            showError(data.error || 'Erro no login');
        }
    } catch (error) {
        showError('Erro de conexão');
    } finally {
        showLoading(false);
    }
}

// Logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        showLoginScreen();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Navegação
function handleNavigation(e) {
    e.preventDefault();
    
    const section = e.currentTarget.dataset.section;
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Mostrar seção
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    // Carregar dados da seção
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'codes':
            loadCodes();
            break;
        case 'visits':
            loadVisits();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch('/api/analytics/dashboard-stats');
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.stats);
            loadVisitsChart();
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('visitsToday').textContent = stats.visits_today;
    document.getElementById('uniqueVisitsToday').textContent = stats.unique_visits_today;
    document.getElementById('visitsThisMonth').textContent = stats.visits_this_month;
    document.getElementById('activeCodes').textContent = stats.active_codes;
    
    // Última visita
    const lastVisitDiv = document.getElementById('lastVisit');
    if (stats.last_visit) {
        const visit = stats.last_visit;
        const date = new Date(visit.timestamp).toLocaleString('pt-BR');
        lastVisitDiv.innerHTML = `
            <p><strong>IP:</strong> ${visit.ip_address}</p>
            <p><strong>Data:</strong> ${date}</p>
            <p><strong>Página:</strong> ${visit.page_url || 'Página inicial'}</p>
        `;
    } else {
        lastVisitDiv.innerHTML = '<p>Nenhuma visita registrada</p>';
    }
}

async function loadVisitsChart() {
    try {
        const response = await fetch('/api/analytics/visits-chart?days=30');
        const data = await response.json();
        
        if (data.success) {
            createVisitsChart(data.chart_data);
        }
    } catch (error) {
        console.error('Erro ao carregar gráfico:', error);
    }
}

function createVisitsChart(chartData) {
    const ctx = document.getElementById('visitsChart').getContext('2d');
    
    if (visitsChart) {
        visitsChart.destroy();
    }
    
    const labels = chartData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const totalVisits = chartData.map(item => item.total_visits);
    const uniqueVisits = chartData.map(item => item.unique_visits);
    
    visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total de Visitas',
                    data: totalVisits,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Visitas Únicas',
                    data: uniqueVisits,
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Códigos de Rastreamento
async function loadCodes() {
    try {
        const response = await fetch('/api/tracking/codes');
        const data = await response.json();
        
        if (data.success) {
            displayCodes(data.codes);
        }
    } catch (error) {
        console.error('Erro ao carregar códigos:', error);
    }
}

function displayCodes(codes) {
    const codesList = document.getElementById('codesList');
    
    if (codes.length === 0) {
        codesList.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <p>Nenhum código de rastreamento cadastrado.</p>
                <button onclick="openCodeModal()" class="btn-primary mt-2">
                    <i class="fas fa-plus"></i>
                    Adicionar Primeiro Código
                </button>
            </div>
        `;
        return;
    }
    
    codesList.innerHTML = codes.map(code => `
        <div class="code-item">
            <div class="code-header">
                <h3 class="code-title">${code.name}</h3>
                <span class="code-status ${code.is_active ? 'active' : 'inactive'}">
                    ${code.is_active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="code-meta">
                <span class="code-position">${getPositionLabel(code.position)}</span>
                <span>Criado em: ${new Date(code.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            ${code.description ? `<p class="mb-2">${code.description}</p>` : ''}
            <div class="code-actions">
                <button onclick="editCode(${code.id})" class="btn-primary btn-small">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button onclick="toggleCode(${code.id})" class="btn-secondary btn-small">
                    <i class="fas fa-toggle-${code.is_active ? 'on' : 'off'}"></i>
                    ${code.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button onclick="deleteCode(${code.id})" class="btn-danger btn-small">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function getPositionLabel(position) {
    const labels = {
        'head': 'Cabeçalho',
        'body': 'Corpo',
        'footer': 'Rodapé'
    };
    return labels[position] || position;
}

function openCodeModal(codeId = null) {
    const modal = document.getElementById('codeModal');
    const form = document.getElementById('codeForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('codeId').value = codeId || '';
    
    if (codeId) {
        title.textContent = 'Editar Código';
        // Carregar dados do código para edição
        loadCodeForEdit(codeId);
    } else {
        title.textContent = 'Adicionar Código';
    }
    
    modal.style.display = 'block';
}

async function loadCodeForEdit(codeId) {
    try {
        const response = await fetch('/api/tracking/codes');
        const data = await response.json();
        
        if (data.success) {
            const code = data.codes.find(c => c.id === codeId);
            if (code) {
                document.getElementById('codeName').value = code.name;
                document.getElementById('codeDescription').value = code.description || '';
                document.getElementById('codePosition').value = code.position;
                document.getElementById('codeContent').value = code.code_content;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar código:', error);
    }
}

function closeCodeModal() {
    document.getElementById('codeModal').style.display = 'none';
}

async function handleCodeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const codeId = document.getElementById('codeId').value;
    
    const codeData = {
        name: formData.get('name'),
        description: formData.get('description'),
        position: formData.get('position'),
        code_content: formData.get('code_content')
    };
    
    try {
        showLoading(true);
        
        const url = codeId ? `/api/tracking/codes/${codeId}` : '/api/tracking/codes';
        const method = codeId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(codeData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeCodeModal();
            loadCodes();
            showSuccess(data.message);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Erro ao salvar código');
    } finally {
        showLoading(false);
    }
}

async function editCode(codeId) {
    openCodeModal(codeId);
}

async function toggleCode(codeId) {
    try {
        const response = await fetch(`/api/tracking/codes/${codeId}/toggle`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadCodes();
            showSuccess(data.message);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Erro ao alterar status do código');
    }
}

async function deleteCode(codeId) {
    if (!confirm('Tem certeza que deseja excluir este código?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tracking/codes/${codeId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadCodes();
            showSuccess(data.message);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Erro ao excluir código');
    }
}

async function applyCodes() {
    if (!confirm('Aplicar todos os códigos ativos ao site? Um backup será criado automaticamente.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/api/tracking/apply-codes', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`${data.message}. ${data.applied_codes} código(s) aplicado(s).`);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Erro ao aplicar códigos');
    } finally {
        showLoading(false);
    }
}

// Visitas
async function loadVisits(page = 1) {
    try {
        const response = await fetch(`/api/analytics/visits?page=${page}&per_page=20`);
        const data = await response.json();
        
        if (data.success) {
            displayVisits(data.visits);
            displayPagination(data.pagination);
        }
    } catch (error) {
        console.error('Erro ao carregar visitas:', error);
    }
}

function displayVisits(visits) {
    const tbody = document.getElementById('visitsTableBody');
    
    if (visits.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Nenhuma visita registrada</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = visits.map(visit => `
        <tr>
            <td>${new Date(visit.timestamp).toLocaleString('pt-BR')}</td>
            <td>${visit.ip_address}</td>
            <td>${visit.page_url || 'Página inicial'}</td>
            <td>${visit.referrer || 'Direto'}</td>
            <td>
                <span class="text-${visit.is_unique ? 'success' : 'secondary'}">
                    ${visit.is_unique ? 'Sim' : 'Não'}
                </span>
            </td>
        </tr>
    `).join('');
}

function displayPagination(pagination) {
    const paginationDiv = document.getElementById('visitsPagination');
    
    if (pagination.pages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Botão anterior
    if (pagination.has_prev) {
        paginationHTML += `<button onclick="loadVisits(${pagination.page - 1})">Anterior</button>`;
    }
    
    // Números das páginas
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === pagination.page) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadVisits(${i})">${i}</button>`;
        }
    }
    
    // Botão próximo
    if (pagination.has_next) {
        paginationHTML += `<button onclick="loadVisits(${pagination.page + 1})">Próximo</button>`;
    }
    
    paginationDiv.innerHTML = paginationHTML;
}

async function filterVisits() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Implementar filtro de visitas
    loadVisits(1);
}

async function exportVisits() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        let url = '/api/analytics/visits/export';
        const params = new URLSearchParams();
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            downloadCSV(data.csv_data, 'visitas.csv');
            showSuccess(`${data.total_records} registros exportados`);
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Erro ao exportar visitas');
    }
}

function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Utilitários
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainPanel').style.display = 'none';
}

function showMainPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'grid';
    document.getElementById('adminName').textContent = currentUser.username;
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Criar notificação de sucesso
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// CSS para animação da notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);



// Gerar Código para Site
async function generateSiteCode() {
    try {
        showLoading(true);
        const response = await fetch("/api/tracking/codes");
        const data = await response.json();

        if (data.success) {
            const activeCodes = data.codes.filter(code => code.is_active);
            
            let headCodes = "";
            let bodyCodes = "";
            let footerCodes = "";

            activeCodes.forEach(code => {
                switch (code.position) {
                    case "head":
                        headCodes += `<!-- ${code.name} -->\n${code.code_content}\n`;
                        break;
                    case "body":
                        bodyCodes += `<!-- ${code.name} -->\n${code.code_content}\n`;
                        break;
                    case "footer":
                        footerCodes += `<!-- ${code.name} -->\n${code.code_content}\n`;
                        break;
                }
            });

            let output = "";
            if (headCodes) {
                output += "### Códigos para o Cabeçalho (dentro de <head>...<\/head>)\n\n```html\n" + headCodes + "```\n\n";
            }
            if (bodyCodes) {
                output += "### Códigos para o Corpo (dentro de <body>...<\/body>)\n\n```html\n" + bodyCodes + "```\n\n";
            }
            if (footerCodes) {
                output += "### Códigos para o Rodapé (antes de <\/body>)\n\n```html\n" + footerCodes + "```\n\n";
            }

            if (output) {
                // Criar um modal ou exibir em um textarea para o usuário copiar
                const codeOutputModal = document.createElement("div");
                codeOutputModal.id = "codeOutputModal";
                codeOutputModal.className = "modal";
                codeOutputModal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Códigos para o Site Principal</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Copie os códigos abaixo e cole nas respectivas seções do seu site principal (via GitHub/Netlify).</p>
                            <textarea id="generatedCodeContent" rows="20" readonly style="width: 100%; font-family: monospace;">${output}</textarea>
                            <button class="btn-primary mt-2" onclick="copyGeneratedCode()">Copiar Tudo</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(codeOutputModal);
                codeOutputModal.style.display = "block";

                codeOutputModal.querySelector(".modal-close").addEventListener("click", () => {
                    codeOutputModal.style.display = "none";
                    codeOutputModal.remove();
                });

            } else {
                showError("Nenhum código ativo para gerar.");
            }
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError("Erro ao gerar códigos para o site.");
    } finally {
        showLoading(false);
    }
}

function copyGeneratedCode() {
    const textarea = document.getElementById("generatedCodeContent");
    textarea.select();
    document.execCommand("copy");
    showSuccess("Código copiado para a área de transferência!");
}

// Funções de utilidade para mensagens e loading
function showLoading(show) {
    document.getElementById("loadingOverlay").style.display = show ? "flex" : "none";
}

function showError(message) {
    const errorDiv = document.getElementById("loginError");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
        setTimeout(() => errorDiv.style.display = "none", 5000);
    } else {
        alert("Erro: " + message);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}



