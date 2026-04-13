// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // 点击导航链接后关闭菜单
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        // 添加/移除滚动样式
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }

        lastScroll = currentScroll;
    });

    // 返回顶部按钮
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    if (backToTop) {
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 计算运营天数
    function calculateDays() {
        const startDate = new Date('2026-04-01'); // 假设博客开始日期是2026-04-01
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // 更新统计数据
    function updateStats(articleCount, videoCount) {
        // 更新文章数
        const articleCountElement = document.getElementById('articleCount');
        if (articleCountElement) {
            articleCountElement.textContent = articleCount;
        }

        // 更新视频数
        const videoCountElement = document.getElementById('videoCount');
        if (videoCountElement) {
            videoCountElement.textContent = videoCount;
        }

        // 更新运营天数
        const daysCountElement = document.getElementById('daysCount');
        if (daysCountElement) {
            daysCountElement.textContent = calculateDays();
        }
    }

    // 初始化统计数据
    function initStats() {
        // 获取文章和视频数据
        Promise.all([
            fetch('/api/articles').then(response => response.json()),
            fetch('/api/videos').then(response => response.json())
        ]).then(([articles, videos]) => {
            updateStats(articles.length, videos.length);
        }).catch(error => {
            console.error('Error loading stats:', error);
        });
    }

    // 初始化统计数据
    initStats();

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 文章卡片加载动画
    const articleCards = document.querySelectorAll('.article-card, .article-list-item');
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    articleCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        cardObserver.observe(card);
    });





    // 加载动态内容
    loadArticlesFromAPI();
    loadVideosFromAPI();
    loadAboutFromAPI();
    loadArticlesListFromAPI();
    loadVideosListFromAPI();

    console.log('🚀 博客网站已加载完成！');
});

