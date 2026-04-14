// 后台管理系统 JavaScript

// 检查登录状态
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname;
    
    // 检查当前页面是否为登录页面
    const isLoginPage = currentPage.includes('login.html');
    
    // 如果用户没有登录，并且当前页面不是登录页面，跳转到登录页面
    if (!isLoggedIn && !isLoginPage) {
        // 构建正确的登录页面路径
        if (currentPage.includes('admin/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
    }
    
    // 如果用户已经登录，并且当前页面是登录页面，跳转到后台管理首页
    if (isLoggedIn && isLoginPage) {
        // 构建正确的后台管理首页路径
        if (currentPage.includes('admin/')) {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'admin/index.html';
        }
    }
    
    // 如果用户已经登录，启动自动退出计时器
    if (isLoggedIn && !isLoginPage) {
        startAutoLogoutTimer();
    }
}

// 自动退出登录计时器
let autoLogoutTimer;
const AUTO_LOGOUT_TIME = 60 * 60 * 1000; // 1小时

// 启动自动退出计时器
function startAutoLogoutTimer() {
    // 清除之前的计时器
    clearTimeout(autoLogoutTimer);
    
    // 设置新的计时器
    autoLogoutTimer = setTimeout(() => {
        // 清除登录状态
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('rememberMe');
        
        // 跳转到登录页面
        const currentPage = window.location.pathname;
        if (currentPage.includes('admin/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
    }, AUTO_LOGOUT_TIME);
}

// 重置自动退出计时器
function resetAutoLogoutTimer() {
    startAutoLogoutTimer();
}

// 监听用户操作，重置计时器
function setupUserActivityListeners() {
    // 监听鼠标移动
    document.addEventListener('mousemove', resetAutoLogoutTimer);
    
    // 监听点击
    document.addEventListener('click', resetAutoLogoutTimer);
    
    // 监听键盘输入
    document.addEventListener('keypress', resetAutoLogoutTimer);
    
    // 监听滚动
    document.addEventListener('scroll', resetAutoLogoutTimer);
    
    // 监听触摸事件（移动设备）
    document.addEventListener('touchstart', resetAutoLogoutTimer);
    document.addEventListener('touchmove', resetAutoLogoutTimer);
}

// 登录功能
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupUserActivityListeners();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                // 向服务器发送登录请求
                fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('isLoggedIn', 'true');
                        showMessage('loginMessage', '登录成功！正在跳转...', 'success');
                        setTimeout(() => {
                            window.location.href = 'admin/index.html';
                        }, 1000);
                    } else {
                        showMessage('loginMessage', data.message || '用户名或密码错误！', 'error');
                    }
                })
                .catch(error => {
                    showMessage('loginMessage', '登录失败，请重试！', 'error');
                });
            });
    }
    
    function showMessage(elementId, message, type) {
        const msgEl = document.getElementById(elementId);
        msgEl.textContent = message;
        msgEl.className = `message ${type}`;
    }
    
    // 检查URL参数，处理快捷操作
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'new') {
        // 检查当前页面是否为文章管理或视频管理页面
        const currentPage = window.location.pathname;
        if (currentPage.includes('articles.html')) {
            showArticleForm();
        } else if (currentPage.includes('videos.html')) {
            showVideoForm();
        }
    }
    
    loadArticles();
    loadVideos();
    loadAboutData();
    
    const articleForm = document.getElementById('saveArticleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', saveArticle);
    }
    
    const videoForm = document.getElementById('saveVideoForm');
    if (videoForm) {
        videoForm.addEventListener('submit', saveVideo);
    }
});

// 退出登录
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('rememberMe');
}



