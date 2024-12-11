export class AudioVisualizer {
    #canvas;
    #ctx;
    #audioContext;
    #analyser;
    #dataArray;
    #source;
    #animationId;
    #isInitialized;
    #stream;

    static #CONSTANTS = {
        FFT_SIZE: 512,
        CANVAS_WIDTH_RATIO: 0.9,
        CANVAS_HEIGHT_RATIO: 0.7,
        BAR_WIDTH_RATIO: 0.8,
        MAX_HEIGHT_RATIO: 0.8,
        FADE_ALPHA: 0.2,
        LINE_ALPHA: 0.3,
        LINE_COUNT: 5,
        LINE_HEIGHT: 2,
        GRADIENT_COLORS: {
            START: '#ff00ff',
            END: '#00ffff'
        }
    };

    static #ERRORS = {
        AUDIO_TRACK: 'No audio track available. Please ensure you selected "Share system audio"',
        BROWSER_SUPPORT: 'Your browser does not support the required audio features',
        INITIALIZATION: 'Failed to initialize audio context'
    };

    constructor(canvasId) {
        this.#canvas = document.getElementById(canvasId);
        if (!this.#canvas) {
            throw new Error('Canvas element not found');
        }

        this.#ctx = this.#canvas.getContext('2d');
        this.#isInitialized = false;

        this.#initializeCanvas();
        this.#setupEventListeners();
    }

    #initializeCanvas() {
        const { CANVAS_WIDTH_RATIO, CANVAS_HEIGHT_RATIO } = AudioVisualizer.#CONSTANTS;
        this.#setCanvasSize(
            window.innerWidth * CANVAS_WIDTH_RATIO,
            window.innerHeight * CANVAS_HEIGHT_RATIO
        );
    }

    #setCanvasSize(width, height) {
        this.#canvas.width = width;
        this.#canvas.height = height;
    }

    #setupEventListeners() {
        const debouncedResize = this.#debounce(() => this.#handleResize(), 250);
        window.addEventListener('resize', debouncedResize);
    }

    #debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    #handleResize() {
        const { CANVAS_WIDTH_RATIO, CANVAS_HEIGHT_RATIO } = AudioVisualizer.#CONSTANTS;
        this.#setCanvasSize(
            window.innerWidth * CANVAS_WIDTH_RATIO,
            window.innerHeight * CANVAS_HEIGHT_RATIO
        );
    }

    async start() {
        try {
            if (!this.#isInitialized) {
                await this.#initialize();
            }
            return true;
        } catch (error) {
            throw new Error(`Failed to start visualizer: ${error.message}`);
        }
    }

    async #initialize() {
        try {
            await this.#initializeAudioContext();
            await this.#initializeMediaStream();
            await this.#setupAudioNodes();
            this.#isInitialized = true;
            this.#draw();
            return true;
        } catch (error) {
            this.stop();
            throw error;
        }
    }

    async #initializeAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            throw new Error(AudioVisualizer.#ERRORS.BROWSER_SUPPORT);
        }
        this.#audioContext = new AudioContext();
    }

    async #initializeMediaStream() {
        this.#stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        const audioTrack = this.#stream.getAudioTracks()[0];
        if (!audioTrack) {
            throw new Error(AudioVisualizer.#ERRORS.AUDIO_TRACK);
        }
    }

    async #setupAudioNodes() {
        const { FFT_SIZE } = AudioVisualizer.#CONSTANTS;

        this.#analyser = this.#audioContext.createAnalyser();
        this.#analyser.fftSize = FFT_SIZE;
        this.#dataArray = new Uint8Array(this.#analyser.frequencyBinCount);

        this.#source = this.#audioContext.createMediaStreamSource(this.#stream);
        this.#source.connect(this.#analyser);
    }

    #draw = () => {
        if (!this.#isInitialized) return;

        this.#animationId = requestAnimationFrame(this.#draw);
        this.#analyser.getByteFrequencyData(this.#dataArray);

        this.#clearCanvas();
        this.#drawBars();
    }

    #clearCanvas() {
        const { FADE_ALPHA } = AudioVisualizer.#CONSTANTS;
        this.#ctx.fillStyle = `rgba(0, 0, 0, ${FADE_ALPHA})`;
        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    }

    #drawBars() {
        const { BAR_WIDTH_RATIO } = AudioVisualizer.#CONSTANTS;
        const barCount = this.#dataArray.length;
        const barWidth = (this.#canvas.width / barCount) * BAR_WIDTH_RATIO;
        const barSpacing = this.#canvas.width / barCount - barWidth;
        const totalWidth = (barWidth + barSpacing) * barCount;
        const startX = (this.#canvas.width - totalWidth) / 2;

        for (let i = 0; i < barCount; i++) {
            const x = startX + i * (barWidth + barSpacing);
            const height = this.#calculateBarHeight(i);
            this.#drawBar(x, height, barWidth);
        }
    }

    #calculateBarHeight(index) {
        const { MAX_HEIGHT_RATIO } = AudioVisualizer.#CONSTANTS;
        return (this.#dataArray[index] / 255) * this.#canvas.height * MAX_HEIGHT_RATIO;
    }

    #drawBar(x, height, width) {
        this.#drawBarGradient(x, height, width);
        this.#drawBarLines(x, height, width);
    }

    #drawBarGradient(x, height, width) {
        const { GRADIENT_COLORS } = AudioVisualizer.#CONSTANTS;
        const gradient = this.#ctx.createLinearGradient(
            0,
            this.#canvas.height - height,
            0,
            this.#canvas.height
        );

        gradient.addColorStop(0, GRADIENT_COLORS.START);
        gradient.addColorStop(1, GRADIENT_COLORS.END);

        this.#ctx.fillStyle = gradient;
        this.#ctx.fillRect(
            x,
            this.#canvas.height - height,
            width,
            height
        );
    }

    #drawBarLines(x, height, width) {
        const { LINE_COUNT, LINE_ALPHA, LINE_HEIGHT } = AudioVisualizer.#CONSTANTS;
        const lineSpacing = height / LINE_COUNT;

        this.#ctx.fillStyle = `rgba(0, 0, 0, ${LINE_ALPHA})`;
        for (let j = 0; j < LINE_COUNT; j++) {
            this.#ctx.fillRect(
                x,
                this.#canvas.height - height + (j * lineSpacing),
                width,
                LINE_HEIGHT
            );
        }
    }

    stop() {
        if (this.#animationId) {
            cancelAnimationFrame(this.#animationId);
            this.#animationId = null;
        }

        this.#cleanupAudioContext();
        this.#cleanupStream();
        this.#isInitialized = false;
    }

    #cleanupAudioContext() {
        if (this.#source) {
            this.#source.disconnect();
            this.#source = null;
        }

        if (this.#audioContext?.state !== 'closed') {
            this.#audioContext?.close();
        }
        this.#audioContext = null;
        this.#analyser = null;
    }

    #cleanupStream() {
        if (this.#stream) {
            this.#stream.getTracks().forEach(track => track.stop());
            this.#stream = null;
        }
    }

    isRunning() {
        return this.#isInitialized;
    }
}