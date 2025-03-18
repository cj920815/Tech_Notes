// DOM Elements
const adminLoginBtn = document.getElementById('adminLoginBtn');
const helpStationBtn = document.getElementById('helpStationBtn');
const adminModal = document.getElementById('adminModal');
const adminPanelModal = document.getElementById('adminPanelModal');
const linkFormModal = document.getElementById('linkFormModal');
const confirmLinkModal = document.getElementById('confirmLinkModal');
const sloganFormModal = document.getElementById('sloganFormModal');
const helpStationModal = document.getElementById('helpStationModal');
const helpStationFormModal = document.getElementById('helpStationFormModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const linkForm = document.getElementById('linkForm');
const sloganForm = document.getElementById('sloganForm');
const helpStationForm = document.getElementById('helpStationForm');
const addLinkBtn = document.getElementById('addLinkBtn');
const editSloganBtn = document.getElementById('editSloganBtn');
const logoutBtn = document.getElementById('logoutBtn');
const linksContainer = document.querySelector('.links-container');
const adminLinksContainer = document.querySelector('.admin-links-container');
const categoryFilter = document.querySelector('.category-filter');
const confirmLinkBtn = document.getElementById('confirmLinkBtn');
const cancelLinkBtn = document.getElementById('cancelLinkBtn');
const currentSlogan = document.getElementById('current-slogan');
const helpStationContent = document.getElementById('helpStationContent');

// Close buttons
const closeButtons = document.querySelectorAll('.close');
const cancelLinkFormBtn = document.getElementById('cancelLinkForm');
const cancelSloganFormBtn = document.getElementById('cancelSloganForm');
const cancelHelpStationFormBtn = document.getElementById('cancelHelpStationForm');

// Global variables
let links = [];
let currentLinkUrl = '';
let isAdmin = false;
let categories = new Set();

// LeanCloud 初始化
AV.init({
    appId: window.ENV.LEANCLOUD_APP_ID,
    appKey: window.ENV.LEANCLOUD_APP_KEY,
    serverURL: window.ENV.LEANCLOUD_SERVER_URL
});

// Login attempt management
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 24 * 60 * 60 * 1000; // 5天锁定时间（毫秒）
// 5天 = 5 * 24小时 * 60分钟 * 60秒 * 1000毫秒

const getLoginAttempts = () => {
    const attempts = localStorage.getItem('loginAttempts') || '0';
    return parseInt(attempts);
};

const getLockoutTime = () => {
    return parseInt(localStorage.getItem('lockoutUntil') || '0');
};

const incrementLoginAttempts = () => {
    const attempts = getLoginAttempts() + 1;
    localStorage.setItem('loginAttempts', attempts);
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem('lockoutUntil', lockoutUntil);
    }
    
    return attempts;
};

const resetLoginAttempts = () => {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutUntil');
};

const isAccountLocked = () => {
    const lockoutUntil = getLockoutTime();
    if (lockoutUntil > Date.now()) {
        const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
        return `账号已被锁定，请在 ${remainingMinutes} 分钟后重试`;
    }
    return false;
};

// Admin credentials
const ADMIN_USERNAME = window.ENV.ADMIN_USERNAME;
const ADMIN_PASSWORD = window.ENV.ADMIN_PASSWORD;

// Token management
const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const saveToken = (token) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('tokenExpiry', Date.now() + 24 * 60 * 60 * 1000); // 24小时过期
};

const validateToken = () => {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) return false;
    if (Date.now() > parseInt(expiry)) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('tokenExpiry');
        return false;
    }
    return true;
};

// Check if user is already logged in
const checkAuthStatus = () => {
    if (validateToken()) {
        isAdmin = true;
        return true;
    }
    return false;
};

// Initialize the application
async function init() {
    checkAuthStatus();
    await loadLinks();
    renderLinks();
    setupEventListeners();
    createParticles();
    animateParticles();
    loadSlogan();
    loadHelpStationContent();
    
    // 设置联系信息
    document.getElementById('contactInfo').textContent = window.ENV.HELP_CONTACT;
}

