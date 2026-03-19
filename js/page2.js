// 第二页脚本


//滑动条交互
const track = document.querySelector('.slider-track');
const handle = document.querySelector('.slider-handle');
const bg = document.querySelector('.slider-bg');
const text = document.querySelector('.slider-text');
const route_wrapper = document.querySelector('.route-wrapper');
const bg_music = document.getElementById('bg-music');
const follow_article = document.getElementById('follow-article')
//观察占位盒，防止视频进出时画面抖动
const siduGap = document.getElementById('sidu-gap'); 

let isDragging = false;
let startX = 0;
let maxSlide = 0;
let isUnlocked = false;
let isAuldioPrepared = false;

const AUDIO_START_OFFSET = 1.6; // 音频开头空白时间，单位秒

function initUnlocker(){
    if(!track || !handle || !bg || !text) return;
    maxSlide = track.offsetWidth - handle.offsetWidth - 6;// 6px是边距
}
window.addEventListener('resize', initUnlocker);
initUnlocker();
//拖动事件处理函数
function dragStart(e) {
    if (isUnlocked) return;
    if (bg_music) { 
        //准备音频播放，解决拖动滑块后音乐播放慢的问题
        if (!isAuldioPrepared) {
            bg_music.muted = true;
            bg_music.play().then(() => {
                bg_music.pause();
                bg_music.muted = false;
                bg_music.currentTime = AUDIO_START_OFFSET;
                isAuldioPrepared = true;
            }).catch((error) => {
                console.error('音频播放失败:', error);
            });
        }
    }
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    handle.style.transition = 'none';
    bg.style.transition = 'none';
}    
//拖动过程中更新滑块位置和背景宽度
function dragMove(e) {
    if (!isDragging || isUnlocked) return;
    if (e.cancelable) e.preventDefault();
    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let moveX = currentX - startX;
    if (moveX < 0) moveX = 0;
    if (moveX > maxSlide){
        moveX = maxSlide;
    }
    handle.style.left = (moveX + 3) + 'px'; 
    bg.style.width = (moveX + 25) + 'px';
    if (moveX >= maxSlide) {
        bg.style.width = '100%';
    }
}
//拖动结束后判断是否解锁成功
function dragEnd() {
    if (!isDragging || isUnlocked) return;
    isDragging = false;
    const currentLeft = parseInt(handle.style.left) || 3;
    if (currentLeft >= maxSlide) {
        //锁定滑动状态
        isUnlocked = true;
        track.classList.add('success');
        handle.style.left = (maxSlide + 3) + 'px';
        bg.style.width = '100%';
        //使路线按钮可见
        route_wrapper.classList.add('show');
        if (bg_music) {
            //播放背景音乐
            bg_music.volume = 1.0;
            bg_music.play().catch((error) => {
                console.error('拖动滑块后音频播放失败:', error);
            });
        }
        //展示后续内容
        follow_article.classList.add('show')

        setTimeout(() => {
            sectionObserver.observe(siduGap);
        }, 800);
    }else{
        handle.style.transition = 'left 0.3s ease';
        bg.style.transition = 'width 0.3s ease';
        handle.style.left = '3px';
        bg.style.width = '0px';
    }
}    
//添加事件监听
if(handle){
    //电脑端
    handle.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);
    //手机端
    handle.addEventListener('touchstart', dragStart, {passive: false});
    window.addEventListener('touchmove', dragMove, {passive: false});
    window.addEventListener('touchend', dragEnd);
}
//粘性滚动切换
const stickyContainer = document.getElementById('sidu-detail-section')
const scrollCards = document.querySelectorAll('.scroll-card')
const scrollImgs = document.querySelectorAll('.scroll-img')

const timePoints = document.querySelectorAll('.point')
const progressBar = document.getElementById('scroll-progress-bar')

