(() => {
    let renderWindow = null;
    let lastLatexText = '';

    function openRenderWindow() {
        if (!renderWindow || renderWindow.closed) {
            renderWindow = window.open('', '_blank');
            if (!renderWindow) {
                alert('渲染窗口无法打开，请检查浏览器是否阻止了弹窗');
                return;
            }

            renderWindow.document.write(`
                <html>
                <head>
                    <title>LaTeX 渲染</title>
                    <script>
                        window.MathJax = {
                            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
                            svg: { fontCache: 'global' }
                        };
                    </script>
                    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
                    <style>
                        body { padding: 20px; font-family: sans-serif; }
                        #latex-content { white-space: pre-wrap; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <div id="latex-content">等待内容...</div>
                    <script>
                        function render(text) {
                            const contentDiv = document.getElementById('latex-content');
                            if (contentDiv.textContent !== text) {
                                contentDiv.textContent = text;
                                window.MathJax.typesetPromise().catch(err => console.error('MathJax 渲染错误:', err));
                            }
                        }
                        window.addEventListener('message', (e) => {
                            if (e.data?.type === 'update') {
                                render(e.data.text);
                            }
                        });
                    </script>
                </body>
                </html>
            `);
            renderWindow.document.close();
        }
    }

    function sendLatexToRenderWindow(rawLatex) {
        const latexText = rawLatex.trim(); // 不加 $ 包裹
        if (renderWindow && !renderWindow.closed && latexText !== lastLatexText) {
            lastLatexText = latexText;
            renderWindow.postMessage({ type: 'update', text: latexText }, '*');
        }
    }

    function bindInputs() {
        const textareas = document.querySelectorAll('textarea.n-input__textarea-el');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => {
                sendLatexToRenderWindow(textarea.value);
            });
        });
        const first = textareas[0];
        if (first) sendLatexToRenderWindow(first.value);
    }

    function bindFocusWatcher() {
        document.addEventListener('focusin', e => {
            const textarea = e.target.closest('textarea.n-input__textarea-el');
            if (textarea) {
                sendLatexToRenderWindow(textarea.value);
            }
        });
    }

    function init() {
        openRenderWindow();
        bindInputs();
        bindFocusWatcher();
        console.log('✅ LaTeX 实时渲染器已启用，输入内容将原样渲染，请自行使用 $ 包裹公式');
    }

    init();
})();