// Load links from LeanCloud
async function loadLinks() {
    try {
        // 创建 Link 查询
        const query = new AV.Query('Link');
        query.descending('createdAt');
        const results = await query.find();
        
        if (results.length > 0) {
            // 将 LeanCloud 对象转换为普通 JS 对象
            links = results.map(link => ({
                id: link.id,
                title: link.get('title'),
                url: link.get('url'),
                category: link.get('category'),
                views: link.get('views') || 0,
                visible: link.get('visible'),
                credential: link.get('credential'),
                created_at: link.get('createdAt').toISOString(),
                updated_at: link.get('updatedAt').toISOString()
            }));
        } else {
            // Sample data for initial display
            links = [
                {
                    id: 1,
                    title: "AI助手使用教程",
                    url: "https://example.com/ai-tutorial",
                    category: "教程",
                    views: 128,
                    visible: true,
                    credential: "",
                    created_at: new Date(2023, 5, 15).toISOString(),
                    updated_at: new Date(2023, 5, 15).toISOString()
                },
                {
                    id: 2,
                    title: "ChatGPT高级提示词技巧",
                    url: "https://example.com/chatgpt-prompts",
                    category: "AI工具",
                    views: 256,
                    visible: true,
                    credential: "",
                    created_at: new Date(2023, 6, 20).toISOString(),
                    updated_at: new Date(2023, 6, 20).toISOString()
                },
                {
                    id: 3,
                    title: "2023年最佳编程学习资源",
                    url: "https://example.com/coding-resources",
                    category: "编程",
                    views: 89,
                    visible: true,
                    credential: "",
                    created_at: new Date(2023, 7, 5).toISOString(),
                    updated_at: new Date(2023, 7, 5).toISOString()
                }
            ];
            // 将示例数据保存到 LeanCloud
            await saveLinks();
        }
    } catch (error) {
        console.error('Error loading links from LeanCloud:', error);
        // 如果从 LeanCloud 加载失败，尝试从 localStorage 加载
        const storedLinks = localStorage.getItem('links');
        if (storedLinks) {
            links = JSON.parse(storedLinks);
        }
    }

    // Extract categories
    updateCategories();
}

// Save links to LeanCloud
async function saveLinks() {
    try {
        // 保存到 localStorage 作为备份
        localStorage.setItem('links', JSON.stringify(links));
        
        // 保存到 LeanCloud
        for (const link of links) {
            let linkObject;
            
            if (link.id && typeof link.id === 'string' && link.id.length > 10) {
                // 如果是已有的 LeanCloud 对象（ID是长字符串），获取它
                linkObject = AV.Object.createWithoutData('Link', link.id);
            } else {
                // 否则创建新对象
                linkObject = new AV.Object('Link');
            }
            
            // 设置属性
            linkObject.set('title', link.title);
            linkObject.set('url', link.url);
            linkObject.set('category', link.category);
            linkObject.set('views', link.views);
            linkObject.set('visible', link.visible);
            linkObject.set('credential', link.credential);
            
            // 保存对象
            await linkObject.save();
            
            // 如果是新创建的对象，更新本地 ID
            if (!link.id || typeof link.id !== 'string' || link.id.length <= 10) {
                link.id = linkObject.id;
            }
        }
    } catch (error) {
        console.error('Error saving links to LeanCloud:', error);
    }
}

// Update categories based on current links
function updateCategories() {
    categories = new Set();
    links.forEach(link => {
        if (link.visible) {
            categories.add(link.category);
        }
    });
    renderCategories();
}

// Render category filter buttons
function renderCategories() {
    // Clear existing category buttons except "All"
    const allCategoryBtn = categoryFilter.querySelector('[data-category="all"]');
    categoryFilter.innerHTML = '';
    categoryFilter.appendChild(allCategoryBtn);

    // Add category buttons
    categories.forEach(category => {
        const categoryBtn = document.createElement('button');
        categoryBtn.className = 'category-btn';
        categoryBtn.setAttribute('data-category', category);
        categoryBtn.textContent = category;
        categoryFilter.appendChild(categoryBtn);
    });
}