window.addEventListener('scroll', () => {
    if(!stickyContainer) return;
    const rect = stickyContainer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    // 只有当盒子顶部顶到屏幕上边缘，且还没滑到底部时，才触发计算
    if (rect.top <= 0 && rect.bottom >= windowHeight) {
        // 计算在这个区域内，已经滚动的距离
        const scrolledDistance = Math.abs(rect.top);
        // 计算可以滚动的总距离 (盒子总高度减去一个屏幕的高度)
        const totalScrollable = rect.height - windowHeight;
        // 算出滚动进度比例 (0 到 1 之间)
        let progress = scrolledDistance / totalScrollable;
        // 根据进度算出当前该显示第几张卡片
        const totalCards = scrollCards.length;
        let currentIndex = Math.floor(progress * totalCards);
        // 防止最后一下滑过头导致数组越界
        if (currentIndex >= totalCards) {
            currentIndex = totalCards - 1;
        }
        //0% -> 33% -> 66% -> 100%
        let barPercentage = (currentIndex / (totalCards - 1)) * 100;
        if(progressBar) {
            progressBar.style.width = barPercentage + '%';
        }
        timePoints.forEach((point, index) => {
            if (index <= currentIndex) {
                point.classList.add('active');
            } else {
                point.classList.remove('active');
            }
        });
        // 更新激活的 CSS 类名
        scrollCards.forEach((card, index) => {
            if (index === currentIndex) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        scrollImgs.forEach((img, index) => {
            if (index === currentIndex) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
    }
});

//滑动到四渡赤水部分展示视频
const mainContent = document.querySelector('.main-content');
const videoWrapper = document.querySelector('.video-wrapper');

const siduVideo = document.getElementById('sidu-video');

let videoActive = false;
let isPlayingMusic = false;
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.intersectionRatio >= 0.5 && !videoActive) {
            // 进入：50%可见时展示视频
            videoActive = true;
            mainContent.classList.add('shifted');
            videoWrapper.classList.add('show');

            if(siduVideo) {
                siduVideo.muted = false;
                siduVideo.play();
                if (bg_music) bg_music.pause();
            }
        } else if (entry.intersectionRatio < 0.01 && videoActive) {
            // 退出：几乎完全离开视口才收起视频（滞回，防止布局重排导致抖动）
            videoActive = false;
            mainContent.classList.remove('shifted');
            videoWrapper.classList.remove('show');
            if (siduVideo) siduVideo.pause();
            //音乐迟入
            if (bg_music && !isPlayingMusic) {
                bg_music.play();
            }
        }
    });
}, { root: null, threshold: [0, 0.01, 0.5] });

