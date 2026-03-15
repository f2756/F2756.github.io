// 第二页脚本
// 监听页面滚动事件，更新星星位置
const star = document.getElementById('star-group')
const path = document.getElementById('route-path');
const pathLength = path ? path.getTotalLength() : 0;
if (star && path) {
    const startPoint = path.getPointAtLength(0);
    star.setAttribute('transform', `translate(${startPoint.x}, ${startPoint.y})`);
}
window.addEventListener('scroll', () => {
    if (!star || !path) return;
    const scrollTop = document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (maxScroll <= 0) return;
    let scrollProgress = scrollTop / maxScroll;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));
    const currentLength = scrollProgress * pathLength;
    const point = path.getPointAtLength(currentLength);
    star.setAttribute('transform', `translate(${point.x}, ${point.y})`);
})

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
        route_wrapper.style.opacity = '1';
        route_wrapper.style.visibility = 'visible';
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
        if (entry.intersectionRatio >= 0.35 && !videoActive) {
            // 进入：35%可见时展示视频
            videoActive = true;
            mainContent.classList.add('shifted');
            videoWrapper.classList.add('show');

            if(siduVideo) {
                siduVideo.muted = false;
                siduVideo.play();
                if (bg_music) bg_music.pause();
            }
        } else if (entry.intersectionRatio < 0.1 && videoActive) {
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
}, { root: null, threshold: [0, 0.1, 0.35] });

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