// Render links in the main container
function renderLinks() {
    // Remove loading animation
    const loadingAnimation = linksContainer.querySelector('.loading-animation');
    if (loadingAnimation) {
        loadingAnimation.remove();
    }

    // Clear existing links
    linksContainer.innerHTML = '';

    // Get active category filter
    const activeCategory = document.querySelector('.category-btn.active')?.getAttribute('data-category') || 'all';

    // Filter links by category and visibility
    const filteredLinks = links.filter(link => {
        return link.visible && (activeCategory === 'all' || link.category === activeCategory);
    });

    if (filteredLinks.length === 0) {
        const noLinks = document.createElement('div');
        noLinks.className = 'no-links';
        noLinks.textContent = '暂无链接';
        noLinks.style.gridColumn = '1 / -1';
        noLinks.style.textAlign = 'center';
        noLinks.style.padding = '40px 0';
        linksContainer.appendChild(noLinks);
        return;
    }

    // Render each link
    filteredLinks.forEach(link => {
        const linkCard = document.createElement('div');
        linkCard.className = 'link-card';
        linkCard.innerHTML = `
            <h3 class="link-title">${link.title}</h3>
            <a href="#" class="link-url" data-url="${link.url}" data-id="${link.id}">${link.url}</a>
            <div class="link-meta">
                <span class="link-category">${link.category}</span>
                <span class="link-views"><i class="far fa-eye"></i> ${link.views}</span>
                ${link.credential ? '<span class="link-credential"><i class="fas fa-key"></i> 需要凭证</span>' : ''}
            </div>
            <div class="link-date">添加于 ${formatDate(link.created_at)}</div>
        `;

        // Add click event to the link
        const linkUrl = linkCard.querySelector('.link-url');
        setupLinkClickHandler(linkUrl, link);

        linksContainer.appendChild(linkCard);
    });
}