// 金沙江数据滚动特效
const dataPanel = document.getElementById('qiaodu-data-panel');
const numberElements = document.querySelectorAll('.data-number');
let hasCounted = false;

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !hasCounted) {
            hasCounted = true;

            numberElements.forEach(el => {
                const target = parseInt(el.getAttribute('data-target'));
                const duration = 2000; //单位ms
                const frameRate = 30; //单位ms，每frameRate ms跳动一次
                const totalFrames = duration / frameRate
                let currentFrame = 0;

                const counter = setInterval(() => {
                    currentFrame++;
                    //简单地减速算法
                    const progress = currentFrame / totalFrames;
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    let currentVal = Math.round(target * easeOut);
                    //超过千位的数字加上逗号
                    el.innerText = currentVal.toLocaleString();
                    // 到达目标值，停止定时器
                    if (currentFrame >= totalFrames) {
                        el.innerText = target.toLocaleString();
                        clearInterval(counter);
                    }
                },frameRate);
            });
        }
    });
},{ threshold: 1 });//露出100％触发
if (dataPanel) {
    counterObserver.observe(dataPanel);
}
//画画
const rain_canvas = document.getElementById('rain-canvas');
const snow_canvas = document.getElementById('snow-canvas');
if (rain_canvas){
    const rain_ctx = rain_canvas.getContext('2d');
    let width = rain_canvas.width = window.innerWidth;
    let height = rain_canvas.height = window.innerHeight;

    //画雨
    let raindrops = [];
    // 1. 初始化暴雨（生成雨滴参数）
    function initRain() {

        raindrops = [];
        
        // 生成 300 滴雨（雨必须比雪密，才有暴雨感）
        for (let i = 0; i < 300; i++) {
            raindrops.push({
                x: Math.random() * width,        // 随机 X 坐标
                y: Math.random() * height,       // 随机 Y 坐标
                l: Math.random() * 20 + 15,      // 雨滴的长度 (15px 到 35px 之间，体现速度感)
                vx: Math.random() * 4 - 2,       // X轴的风速 (负数向左飘，正数向右飘)
                vy: Math.random() * 15 + 15      // Y轴的下坠速度 (15 到 30 之间，极快！)
            });
        }
    }
    // 2. 绘制雨滴（画线段）
    function drawRain() {
        rain_ctx.clearRect(0, 0, width, height); 
        
        // 暴雨的颜色：带有极低透明度的青白色，像冰冷的雨水
        rain_ctx.strokeStyle = 'rgba(176, 196, 222, 0.4)'; 
        rain_ctx.lineWidth = 1.5; // 雨丝的粗细
        rain_ctx.lineCap = 'round'; // 让雨滴两头圆润一点，更真实
        
        rain_ctx.beginPath();
        for (let i = 0; i < raindrops.length; i++) {
            let p = raindrops[i];
            
            // 画一条有倾斜角度的线段代表雨滴
            rain_ctx.moveTo(p.x, p.y); // 雨滴的起点
            rain_ctx.lineTo(p.x + p.vx, p.y + p.l); // 雨滴的终点（受风速和长度影响）
        }
        rain_ctx.stroke();
        
        moveRain(); 
        requestAnimationFrame(drawRain); 
        // 3. 物理引擎：极速下坠
        function moveRain() {
            for (let i = 0; i < raindrops.length; i++) {
                let p = raindrops[i];
                
                // 雨滴按设定的极快速度移动
                p.x += p.vx;
                p.y += p.vy;

                // 如果雨滴掉出了屏幕底部，就让它回到天上重新掉下来
                if (p.y > height) {
                    p.x = Math.random() * width;
                    p.y = -p.l; // 在屏幕上方一点点重新生成，防止突然闪现
                }
            }
        }
    }
    window.addEventListener('resize', initRain);
    initRain();
    drawRain();
}
if (snow_canvas){
    const snow_ctx = snow_canvas.getContext('2d');
    //画雪
    let flakes = []; // 装载所有雪花的数组

    // 1. 初始化画布尺寸和雪花群
    function initSnow() {
        // 画布尺寸自动贴合父盒子的大小
        width = snow_canvas.width = snow_canvas.offsetWidth;
        height = snow_canvas.height = snow_canvas.offsetHeight;
        flakes = [];
        
        // 生成 200 片雪花
        for (let i = 0; i < 200; i++) {
            flakes.push({
                x: Math.random() * width,             // 随机 X 坐标
                y: Math.random() * height,            // 随机 Y 坐标
                r: Math.random() * 3 + 1,             // 随机半径 (1px 到 4px 之间)
                d: Math.random() * 1 + 0.5,           // 随机下落重量/速度
                a: Math.random() * Math.PI * 2        // 随机左右摇摆的初始角度
            });
        }
    }

    // 2. 绘制每一帧画面
    function drawSnow() {
        snow_ctx.clearRect(0, 0, width, height); // 擦除上一帧
        snow_ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // 半透明的纯白雪花
        snow_ctx.beginPath();
        
        for (let i = 0; i < flakes.length; i++) {
            let f = flakes[i];
            snow_ctx.moveTo(f.x, f.y);
            // 画圆：x, y, 半径, 起始角, 结束角(一整圈)
            snow_ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true); 
        }
        snow_ctx.fill();
        
        moveSnow(); // 计算下一帧的位置
        requestAnimationFrame(drawSnow); // 浏览器自带的超级丝滑重绘引擎
    }

    // 3. 物理引擎：计算雪花的移动轨迹
    let angle = 0;
    function moveSnow() {
        angle += 0.01; // 风的微小变动
        for (let i = 0; i < flakes.length; i++) {
            let f = flakes[i];
            
            // Y轴下落 (越大的雪花掉得越快)
            f.y += Math.pow(f.d, 2) + 1; 
            // X轴随风左右飘摇 (用正弦函数模拟极其真实的自然摇摆)
            f.x += Math.sin(angle + f.a) * 2;

            // 如果雪花掉出了屏幕底部，就让它从顶部重新飘下来
            if (f.y > height) {
                flakes[i] = { x: Math.random() * width, y: 0, r: f.r, d: f.d, a: f.a };
            }
        }
    }
    window.addEventListener('resize', initSnow); // 窗口大小改变时重新计算
    initSnow();
    drawSnow();
}
let isCaodi = false;
//进入飞夺泸定桥，背景变化
const body = document.querySelector('body');
const feiduoArticle = document.getElementById('feiduo-section');
const xueshanArticle = document.getElementById('xueshan-section');
const caodiArticle = document.getElementById('caodi-section');
let darkVisibleCount = 0;
const darkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (!entry.target.isDarkVisible) {
                entry.target.isDarkVisible = true;
                darkVisibleCount++;
            }
        } else {
            if (entry.target.isDarkVisible) {
                entry.target.isDarkVisible = false;
                darkVisibleCount--;
            }
        }
    });
    if (darkVisibleCount > 0) {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
},{ threshold: 0.1 });
if (feiduoArticle) darkObserver.observe(feiduoArticle);
if (xueshanArticle) darkObserver.observe(xueshanArticle);
if (caodiArticle) darkObserver.observe(caodiArticle);



