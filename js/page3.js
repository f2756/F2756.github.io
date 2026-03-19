// 打字机效果
const textToType = "每一代人有每一代人的长征路。那些在雪山草地间回荡的呐喊，如今化作了时代向前的脉搏。站在新的起点，从宁静的校园到广阔的天地，去征服未知的险阻，去丈量世界的广阔，去书写属于我们的无悔青春。";
const typewriterEl = document.getElementById('typewriter-text');
let isTyping = false;

if (typewriterEl) {
    const typeObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isTyping) {
            isTyping = true;
            typewriterEl.innerHTML = '<span class="text-content"></span><span class="typewriter-cursor"></span>';
            const textSpan = typewriterEl.querySelector('.text-content');
            let i = 0;
            // 每 80 毫秒敲击一个字
            const typeInterval = setInterval(() => {
                textSpan.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                    clearInterval(typeInterval);
                }
            }, 80); 
        }
    }, { threshold: 0.5 });
    
    typeObserver.observe(document.getElementById('prologue-section'));
}

// 全屏 Canvas 星火留言
const sparkCanvas = document.getElementById('spark-canvas');
if (sparkCanvas) {
    const ctx = sparkCanvas.getContext('2d');
    let w, h;
    let sparks = [];

    // 画布尺寸自适应
    function resizeCanvas() {
        w = sparkCanvas.width = sparkCanvas.offsetWidth;
        h = sparkCanvas.height = sparkCanvas.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 每一个粒子的物理属性
    class Spark {
        constructor(x, y, text) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.vx = (Math.random() - 0.5) * 1.5; // 左右微风摇摆
            this.vy = -(Math.random() * 1.5 + 1);  // 冉冉升空的速度
            this.alpha = 1;                        // 透明度
            this.size = Math.random() * 2 + 2;     // 粒子大小
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx += (Math.random() - 0.5) * 0.1; // 增加风的随机性
            if (this.y < h * 0.3) { 
                this.alpha -= 0.005; // 升到高空后渐渐隐去
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);

            // 画外层红色光晕
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = '#D62828';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#D62828';
            ctx.fill();

            // 画内层金色核心
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();

            // 绘制用户的誓言
            if (this.text) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.font = 'bold 20px "Microsoft YaHei"';
                ctx.shadowBlur = 0; 
                ctx.fillText(this.text, this.x + 12, this.y + 7);
            }
            ctx.restore();
        }
    }


    for (let i = 0; i < 40; i++) {
        sparks.push(new Spark(Math.random() * w, Math.random() * h, ""));
    }

    // 每秒 60 帧重绘画面
    function animateSparks() {
        ctx.clearRect(0, 0, w, h);
        for (let i = sparks.length - 1; i >= 0; i--) {
            sparks[i].update();
            sparks[i].draw();

            // 生命周期回收
            if (sparks[i].alpha <= 0 || sparks[i].y < -20 || sparks[i].x < -50 || sparks[i].x > w + 50) {
                if(sparks[i].text !== "") {
                    recordMessageToWall(sparks[i].text);
                    
                    sparks.splice(i, 1); 
                } else {
                    // 环境星火在底部重生
                    sparks[i].y = h + 10;
                    sparks[i].x = Math.random() * w;
                    sparks[i].alpha = 1;
                    sparks[i].vy = -(Math.random() * 1 + 0.5);
                }
            }
        }
        requestAnimationFrame(animateSparks);
    }
    animateSparks();

    // 发送火种交互逻辑
    const sparkInput = document.getElementById('spark-input');
    const sparkSubmit = document.getElementById('spark-submit');

    function shootSpark() {
        const text = sparkInput.value.trim();
        if (text !== "") {
            // 从输入框上方正中央发射
            const startX = w / 2;
            const startY = h - 80;
            sparks.push(new Spark(startX, startY, text));
            sparkInput.value = ""; // 清空输入框
        }
    }

    sparkSubmit.addEventListener('click', shootSpark);
    sparkInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') shootSpark(); // 支持回车键发送
    });
}

const sparkWall = document.getElementById('spark-wall');
let blur_flag = false;
function recordMessageToWall(text) {
    if (!sparkWall) return;
    
    // 创建一个新的 div 标签
    const msgEl = document.createElement('div');
    msgEl.className = 'spark-message';
    msgEl.textContent = text;
    
    // 把它塞进留言墙里
    sparkWall.appendChild(msgEl);
    
    // 让留言墙自动滚到最底部，展示最新的一条
    sparkWall.scrollTop = sparkWall.scrollHeight;
    //条数够翻页时加虚化
    if(!blur_flag){
        let count = sparkWall.querySelectorAll('.spark-message').length;
        if(count>=7){
            sparkWall.classList.add('active-blur');
            blur_flag = true;
        }
    }
}

// 时间轴滚动雷达
const timelineItems = document.querySelectorAll('.timeline-item');
if (timelineItems.length > 0) {
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 当节点进入视口时，加上 active 类名触发从两侧滑入的动画
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.2 }); // 露出 20% 时触发

    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
}

// 页脚“回到顶部”按钮平滑滚动
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认的描点瞬间跳转
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // 丝滑滚回顶部
        });
    });
}