// Render links in the admin panel
function renderAdminLinks() {
    adminLinksContainer.innerHTML = '';

    links.forEach(link => {
        const linkItem = document.createElement('div');
        linkItem.className = `admin-link-item ${!link.visible ? 'hidden-link' : ''}`;
        linkItem.innerHTML = `
            <div class="admin-link-info">
                <div class="admin-link-title">${link.title}</div>
                <div class="admin-link-url">${link.url}</div>
                <div class="admin-link-meta">
                    <span>分类: ${link.category}</span>
                    <span>浏览量: ${link.views}</span>
                    <span>状态: ${link.visible ? '显示' : '隐藏'}</span>
                    ${link.credential ? `<span>凭证: ${link.credential}</span>` : ''}
                </div>
            </div>
            <div class="admin-link-actions">
                <button class="edit-btn" data-id="${link.id}"><i class="fas fa-edit"></i></button>
                <button class="toggle-btn" data-id="${link.id}">
                    <i class="fas ${link.visible ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button class="delete-btn" data-id="${link.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

        adminLinksContainer.appendChild(linkItem);
    });

    // Add event listeners to admin link actions
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editLink(id);
        });
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            toggleLinkVisibility(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteLink(id);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Admin login button
    adminLoginBtn.addEventListener('click', () => {
        if (checkAuthStatus()) {
            adminPanelModal.style.display = 'block';
            renderAdminLinks();
        } else {
            // 检查是否被锁定
            const lockStatus = isAccountLocked();
            if (lockStatus) {
                alert(lockStatus);
                return;
            }
            adminModal.style.display = 'block';
        }
    });

    // Admin login form submission
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 检查是否被锁定
        const lockStatus = isAccountLocked();
        if (lockStatus) {
            alert(lockStatus);
            return;
        }

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                isAdmin = true;
                const token = generateToken();
                saveToken(token);
                
                // 重置登录尝试次数
                resetLoginAttempts();
                
                adminModal.style.display = 'none';
                adminPanelModal.style.display = 'block';
                renderAdminLinks();
                
                // 清除密码输入
                document.getElementById('password').value = '';
            } else {
                handleLoginFailure();
            }
        } catch (error) {
            handleLoginFailure();
        }
    });

    // 处理登录失败
    const handleLoginFailure = () => {
        const attempts = incrementLoginAttempts();
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
        
        if (remainingAttempts > 0) {
            alert(`登录失败，还剩 ${remainingAttempts} 次尝试机会`);
        } else {
            const lockoutMinutes = LOCKOUT_DURATION / 60000;
            alert(`登录失败次数过多，账号已被锁定 ${lockoutMinutes} 分钟`);
        }
        
        // 清除密码输入
        document.getElementById('password').value = '';
    };

    // Add logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            isAdmin = false;
            localStorage.removeItem('adminToken');
            localStorage.removeItem('tokenExpiry');
            adminPanelModal.style.display = 'none';
            
            // 清除登录表单的输入内容
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        });
    }

    // Add link button
    addLinkBtn.addEventListener('click', () => {
        document.getElementById('linkFormTitle').textContent = '添加新链接';
        document.getElementById('linkId').value = '';
        document.getElementById('linkTitle').value = '';
        document.getElementById('linkUrl').value = '';
        document.getElementById('linkCategory').value = '';
        document.getElementById('linkVisible').checked = true;
        
        adminPanelModal.style.display = 'none';
        linkFormModal.style.display = 'block';
    });

    // Link form submission
    linkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('linkId').value;
        const title = document.getElementById('linkTitle').value;
        const url = document.getElementById('linkUrl').value;
        const category = document.getElementById('linkCategory').value;
        const visible = document.getElementById('linkVisible').checked;
        
        if (id) {
            // Update existing link
            await updateLink(id, title, url, category, visible);
        } else {
            // Add new link
            await addLink(title, url, category, visible);
        }
        
        linkFormModal.style.display = 'none';
        adminPanelModal.style.display = 'block';
    });

    // Category filter buttons
    categoryFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            // Remove active class from all buttons
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Render links with the selected category
            renderLinks();
        }
    });

    // Confirm link buttons
    confirmLinkBtn.addEventListener('click', async () => {
        const linkUrl = document.querySelector(`.link-url[data-url="${currentLinkUrl}"]`);
        const linkId = linkUrl.getAttribute('data-id');
        const link = links.find(l => l.id === linkId);
        
        if (link.credential && link.credential.length > 0) {
            const userCredential = document.getElementById('userCredential').value;
            if (!userCredential) {
                alert('请输入访问凭证');
                return;
            }
            if (userCredential !== link.credential) {
                alert('访问凭证不正确');
                return;
            }
        }
        
        // Increment view count
        await incrementLinkViews(linkId);
        
        // Open link in new tab
        window.open(currentLinkUrl, '_blank');
        confirmLinkModal.style.display = 'none';
        document.getElementById('userCredential').value = '';
    });

    cancelLinkBtn.addEventListener('click', () => {
        confirmLinkModal.style.display = 'none';
    });

    // UP急救站按钮点击事件
    helpStationBtn.addEventListener('click', () => {
        helpStationModal.style.display = 'block';
    });

    // 编辑急救站按钮点击事件
    if (document.getElementById('editHelpStationBtn')) {
        document.getElementById('editHelpStationBtn').addEventListener('click', openHelpStationForm);
    }

    // 急救站表单提交事件
    if (helpStationForm) {
        helpStationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('helpTitle').value.trim();
            const content = document.getElementById('helpContent').value.trim();
            const contact = document.getElementById('helpContact').value.trim();
            const note = document.getElementById('helpNote').value.trim();
            
            if (!title || !content || !contact || !note) {
                alert('请填写所有字段');
                return;
            }
            
            const submitBtn = helpStationForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
            submitBtn.disabled = true;
            
            try {
                const success = await saveHelpStationContent(title, content, contact, note);
                
                if (success) {
                    updateHelpStationUI(title, content, contact, note);
                    helpStationFormModal.style.display = 'none';
                } else {
                    alert('保存急救站内容失败，请重试');
                }
            } catch (error) {
                console.error('保存急救站内容出错:', error);
                alert('保存急救站内容时发生错误，请重试');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // 取消急救站编辑按钮点击事件
    if (cancelHelpStationFormBtn) {
        cancelHelpStationFormBtn.addEventListener('click', () => {
            helpStationFormModal.style.display = 'none';
        });
    }

    // Close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            adminModal.style.display = 'none';
            adminPanelModal.style.display = 'none';
            linkFormModal.style.display = 'none';
            confirmLinkModal.style.display = 'none';
            sloganFormModal.style.display = 'none';
            helpStationModal.style.display = 'none';
            helpStationFormModal.style.display = 'none';
        });
    });

    // Cancel link form button
    cancelLinkFormBtn.addEventListener('click', () => {
        linkFormModal.style.display = 'none';
        adminPanelModal.style.display = 'block';
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) adminModal.style.display = 'none';
        if (e.target === adminPanelModal) adminPanelModal.style.display = 'none';
        if (e.target === linkFormModal) linkFormModal.style.display = 'none';
        if (e.target === confirmLinkModal) confirmLinkModal.style.display = 'none';
        if (e.target === sloganFormModal) sloganFormModal.style.display = 'none';
        if (e.target === helpStationModal) helpStationModal.style.display = 'none';
        if (e.target === helpStationFormModal) helpStationFormModal.style.display = 'none';
    });
}

// CRUD Operations for Links

// Add a new link
async function addLink(title, url, category, visible) {
    try {
        const credential = document.getElementById('linkCredential').value;
        
        // 创建新的 Link 对象
        const linkObject = new AV.Object('Link');
        linkObject.set('title', title);
        linkObject.set('url', url);
        linkObject.set('category', category);
        linkObject.set('views', 0);
        linkObject.set('visible', visible);
        linkObject.set('credential', credential);
        
        // 保存到 LeanCloud
        await linkObject.save();
        
        // 创建本地对象
        const newLink = {
            id: linkObject.id,
            title,
            url,
            category,
            views: 0,
            visible,
            credential,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        links.push(newLink);
        
        // 保存到 localStorage 作为备份
        localStorage.setItem('links', JSON.stringify(links));
        
        updateCategories();
        renderAdminLinks();
        renderLinks();
    } catch (error) {
        console.error('Error adding link to LeanCloud:', error);
        alert('添加链接失败，请重试');
    }
}

// Edit a link
function editLink(id) {
    const link = links.find(link => link.id === id);
    if (link) {
        document.getElementById('linkFormTitle').textContent = '编辑链接';
        document.getElementById('linkId').value = link.id;
        document.getElementById('linkTitle').value = link.title;
        document.getElementById('linkUrl').value = link.url;
        document.getElementById('linkCategory').value = link.category;
        document.getElementById('linkVisible').checked = link.visible;
        document.getElementById('linkCredential').value = link.credential || '';
        
        adminPanelModal.style.display = 'none';
        linkFormModal.style.display = 'block';
    }
}

// Update a link
async function updateLink(id, title, url, category, visible) {
    try {
        const credential = document.getElementById('linkCredential').value;
        const linkIndex = links.findIndex(link => link.id === id);
        if (linkIndex !== -1) {
            const oldCategory = links[linkIndex].category;
            
            // 更新 LeanCloud 对象
            const linkObject = AV.Object.createWithoutData('Link', id);
            linkObject.set('title', title);
            linkObject.set('url', url);
            linkObject.set('category', category);
            linkObject.set('visible', visible);
            linkObject.set('credential', credential);
            await linkObject.save();
            
            // 更新本地对象
            links[linkIndex] = {
                ...links[linkIndex],
                title,
                url,
                category,
                visible,
                credential,
                updated_at: new Date().toISOString()
            };
            
            // 保存到 localStorage 作为备份
            localStorage.setItem('links', JSON.stringify(links));
            
            // Update categories if the category changed
            if (oldCategory !== category) {
                updateCategories();
            }
            
            renderAdminLinks();
            renderLinks();
        }
    } catch (error) {
        console.error('Error updating link in LeanCloud:', error);
        alert('更新链接失败，请重试');
    }
}

// Toggle link visibility
async function toggleLinkVisibility(id) {
    try {
        const linkIndex = links.findIndex(link => link.id === id);
        if (linkIndex !== -1) {
            const newVisibility = !links[linkIndex].visible;
            
            // 更新 LeanCloud 对象
            const linkObject = AV.Object.createWithoutData('Link', id);
            linkObject.set('visible', newVisibility);
            await linkObject.save();
            
            // 更新本地对象
            links[linkIndex].visible = newVisibility;
            links[linkIndex].updated_at = new Date().toISOString();
            
            // 保存到 localStorage 作为备份
            localStorage.setItem('links', JSON.stringify(links));
            
            updateCategories();
            renderAdminLinks();
            renderLinks();
        }
    } catch (error) {
        console.error('Error toggling link visibility in LeanCloud:', error);
        alert('更改链接可见性失败，请重试');
    }
}

// Delete a link
async function deleteLink(id) {
    if (confirm('确定要删除这个链接吗？')) {
        try {
            // 从 LeanCloud 删除
            const linkObject = AV.Object.createWithoutData('Link', id);
            await linkObject.destroy();
            
            // 从本地数组删除
            const linkIndex = links.findIndex(link => link.id === id);
            if (linkIndex !== -1) {
                links.splice(linkIndex, 1);
                
                // 保存到 localStorage 作为备份
                localStorage.setItem('links', JSON.stringify(links));
                
                updateCategories();
                renderAdminLinks();
                renderLinks();
            }
        } catch (error) {
            console.error('Error deleting link from LeanCloud:', error);
            alert('删除链接失败，请重试');
        }
    }
}

// Increment link views
async function incrementLinkViews(id) {
    try {
        const linkIndex = links.findIndex(link => link.id === id);
        if (linkIndex !== -1) {
            // 更新本地对象
            links[linkIndex].views++;
            
            // 更新 LeanCloud 对象
            const linkObject = AV.Object.createWithoutData('Link', id);
            linkObject.increment('views', 1);
            await linkObject.save();
            
            // 保存到 localStorage 作为备份
            localStorage.setItem('links', JSON.stringify(links));
            
            // Update view count in the UI
            const viewsElement = document.querySelector(`.link-url[data-id="${id}"]`)
                .parentElement.querySelector('.link-views');
            if (viewsElement) {
                viewsElement.innerHTML = `<i class="far fa-eye"></i> ${links[linkIndex].views}`;
            }
        }
    } catch (error) {
        console.error('Error incrementing link views in LeanCloud:', error);
    }
}

// Helper Functions

// Format date to a readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Create particles for tech theme
function createParticles() {
    const logoParticles = document.querySelector('.logo-particles');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.position = 'absolute';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.backgroundColor = 'rgba(0, 180, 216, 0.7)';
        particle.style.borderRadius = '50%';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.opacity = '0';
        
        // Random movement direction
        particle.style.setProperty('--x', `${(Math.random() - 0.5) * 50}px`);
        particle.style.setProperty('--y', `${(Math.random() - 0.5) * 50}px`);
        
        logoParticles.appendChild(particle);
    }
}

// Animate particles
function animateParticles() {
    const particles = document.querySelectorAll('.particle');
    
    particles.forEach(particle => {
        // Random animation duration
        const duration = 2 + Math.random() * 3;
        particle.style.animation = `particle ${duration}s infinite`;
        
        // Random delay
        particle.style.animationDelay = `${Math.random() * 5}s`;
    });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// 修改链接点击事件处理
function setupLinkClickHandler(linkUrl, link) {
    linkUrl.addEventListener('click', (e) => {
        e.preventDefault();
        currentLinkUrl = link.url;
        const credentialSection = document.getElementById('credentialSection');
        const confirmBtn = document.getElementById('confirmLinkBtn');
        
        if (link.credential) {
            credentialSection.style.display = 'block';
            document.getElementById('userCredential').value = '';
            confirmBtn.disabled = true;
            
            // 添加凭证输入框的事件监听
            const credentialInput = document.getElementById('userCredential');
            credentialInput.oninput = () => {
                confirmBtn.disabled = !credentialInput.value;
            };
        } else {
            credentialSection.style.display = 'none';
            confirmBtn.disabled = false;
        }
        
        confirmLinkModal.style.display = 'block';
    });
}

// 加载文案
const loadSlogan = async () => {
    try {
        const query = new AV.Query('Slogan');
        query.descending('createdAt');
        query.limit(1);
        const results = await query.find();
        
        if (results.length > 0) {
            const slogan = results[0].get('text');
            currentSlogan.textContent = slogan;
        }
    } catch (error) {
        console.error('加载文案失败:', error);
    }
};

// 保存文案
const saveSlogan = async (text) => {
    try {
        const Slogan = AV.Object.extend('Slogan');
        const slogan = new Slogan();
        slogan.set('text', text);
        await slogan.save();
        return true;
    } catch (error) {
        console.error('保存文案失败:', error);
        return false;
    }
};

// 文案编辑按钮点击事件
if (editSloganBtn) {
    editSloganBtn.addEventListener('click', () => {
        document.getElementById('sloganText').value = currentSlogan.textContent;
        sloganFormModal.style.display = 'block';
        
        // 自动聚焦文本区域
        setTimeout(() => {
            document.getElementById('sloganText').focus();
        }, 300);
    });
}

// 文案表单提交事件
if (sloganForm) {
    sloganForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const sloganText = document.getElementById('sloganText').value.trim();
        const submitBtn = sloganForm.querySelector('button[type="submit"]');
        
        if (!sloganText) {
            alert('请输入文案内容');
            return;
        }
        
        // 显示保存中状态
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
        submitBtn.disabled = true;
        
        try {
            const success = await saveSlogan(sloganText);
            
            if (success) {
                currentSlogan.textContent = sloganText;
                sloganFormModal.style.display = 'none';
                
                // 添加保存成功的视觉反馈
                const sloganContainer = document.querySelector('.slogan-container');
                sloganContainer.classList.add('save-success');
                setTimeout(() => {
                    sloganContainer.classList.remove('save-success');
                }, 1000);
            } else {
                alert('保存文案失败，请重试');
            }
        } catch (error) {
            console.error('保存文案出错:', error);
            alert('保存文案时发生错误，请重试');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// 取消文案编辑按钮点击事件
if (cancelSloganFormBtn) {
    cancelSloganFormBtn.addEventListener('click', () => {
        sloganFormModal.style.display = 'none';
    });
}

// 加载急救站内容
const loadHelpStationContent = async () => {
    try {
        const query = new AV.Query('HelpStation');
        query.descending('createdAt');
        query.limit(1);
        const results = await query.find();
        
        if (results.length > 0) {
            const helpStation = results[0];
            const title = helpStation.get('title');
            const content = helpStation.get('content');
            const contact = helpStation.get('contact');
            const note = helpStation.get('note');
            
            updateHelpStationUI(title, content, contact, note);
        }
    } catch (error) {
        console.error('加载急救站内容失败:', error);
    }
};

// 保存急救站内容
const saveHelpStationContent = async (title, content, contact, note) => {
    try {
        const HelpStation = AV.Object.extend('HelpStation');
        const helpStation = new HelpStation();
        helpStation.set('title', title);
        helpStation.set('content', content);
        helpStation.set('contact', contact);
        helpStation.set('note', note);
        await helpStation.save();
        return true;
    } catch (error) {
        console.error('保存急救站内容失败:', error);
        return false;
    }
};

// 更新急救站UI
const updateHelpStationUI = (title, content, contact, note) => {
    const helpStationTitle = document.querySelector('.help-station h2');
    if (helpStationTitle) helpStationTitle.textContent = title;
    
    helpStationContent.innerHTML = `
        <p>${content}</p>
        <p class="help-contact">带价微信咨询：<strong id="contactInfo">${contact}</strong></p>
        <p class="help-note">${note}</p>
    `;
};

// 打开急救站编辑表单
const openHelpStationForm = () => {
    const helpStationTitle = document.querySelector('.help-station h2').textContent;
    const contentText = helpStationContent.querySelector('p:first-child').textContent;
    const contactText = document.getElementById('contactInfo').textContent;
    const noteText = helpStationContent.querySelector('.help-note').textContent;
    
    document.getElementById('helpTitle').value = helpStationTitle;
    document.getElementById('helpContent').value = contentText;
    document.getElementById('helpContact').value = contactText;
    document.getElementById('helpNote').value = noteText;
    
    adminPanelModal.style.display = 'none';
    helpStationFormModal.style.display = 'block';
    
    // 自动聚焦标题输入框
    setTimeout(() => {
        document.getElementById('helpTitle').focus();
    }, 300);
};