//泸定桥进度条
const speedProgress = document.getElementById('speed-progress');
const ludingSpeedSection = document.querySelector('.luding-speed-section');

if (speedProgress && ludingSpeedSection) {
    const speedObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 滚入视口，进度条瞬间冲刺到 100%
                speedProgress.style.width = '100%';
            } else {
                // 离开视口，把进度条抽干重置，方便下次看还能触发
                speedProgress.style.width = '0%'; 
            }
        });
    }, { threshold: 0.3 }); // 露出 30% 触发

    speedObserver.observe(ludingSpeedSection);
}

let isRainVisible = false;
let isSnowVisible = false;
let currentXuecaoIndex = 0; // 0=雪山, 1=草地
function updateWeather() {
    // 只要泸定桥在视口 -> 就下雨
    if (isRainVisible) {
        rain_canvas.classList.add('raining');
    } else {
        rain_canvas.classList.remove('raining');
    }

    // 只要雪山在视口 且 没到草地 -> 就下雪
    if (isSnowVisible && !isCaodi) {
        snow_canvas.classList.add('snowing');
    } else {
        snow_canvas.classList.remove('snowing');
    }
}


let rainObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        isRainVisible = entry.isIntersecting;
        updateWeather(); // 每次进出都呼叫控制中心检查一下
    });
}, { threshold: 0.2 });

if (feiduoArticle) {
    rainObserver.observe(feiduoArticle);
}

let snowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        isSnowVisible = entry.isIntersecting;
        updateWeather(); // 每次进出都呼叫控制中心检查一下
    });
}, { threshold: 0.2 });

if (xueshanArticle) {
    snowObserver.observe(xueshanArticle);
}


// let caodiObserver = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//         isCaodi = entry.isIntersecting;
//         updateWeather(); 
//     });
// }, { threshold: 0.2 });

// if (caodiArticle) {
//     caodiObserver.observe(caodiArticle);
// }

//雪山草地部分底部按钮
const xueshanCard = document.querySelector('.xueshan-card');
const caodiCard = document.querySelector('.caodi-card');
const leftBtn = document.querySelector('.left-btn');
const rightBtn = document.querySelector('.right-btn');
const navBalls = document.querySelectorAll('.nav-ball');


const xuecaoCards = [xueshanCard, caodiCard];

function showXuecaoCard(index) {
    xuecaoCards.forEach((card, i) => {
        if (i === index) {
            card.classList.add('show');
        } else {
            card.classList.remove('show');
        }
    });
    navBalls.forEach((ball, i) => {
        ball.classList.toggle('active', i === index);
    });
    currentXuecaoIndex = index;
}

// 初始化激活态
showXuecaoCard(0);