// 加载文章列表页面数据
function loadArticlesListFromAPI(page = 1) {
    const articlesList = document.querySelector('.articles-list');
    const pagination = document.querySelector('.pagination');
    if (!articlesList) return;

    fetch('/api/articles')
        .then(response => response.json())
        .then(articles => {
            if (articles.length === 0) {
                articlesList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        暂无文章
                    </div>
                `;
                if (pagination) pagination.style.display = 'none';
                return;
            }

            // 分页设置
            const pageSize = 5;
            const totalPages = Math.ceil(articles.length / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedArticles = articles.slice(startIndex, endIndex);

            // 生成文章列表
            let html = '';
            paginatedArticles.forEach(article => {
                html += `
                    <article class="article-list-item" data-id="${article.id}" onclick="showArticleDetail('${article.id}')">
                        <div class="article-content">
                            ${article.category ? `<span class="article-category">${article.category}</span>` : ''}
                            <h3 class="article-title">${article.title}</h3>
                            <p class="article-excerpt">${article.summary}</p>
                            <div class="article-date">${article.date || ''}</div>
                        </div>
                    </article>
                `;
            });

            articlesList.innerHTML = html;

            // 生成分页控件
            if (pagination) {
                let paginationHtml = `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${page > 1 ? page - 1 : 1})">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                `;

                for (let i = 1; i <= totalPages; i++) {
                    if (i === page) {
                        paginationHtml += `
                            <a href="#" class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${i})")">
                                ${i}
                            </a>
                        `;
                    } else {
                        paginationHtml += `
                            <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${i})")">
                                ${i}
                            </a>
                        `;
                    }
                }

                paginationHtml += `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${page < totalPages ? page + 1 : totalPages})">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                `;

                pagination.innerHTML = paginationHtml;
                pagination.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Error loading articles:', error);
            articlesList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    加载失败，请刷新页面重试
                </div>
            `;
            if (pagination) pagination.style.display = 'none';
        });
}

// 显示文章详细内容
function showArticleDetail(articleId) {
    fetch('/api/articles')
        .then(response => response.json())
        .then(articles => {
            const article = articles.find(a => a.id === articleId);
            if (!article) return;

            // 检查content是否为URL
            if (article.content && (article.content.startsWith('http://') || article.content.startsWith('https://'))) {
                // 直接跳转到URL
                window.open(article.content, '_blank');
            } else {
                // 显示模态框
                const contentHTML = article.content || article.summary;
                const modal = document.createElement('div');
                modal.className = 'article-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <button class="close-btn" onclick="closeArticleDetail()"><i class="fas fa-times"></i></button>
                        <div class="modal-header">
                            ${article.category ? `<span class="article-category">${article.category}</span>` : ''}
                            <h2>${article.title}</h2>
                        </div>
                        <div class="modal-body">
                            ${contentHTML}
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);
                document.body.style.overflow = 'hidden';
            }
        })
        .catch(error => {
            console.error('Error loading article detail:', error);
            alert('加载文章详情失败，请重试');
        });
}

// 关闭文章详细内容
function closeArticleDetail() {
    const modal = document.querySelector('.article-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// 搜索文章
function searchArticles() {
    const searchTerm = document.getElementById('articleSearch').value.toLowerCase().trim();
    const articlesList = document.querySelector('.articles-list');
    const pagination = document.querySelector('.pagination');
    
    if (!articlesList) return;

    fetch('/api/articles')
        .then(response => response.json())
        .then(articles => {
            // 根据搜索词过滤文章
            const filteredArticles = articles.filter(article => 
                article.title.toLowerCase().includes(searchTerm)
            );

            if (filteredArticles.length === 0) {
                articlesList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        没有找到匹配的文章
                    </div>
                `;
                if (pagination) pagination.style.display = 'none';
                return;
            }

            // 分页设置
            const pageSize = 5;
            const totalPages = Math.ceil(filteredArticles.length / pageSize);
            const startIndex = 0;
            const endIndex = startIndex + pageSize;
            const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

            // 生成文章列表
            let html = '';
            paginatedArticles.forEach(article => {
                html += `
                    <article class="article-list-item" data-id="${article.id}" onclick="showArticleDetail('${article.id}')">
                        <div class="article-content">
                            ${article.category ? `<span class="article-category">${article.category}</span>` : ''}
                            <h3 class="article-title">${article.title}</h3>
                            <p class="article-excerpt">${article.summary}</p>
                            <div class="article-date">${article.date || ''}</div>
                        </div>
                    </article>
                `;
            });

            articlesList.innerHTML = html;

            // 生成分页控件
            if (pagination) {
                let paginationHtml = `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(1)">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                `;

                for (let i = 1; i <= totalPages; i++) {
                    if (i === 1) {
                        paginationHtml += `
                            <a href="#" class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${i})">
                                ${i}
                            </a>
                        `;
                    } else {
                        paginationHtml += `
                            <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${i})">
                                ${i}
                            </a>
                        `;
                    }
                }

                paginationHtml += `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadArticlesListFromAPI(${totalPages})">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                `;

                pagination.innerHTML = paginationHtml;
                pagination.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Error searching articles:', error);
            articlesList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    搜索失败，请刷新页面重试
                </div>
            `;
            if (pagination) pagination.style.display = 'none';
        });
}

// 搜索视频
function searchVideos() {
    const searchTerm = document.getElementById('videoSearch').value.toLowerCase().trim();
    const videosList = document.querySelector('.videos-list');
    const pagination = document.querySelector('.pagination');
    
    if (!videosList) return;

    fetch('/api/videos')
        .then(response => response.json())
        .then(videos => {
            // 根据搜索词过滤视频
            const filteredVideos = videos.filter(video => 
                video.title.toLowerCase().includes(searchTerm)
            );

            if (filteredVideos.length === 0) {
                videosList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        没有找到匹配的视频
                    </div>
                `;
                if (pagination) pagination.style.display = 'none';
                return;
            }

            // 分页设置
            const pageSize = 5;
            const totalPages = Math.ceil(filteredVideos.length / pageSize);
            const startIndex = 0;
            const endIndex = startIndex + pageSize;
            const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

            // 生成视频列表
            let html = '';
            paginatedVideos.forEach(video => {
                const defaultImage = `https://picsum.photos/400/225?random=${video.id || Math.random()}`;
                html += `
                    <article class="article-list-item">
                        <div class="article-image" style="aspect-ratio: 16/9; position: relative; overflow: hidden;">
                            ${video.videoUrl ? `
                                <video class="video-player" poster="" controls style="width: 100%; height: 100%; object-fit: cover;">
                                    <source src="${video.videoUrl}" type="video/mp4">
                                    您的浏览器不支持视频播放
                                </video>
                            ` : `
                                <img src="${video.image || defaultImage}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">
                                <div class="video-play" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(102, 126, 234, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem;">
                                    <i class="fas fa-play"></i>
                                </div>
                            `}
                        </div>
                        <div class="article-content">
                            <h3 class="article-title">${video.title}</h3>
                            <p class="article-excerpt">${video.description}</p>
                            <div class="article-date">${video.date || ''}</div>
                        </div>
                    </article>
                `;
            });

            videosList.innerHTML = html;

            // 生成分页控件
            if (pagination) {
                let paginationHtml = `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(1)">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                `;

                for (let i = 1; i <= totalPages; i++) {
                    if (i === 1) {
                        paginationHtml += `
                            <a href="#" class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${i})")">
                                ${i}
                            </a>
                        `;
                    } else {
                        paginationHtml += `
                            <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${i})")">
                                ${i}
                            </a>
                        `;
                    }
                }

                paginationHtml += `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${totalPages})")">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                `;

                pagination.innerHTML = paginationHtml;
                pagination.style.display = 'flex';
            }

            // 添加视频播放控制，确保同时只播放一个视频
            addVideoPlaybackControl();
        })
        .catch(error => {
            console.error('Error searching videos:', error);
            videosList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    搜索失败，请刷新页面重试
                </div>
            `;
            if (pagination) pagination.style.display = 'none';
        });
}

// 分页加载视频列表
let currentVideoPage = 1;
const videosPerPage = 5; // 每页显示5个视频
let currentPlayingVideo = null; // 当前播放的视频

// 加载视频列表页面数据
function loadVideosListFromAPI(page = 1) {
    const videosList = document.querySelector('.videos-list');
    const pagination = document.querySelector('.pagination');
    if (!videosList) return;

    fetch('/api/videos')
        .then(response => response.json())
        .then(videos => {
            if (videos.length === 0) {
                videosList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        暂无视频
                    </div>
                `;
                if (pagination) pagination.style.display = 'none';
                return;
            }

            // 分页设置
            const totalPages = Math.ceil(videos.length / videosPerPage);
            const startIndex = (page - 1) * videosPerPage;
            const endIndex = startIndex + videosPerPage;
            const paginatedVideos = videos.slice(startIndex, endIndex);

            let html = '';
            paginatedVideos.forEach(video => {
                const defaultImage = `https://picsum.photos/400/225?random=${video.id || Math.random()}`;
                html += `
                    <article class="article-list-item">
                        <div class="article-image" style="aspect-ratio: 16/9; position: relative; overflow: hidden;">
                            ${video.videoUrl ? `
                                <video class="video-player" poster="" controls style="width: 100%; height: 100%; object-fit: cover;">
                                    <source src="${video.videoUrl}" type="video/mp4">
                                    您的浏览器不支持视频播放
                                </video>
                            ` : `
                                <img src="${video.image || defaultImage}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">
                                <div class="video-play" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(102, 126, 234, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem;">
                                    <i class="fas fa-play"></i>
                                </div>
                            `}
                        </div>
                        <div class="article-content">
                            <h3 class="article-title">${video.title}</h3>
                            <p class="article-excerpt">${video.description}</p>
                            <div class="article-date">${video.date || ''}</div>
                        </div>
                    </article>
                `;
            });

            videosList.innerHTML = html;

            // 生成分页控件
            if (pagination) {
                let paginationHtml = `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${page > 1 ? page - 1 : 1})">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                `;

                for (let i = 1; i <= totalPages; i++) {
                    if (i === page) {
                        paginationHtml += `
                            <a href="#" class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${i})">
                                ${i}
                            </a>
                        `;
                    } else {
                        paginationHtml += `
                            <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${i})">
                                ${i}
                            </a>
                        `;
                    }
                }

                paginationHtml += `
                    <a href="#" class="btn" style="padding: 0.5rem 1rem;" onclick="loadVideosListFromAPI(${page < totalPages ? page + 1 : totalPages})">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                `;

                pagination.innerHTML = paginationHtml;
                pagination.style.display = 'flex';
            }

            // 添加视频播放控制，确保同时只播放一个视频
            addVideoPlaybackControl();
        })
        .catch(error => {
            console.error('Error loading videos:', error);
            videosList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    加载失败，请刷新页面重试
                </div>
            `;
            if (pagination) pagination.style.display = 'none';
        });
}

// 添加视频播放控制，确保同时只播放一个视频
function addVideoPlaybackControl() {
    const videoPlayers = document.querySelectorAll('.video-player');
    videoPlayers.forEach(player => {
        player.addEventListener('play', function() {
            // 暂停其他所有视频
            videoPlayers.forEach(otherPlayer => {
                if (otherPlayer !== this) {
                    otherPlayer.pause();
                }
            });
            // 更新当前播放的视频
            currentPlayingVideo = this;
        });
    });
}

// 从 API 加载文章
function loadArticlesFromAPI() {
    const articlesContainer = document.getElementById('articlesContainer');
    if (!articlesContainer) return;

    fetch('/api/articles')
        .then(response => response.json())
        .then(articles => {
            if (articles.length === 0) {
                articlesContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        暂无文章
                    </div>
                `;
                return;
            }

            let html = '';
            articles.slice(0, 3).forEach(article => {
                html += `
                    <article class="article-card" data-id="${article.id}" onclick="showArticleDetail('${article.id}')">
                        <div class="article-content">
                            ${article.category ? `<span class="article-category">${article.category}</span>` : ''}
                            <h3 class="article-title">${article.title}</h3>
                            <p class="article-excerpt">${article.summary}</p>
                            <div class="article-date">${article.date || ''}</div>
                        </div>
                    </article>
                `;
            });

            articlesContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading articles:', error);
            articlesContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    加载失败，请刷新页面重试
                </div>
            `;
        });
}

// 从 API 加载视频
function loadVideosFromAPI() {
    const videosContainer = document.getElementById('videosContainer');
    if (!videosContainer) return;

    fetch('/api/videos')
        .then(response => response.json())
        .then(videos => {
            if (videos.length === 0) {
                videosContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <i class="fas fa-video" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        暂无视频
                    </div>
                `;
                return;
            }

            let html = '';
            videos.slice(0, 3).forEach(video => {
                const defaultImage = `https://picsum.photos/400/225?random=${video.id || Math.random()}`;
                html += `
                    <div class="video-card">
                        <div class="video-thumbnail">
                            ${video.videoUrl ? `
                                <video class="video-player" poster="" controls style="width: 100%; height: 100%; object-fit: cover;">
                                    <source src="${video.videoUrl}" type="video/mp4">
                                    您的浏览器不支持视频播放
                                </video>
                            ` : `
                                <img src="${video.image || defaultImage}" alt="${video.title}">
                                <div class="video-play">
                                    <i class="fas fa-play"></i>
                                </div>
                            `}
                        </div>
                        <div class="video-info">
                            <h3 class="video-title">${video.title}</h3>
                            <p class="video-desc">${video.description}</p>
                            <div class="article-date">${video.date || ''}</div>
                        </div>
                    </div>
                `;
            });

            videosContainer.innerHTML = html;
            
            // 更新统计数据
            const videoStat = document.querySelector('.stat-item .stat-label');
            if (videoStat && videoStat.textContent === '个视频') {
                const statNumber = videoStat.previousElementSibling;
                statNumber.setAttribute('data-target', videos.length);
                statNumber.textContent = '0';
            }

            // 添加视频播放控制，确保同时只播放一个视频
            addVideoPlaybackControl();
        })
        .catch(error => {
            console.error('Error loading videos:', error);
            videosContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    加载失败，请刷新页面重试
                </div>
            `;
        });
}

// 从 API 加载关于信息
function loadAboutFromAPI() {
    fetch('/api/about')
        .then(response => response.json())
        .then(aboutData => {
            // 更新关于页面
            const aboutContent = document.querySelector('.about-content');
            
            if (aboutContent) {
                // 更新姓名（替换标题）
                const aboutTitleElement = aboutContent.querySelector('h2');
                if (aboutTitleElement) {
                    aboutTitleElement.textContent = `你好，我是${aboutData.name}`;
                }
                
                // 更新个人描述（只替换前几个段落，保留联系方式部分）
                const paragraphs = aboutContent.querySelectorAll('p');
                if (paragraphs.length > 0) {
                    // 只清空前3个段落（个人描述部分）
                    for (let i = 0; i < 3 && i < paragraphs.length; i++) {
                        paragraphs[i].remove();
                    }
                    
                    // 创建新的描述段落
                    const descParagraph = document.createElement('p');
                    descParagraph.textContent = aboutData.description || '';
                    aboutContent.insertBefore(descParagraph, aboutContent.querySelector('h2').nextSibling);
                }
            }
            
            // 更新联系方式
            const contactSection = document.querySelector('.about-content h2:nth-of-type(4)');
            if (contactSection) {
                // 检查联系方式标题后面是否有容器元素
                let contactContainer = contactSection.nextElementSibling;
                
                // 如果没有容器元素，创建一个
                if (!contactContainer || contactContainer.tagName !== 'DIV') {
                    contactContainer = document.createElement('div');
                    contactContainer.className = 'contact-container';
                    contactSection.parentNode.insertBefore(contactContainer, contactSection.nextElementSibling);
                }
                
                // 清空容器
                contactContainer.innerHTML = '';
                
                // 添加联系方式
                if (aboutData.email) {
                    const emailP = document.createElement('p');
                    emailP.innerHTML = `<i class="fas fa-envelope" style="color: var(--primary-color); margin-right: 0.5rem;"></i> ${aboutData.email}`;
                    contactContainer.appendChild(emailP);
                }
                
                if (aboutData.phone) {
                    const phoneP = document.createElement('p');
                    phoneP.innerHTML = `<i class="fas fa-phone" style="color: var(--primary-color); margin-right: 0.5rem;"></i> ${aboutData.phone}`;
                    contactContainer.appendChild(phoneP);
                }
                
                if (aboutData.location) {
                    const locationP = document.createElement('p');
                    locationP.innerHTML = `<i class="fas fa-map-marker-alt" style="color: var(--primary-color); margin-right: 0.5rem;"></i> ${aboutData.location}`;
                    contactContainer.appendChild(locationP);
                }
            }

            // 更新工作经历
            const workTimeline = document.querySelector('.about-content h2:nth-of-type(2) + .timeline');
            if (workTimeline && aboutData.experiences) {
                let timelineHtml = '';
                aboutData.experiences.forEach(exp => {
                    timelineHtml += `
                        <div class="timeline-item">
                            <div class="timeline-date">${exp.period}</div>
                            <div class="timeline-title">${exp.title}</div>
                            <div class="timeline-desc">${exp.company}，${exp.description}</div>
                        </div>
                    `;
                });
                workTimeline.innerHTML = timelineHtml;
            }

            // 更新教育背景
            const educationTimeline = document.querySelector('.about-content h2:nth-of-type(3) + .timeline');
            if (educationTimeline && aboutData.educations) {
                let eduHtml = '';
                aboutData.educations.forEach(edu => {
                    eduHtml += `
                        <div class="timeline-item">
                            <div class="timeline-date">${edu.period}</div>
                            <div class="timeline-title">${edu.degree}</div>
                            <div class="timeline-desc">${edu.school}，${edu.description}</div>
                        </div>
                    `;
                });
                educationTimeline.innerHTML = eduHtml;
            }
        })
        .catch(error => {
            console.error('Error loading about data:', error);
        });
}
