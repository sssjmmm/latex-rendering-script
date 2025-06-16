// 4.10最新版全局渲染窗口
let renderWindow = null;
let debounceTimeout = null;
let lastLatexText = ''; // 记录上次渲染的内容，避免重复渲染
let autoRenderInterval = null; // 用于自动渲染的定时器

function createOrUpdateRenderWindow() {
    const textareaDivs = document.querySelectorAll('.textarea-outline.textareaContainer___bERey');
    if (!textareaDivs.length) {
        console.error('未找到任何 LaTeX 文本区域');
        return;
    }

    // 检查或创建渲染窗口
    if (!renderWindow || renderWindow.closed) {
        renderWindow = window.open('', '_blank');
        if (!renderWindow) {
            alert('无法打开新窗口，请检查浏览器设置');
            return;
        }

        renderWindow.document.write(`
            <html>
            <head>
                <title>LaTeX 实时渲染</title>
                <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    #latex-content { font-size: 16px; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div id="latex-content"></div>
                <script>
                    window.MathJax = {
                        tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] }
                    };
                    function updateContent(text) {
                        const contentDiv = document.getElementById('latex-content');
                        if (contentDiv.textContent !== text) {
                            contentDiv.textContent = text;
                            if (window.MathJax && window.MathJax.typesetPromise) {
                                window.MathJax.typesetPromise().catch(err => console.log('渲染失败: ', err));
                            } else {
                                requestAnimationFrame(() => {
                                    if (window.MathJax && window.MathJax.typeset) {
                                        window.MathJax.typeset();
                                    }
                                });
                            }
                        }
                    }
                </script>
            </body>
            </html>
        `);
        renderWindow.document.close();
    }

    // 绑定事件
    textareaDivs.forEach((div, index) => {
        const textarea = div.querySelector('textarea');
        if (textarea) {
            textarea.removeEventListener('input', debounceUpdateLatex);
            textarea.addEventListener('input', debounceUpdateLatex);

            // 初始渲染第一个 textarea
            if (index === 0 && renderWindow && !renderWindow.closed) {
                renderWindow.updateContent(textarea.value);
            }
        }
    });

    // 监听焦点变化
    document.removeEventListener('focusin', handleFocus);
    document.addEventListener('focusin', handleFocus);

    // 清理旧的定时器并启动新的自动渲染
    if (autoRenderInterval) clearInterval(autoRenderInterval);
    autoRenderInterval = setInterval(autoRenderLatex, 500); // 每500毫秒渲染一次
}

// 防抖更新函数（手动输入时仍然保留防抖）
function debounceUpdateLatex(event) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const latexText = event.target.value;
        if (renderWindow && !renderWindow.closed && latexText !== lastLatexText) {
            lastLatexText = latexText;
            requestAnimationFrame(() => {
                renderWindow.updateContent(latexText);
            });
        }
    }, 300); // 300ms 延迟
}

// 处理焦点切换
function handleFocus(event) {
    const focusedTextarea = event.target.closest('textarea');
    if (focusedTextarea && focusedTextarea.closest('.textarea-outline.textareaContainer___bERey')) {
        if (renderWindow && !renderWindow.closed) {
            const latexText = focusedTextarea.value;
            if (latexText !== lastLatexText) {
                lastLatexText = latexText;
                requestAnimationFrame(() => {
                    renderWindow.updateContent(latexText);
                });
            }
        }
    }
}

// 自动渲染函数（每半秒执行）
function autoRenderLatex() {
    const textareaDivs = document.querySelectorAll('.textarea-outline.textareaContainer___bERey');
    if (textareaDivs.length && renderWindow && !renderWindow.closed) {
        const activeTextarea = document.activeElement.closest('textarea') || textareaDivs[0].querySelector('textarea');
        if (activeTextarea) {
            const latexText = activeTextarea.value;
            if (latexText !== lastLatexText) {
                lastLatexText = latexText;
                requestAnimationFrame(() => {
                    renderWindow.updateContent(latexText);
                });
            }
        }
    }
}

// 初次运行
createOrUpdateRenderWindow();

// 监听 DOM 变化
const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            shouldUpdate = true;
            break;
        }
    }
    if (shouldUpdate) {
        createOrUpdateRenderWindow();
    }
});

const targetNode = document.querySelector('.textarea-outline.textareaContainer___bERey')?.parentElement || document.body;
observer.observe(targetNode, { childList: true, subtree: false });

// 清理函数（可选：在窗口关闭时清理定时器）
window.addEventListener('unload', () => {
    if (autoRenderInterval) clearInterval(autoRenderInterval);
    if (renderWindow && !renderWindow.closed) renderWindow.close();
});