if (leftBtn) {
    leftBtn.addEventListener('click', () => {
        showXuecaoCard(Math.max(0, currentXuecaoIndex - 1));
        isCaodi = currentXuecaoIndex;
        updateWeather();
    });
}
if (rightBtn) {
    rightBtn.addEventListener('click', () => {
        showXuecaoCard(Math.min(xuecaoCards.length - 1, currentXuecaoIndex + 1));
        isCaodi = currentXuecaoIndex;
        updateWeather();
    });
}

//会宁会师
const huiningArticle = document.getElementById('huining-section');

if (huiningArticle) {
    const sunriseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 进入大结局板块，添加日出主题
                document.body.classList.add('sunrise-theme');
            } else {
                // 离开该板块，移除日出主题
                document.body.classList.remove('sunrise-theme');
            }
        });
    }, { threshold: 0.3 }); // 只要会师板块露出 15%，就立刻开始“天亮”

    sunriseObserver.observe(huiningArticle);
}

// 监听页面滚动事件，更新星星位置
const star = document.getElementById('star-group')
const path = document.getElementById('route-path');
const pathLength = path ? path.getTotalLength() : 0;
//初始化
if (star && path) {
    const startPoint = path.getPointAtLength(0);
    star.setAttribute('transform', `translate(${startPoint.x}, ${startPoint.y})`);
}


//获得所有章节标题标签
let chapters = [];
tags = document.getElementsByClassName('chapter-title');
function updatePositions(){
    for (let i=0;i<=tags.length;i++){
        chapters[i+1]={
            absoluteTop: document.documentElement.scrollHeight - document.documentElement.clientHeight
        }
        chapters[i]={
            element: tags[i],
            index: i,
            absoluteTop: tags[i].getBoundingClientRect().top + window.scrollY
        };
    }
}


//函数防抖
function debounce(func, delay) {
  let timer = null; // 用于保存定时器的标识

  return function (...args) {
    // 每次事件被触发时，先把之前的定时器清空
    if (timer !== null) {
      clearTimeout(timer);
    }

    // 设置一个新的定时器
    timer = setTimeout(() => {
      // 只有等待了 delay 毫秒且期间没有新的触发，才会执行 func
      func.apply(this, args);
    }, delay);
  };
}

//监测页面变形
const bodyObserver = new ResizeObserver(debounce(updatePositions, 500));
bodyObserver.observe(document.body);
window.addEventListener('resize',debounce(updatePositions, 500));

let range = [0, 562.2178, 836.9999, 1040.9999, 1137.0323, 1293.9756, pathLength]
let n = range.length;
function starPath(){
    if (!star || !path) return;
    const scrollTop = document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    console.log(maxScroll);
    //判断页面位置
    for(let i=0;i<n;i++){
        let l = chapters[i].absoluteTop;
        let r = chapters[i+1].absoluteTop;
        if(scrollTop>=l&&scrollTop<r){
            if(i<=3){
                let scrollProgress = (scrollTop-l)/(r-l);
                scrollProgress = Math.max(0, Math.min(1, scrollProgress));
                let length = scrollProgress*(range[i+1]-range[i]);
                currentLength = length + range[i]; 
                break
            }else if(i===4){
                if(isCaodi){
                    currentLength = 1293.9756;//红星移到草地
                }else{
                    currentLength = 1137.0323;//红星移到雪山
                }
                break;
            }else if(i===5){
                currentLength = pathLength;
                break;
            }
        }
    }
    const point = path.getPointAtLength(currentLength);
    star.setAttribute('transform', `translate(${point.x}, ${point.y})`);
}
window.addEventListener('scroll', starPath);
rightBtn.addEventListener('click', starPath);
leftBtn.addEventListener('click', starPath);

//到尾页隐藏路线图
const end_cite = document.getElementById('end-cite');
const endObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            route_wrapper.classList.remove('show');
        }else{
            route_wrapper.classList.add('show');
        }
    });
},{threshold : 0.7});
if (end_cite){
    endObserver.observe(end_cite);
}

//点击结尾按钮跳转