// 加载文章列表
function loadArticles() {
    const tbody = document.getElementById('articlesTableBody');
    
    if (!tbody) return;
    
    fetch('/api/articles')
        .then(response => response.json())
        .then(articles => {
            if (articles.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
                            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                            暂无文章，点击右上角"新建文章"
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = '';
            articles.forEach(article => {
                html += `
                    <tr>
                        <td>${article.title}</td>
                        <td>${article.date}</td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline" onclick="editArticle('${article.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading articles:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        加载失败，请刷新页面重试
                    </td>
                </tr>
            `;
        });
}



// 显示文章表单
function showArticleForm() {
    document.getElementById('articleList').style.display = 'none';
    document.getElementById('articleForm').style.display = 'block';
    document.getElementById('formTitle').textContent = '新建文章';
    document.getElementById('saveArticleForm').reset();
    document.getElementById('articleId').value = '';
}

// 隐藏文章表单
function hideArticleForm() {
    document.getElementById('articleForm').style.display = 'none';
    document.getElementById('articleList').style.display = 'block';
}

// 保存文章
function saveArticle(e) {
    e.preventDefault();
    
    const id = document.getElementById('articleId').value;
    const title = document.getElementById('articleTitle').value;
    const summary = document.getElementById('articleSummary').value || '';
    const content = document.getElementById('articleContent').value;
    
    const articleData = {
        title,
        summary,
        content
    };
    
    const url = id ? `/api/articles/${id}` : '/api/articles';
    const method = id ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
    })
    .then(response => response.json())
    .then(data => {
        hideArticleForm();
        loadArticles();
        alert('文章保存成功！');
    })
    .catch(error => {
        console.error('Error saving article:', error);
        alert('保存失败，请重试');
    });
}

// 编辑文章
function editArticle(id) {
    fetch(`/api/articles`)  // 由于我们的 API 不支持单个文章获取，所以获取所有文章后过滤
        .then(response => response.json())
        .then(articles => {
            const article = articles.find(a => a.id === id);
            
            if (article) {
                document.getElementById('articleId').value = article.id;
                document.getElementById('articleTitle').value = article.title;
                document.getElementById('articleSummary').value = article.summary;
                document.getElementById('articleContent').value = article.content;
                
                document.getElementById('formTitle').textContent = '编辑文章';
                document.getElementById('articleList').style.display = 'none';
                document.getElementById('articleForm').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading article:', error);
            alert('加载文章失败，请重试');
        });
}

// 删除文章
function deleteArticle(id) {
    if (confirm('确定要删除这篇文章吗？')) {
        fetch(`/api/articles/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            loadArticles();
        })
        .catch(error => {
            console.error('Error deleting article:', error);
            alert('删除失败，请重试');
        });
    }
}

// 加载视频列表
function loadVideos() {
    const tbody = document.getElementById('videosTableBody');
    
    if (!tbody) return;
    
    fetch('/api/videos')
        .then(response => response.json())
        .then(videos => {
            if (videos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-light);">
                            <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                            暂无视频，点击右上角"新建视频"
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = '';
            videos.forEach(video => {
                html += `
                    <tr>
                        <td>${video.title}</td>
                        <td>${video.date}</td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline" onclick="editVideo('${video.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteVideo('${video.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading videos:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        加载失败，请刷新页面重试
                    </td>
                </tr>
            `;
        });
}

// 显示视频表单
function showVideoForm() {
    document.getElementById('videoList').style.display = 'none';
    document.getElementById('videoForm').style.display = 'block';
    document.getElementById('videoFormTitle').textContent = '新建视频';
    document.getElementById('saveVideoForm').reset();
    document.getElementById('videoId').value = '';
}

// 隐藏视频表单
function hideVideoForm() {
    document.getElementById('videoForm').style.display = 'none';
    document.getElementById('videoList').style.display = 'block';
}

// 保存视频
function saveVideo(e) {
    e.preventDefault();
    
    const id = document.getElementById('videoId').value;
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value || '';
    const videoFile = document.getElementById('videoFile').files[0];
    
    // 创建表单数据
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (videoFile) {
        formData.append('video', videoFile);
    }
    
    const url = id ? `/api/videos/${id}` : '/api/videos';
    const method = id ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideVideoForm();
        loadVideos();
        alert('视频保存成功！');
    })
    .catch(error => {
        console.error('Error saving video:', error);
        alert('保存失败，请重试');
    });
}

// 编辑视频
function editVideo(id) {
    fetch(`/api/videos`)  // 由于我们的 API 不支持单个视频获取，所以获取所有视频后过滤
        .then(response => response.json())
        .then(videos => {
            const video = videos.find(v => v.id === id);
            
            if (video) {
                document.getElementById('videoId').value = video.id;
                document.getElementById('videoTitle').value = video.title;
                document.getElementById('videoDescription').value = video.description;
                
                document.getElementById('videoFormTitle').textContent = '编辑视频';
                document.getElementById('videoList').style.display = 'none';
                document.getElementById('videoForm').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading video:', error);
            alert('加载视频失败，请重试');
        });
}

// 删除视频
function deleteVideo(id) {
    if (confirm('确定要删除这个视频吗？')) {
        fetch(`/api/videos/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            loadVideos();
        })
        .catch(error => {
            console.error('Error deleting video:', error);
            alert('删除失败，请重试');
        });
    }
}

// 关于页面管理
const defaultAboutData = {
    name: '时雨绘华',
    description: '热爱编程，专注前端开发和技术分享。喜欢探索新技术，乐于解决复杂问题。',
    location: '中国 · 武汉',
    email: '2437460945@qq.com',
    phone: '+86 15827483584',
    experiences: [
        {
            period: '2022 - 至今',
            title: '高级前端工程师',
            company: '某知名互联网公司',
            description: '负责核心产品的前端架构设计和开发'
        },
        {
            period: '2020 - 2022',
            title: '前端工程师',
            company: '某科技公司',
            description: '参与多个 Web 项目的开发和优化'
        },
        {
            period: '2018 - 2020',
            title: '初级前端工程师',
            company: '某创业公司',
            description: '负责公司官网和后台管理系统开发'
        }
    ],
    educations: [
        {
            period: '2014 - 2018',
            degree: '计算机科学与技术 - 本科',
            school: '某重点大学',
            description: '主修软件工程方向'
        }
    ]
};

function loadAboutData() {
    fetch('/api/about')
        .then(response => response.json())
        .then(aboutData => {
            if (document.getElementById('aboutName')) {
                document.getElementById('aboutName').value = aboutData.name;
                document.getElementById('aboutDesc').value = aboutData.description;
                document.getElementById('aboutLocation').value = aboutData.location;
                document.getElementById('aboutEmail').value = aboutData.email;
                document.getElementById('aboutPhone').value = aboutData.phone;
                
                renderWorkExperiences(aboutData.experiences);
                renderEducations(aboutData.educations);
            }
        })
        .catch(error => {
            console.error('Error loading about data:', error);
            // 如果加载失败，使用默认数据
            const aboutData = defaultAboutData;
            if (document.getElementById('aboutName')) {
                document.getElementById('aboutName').value = aboutData.name;
                document.getElementById('aboutDesc').value = aboutData.description;
                document.getElementById('aboutLocation').value = aboutData.location;
                document.getElementById('aboutEmail').value = aboutData.email;
                document.getElementById('aboutPhone').value = aboutData.phone;
                
                renderWorkExperiences(aboutData.experiences);
                renderEducations(aboutData.educations);
            }
        });
}

function renderWorkExperiences(experiences) {
    const container = document.getElementById('workExperiences');
    if (!container) return;
    
    container.innerHTML = '';
    experiences.forEach((exp, index) => {
        container.innerHTML += `
            <div class="dynamic-item">
                <button type="button" class="btn-remove" onclick="removeWorkExperience(${index})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="form-row">
                    <div class="form-group">
                        <label>时间段</label>
                        <input type="text" value="${exp.period}" onchange="updateWorkExperience(${index}, 'period', this.value)">
                    </div>
                    <div class="form-group">
                        <label>职位</label>
                        <input type="text" value="${exp.title}" onchange="updateWorkExperience(${index}, 'title', this.value)">
                    </div>
                </div>
                <div class="form-group">
                    <label>公司</label>
                    <input type="text" value="${exp.company}" onchange="updateWorkExperience(${index}, 'company', this.value)">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea rows="2" onchange="updateWorkExperience(${index}, 'description', this.value)">${exp.description}</textarea>
                </div>
            </div>
        `;
    });
}

function renderEducations(educations) {
    const container = document.getElementById('educationHistory');
    if (!container) return;
    
    container.innerHTML = '';
    educations.forEach((edu, index) => {
        container.innerHTML += `
            <div class="dynamic-item">
                <button type="button" class="btn-remove" onclick="removeEducation(${index})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="form-row">
                    <div class="form-group">
                        <label>时间段</label>
                        <input type="text" value="${edu.period}" onchange="updateEducation(${index}, 'period', this.value)">
                    </div>
                    <div class="form-group">
                        <label>学位/专业</label>
                        <input type="text" value="${edu.degree}" onchange="updateEducation(${index}, 'degree', this.value)">
                    </div>
                </div>
                <div class="form-group">
                    <label>学校</label>
                    <input type="text" value="${edu.school}" onchange="updateEducation(${index}, 'school', this.value)">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea rows="2" onchange="updateEducation(${index}, 'description', this.value)">${edu.description}</textarea>
                </div>
            </div>
        `;
    });
}

function addWorkExperience() {
    // 从界面获取当前的工作经历数据
    const experienceItems = document.querySelectorAll('#workExperiences .dynamic-item');
    const experiences = [];
    
    experienceItems.forEach((item, index) => {
        const period = item.querySelector('input[onchange*="period"]').value;
        const title = item.querySelector('input[onchange*="title"]').value;
        const company = item.querySelector('input[onchange*="company"]').value;
        const description = item.querySelector('textarea[onchange*="description"]').value;
        
        if (period || title || company || description) {
            experiences.push({ period, title, company, description });
        }
    });
    
    // 添加新的工作经历项
    experiences.push({
        period: '',
        title: '',
        company: '',
        description: ''
    });
    
    renderWorkExperiences(experiences);
}

function removeWorkExperience(index) {
    // 从界面获取当前的工作经历数据
    const experienceItems = document.querySelectorAll('#workExperiences .dynamic-item');
    const experiences = [];
    
    experienceItems.forEach((item, i) => {
        if (i !== index) {
            const period = item.querySelector('input[onchange*="period"]').value;
            const title = item.querySelector('input[onchange*="title"]').value;
            const company = item.querySelector('input[onchange*="company"]').value;
            const description = item.querySelector('textarea[onchange*="description"]').value;
            
            if (period || title || company || description) {
                experiences.push({ period, title, company, description });
            }
        }
    });
    
    renderWorkExperiences(experiences);
}



function addEducation() {
    // 从界面获取当前的教育数据
    const educationItems = document.querySelectorAll('#educationHistory .dynamic-item');
    const educations = [];
    
    educationItems.forEach((item, index) => {
        const period = item.querySelector('input[onchange*="period"]').value;
        const degree = item.querySelector('input[onchange*="degree"]').value;
        const school = item.querySelector('input[onchange*="school"]').value;
        const description = item.querySelector('textarea[onchange*="description"]').value;
        
        if (period || degree || school || description) {
            educations.push({ period, degree, school, description });
        }
    });
    
    // 添加新的教育项
    educations.push({
        period: '',
        degree: '',
        school: '',
        description: ''
    });
    
    renderEducations(educations);
}

function removeEducation(index) {
    // 从界面获取当前的教育数据
    const educationItems = document.querySelectorAll('#educationHistory .dynamic-item');
    const educations = [];
    
    educationItems.forEach((item, i) => {
        if (i !== index) {
            const period = item.querySelector('input[onchange*="period"]').value;
            const degree = item.querySelector('input[onchange*="degree"]').value;
            const school = item.querySelector('input[onchange*="school"]').value;
            const description = item.querySelector('textarea[onchange*="description"]').value;
            
            if (period || degree || school || description) {
                educations.push({ period, degree, school, description });
            }
        }
    });
    
    renderEducations(educations);
}



function saveAboutData() {
    // 获取当前的经历和教育数据
    let experiences = [];
    let educations = [];
    
    // 从界面上获取经历数据
    const experienceItems = document.querySelectorAll('#workExperiences .dynamic-item');
    experienceItems.forEach((item, index) => {
        const period = item.querySelector('input[onchange*="period"]').value;
        const title = item.querySelector('input[onchange*="title"]').value;
        const company = item.querySelector('input[onchange*="company"]').value;
        const description = item.querySelector('textarea[onchange*="description"]').value;
        
        if (period || title || company || description) {
            experiences.push({ period, title, company, description });
        }
    });
    
    // 从界面上获取教育数据
    const educationItems = document.querySelectorAll('#educationHistory .dynamic-item');
    educationItems.forEach((item, index) => {
        const period = item.querySelector('input[onchange*="period"]').value;
        const degree = item.querySelector('input[onchange*="degree"]').value;
        const school = item.querySelector('input[onchange*="school"]').value;
        const description = item.querySelector('textarea[onchange*="description"]').value;
        
        if (period || degree || school || description) {
            educations.push({ period, degree, school, description });
        }
    });
    
    const aboutData = {
        name: document.getElementById('aboutName').value,
        description: document.getElementById('aboutDesc').value,
        location: document.getElementById('aboutLocation').value,
        email: document.getElementById('aboutEmail').value,
        phone: document.getElementById('aboutPhone').value,
        experiences: experiences,
        educations: educations
    };
    
    fetch('/api/about', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(aboutData)
    })
    .then(response => response.json())
    .then(data => {
        alert('关于页面信息保存成功！');
    })
    .catch(error => {
        console.error('Error saving about data:', error);
        alert('保存失败，请重试');
    });
}
