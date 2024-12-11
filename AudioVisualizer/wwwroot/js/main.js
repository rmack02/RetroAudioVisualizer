import { AudioVisualizer } from './AudioVisualizer.js';

const BUTTON_TEXT = {
    START: 'Start Visualizer',
    STOP: 'Stop Visualizer',
    FULLSCREEN: 'Fullscreen',
    EXIT_FULLSCREEN: 'Exit Fullscreen'
};

class App {
    #visualizer;
    #startButton;
    #fullscreenButton;
    #errorMessage;

    constructor() {
        this.#visualizer = new AudioVisualizer('visualizer');
        this.#startButton = document.getElementById('startButton');
        this.#fullscreenButton = document.getElementById('fullscreenButton');
        this.#errorMessage = document.getElementById('errorMessage');

        if (!this.#startButton || !this.#fullscreenButton || !this.#errorMessage) {
            throw new Error('Required DOM elements not found');
        }

        this.#initializeEventListeners();
    }

    #initializeEventListeners() {
        this.#startButton.addEventListener('click', () => this.#toggleVisualization());
        this.#fullscreenButton.addEventListener('click', () => this.#toggleFullscreen());

        const fullscreenEvents = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        fullscreenEvents.forEach(eventName => {
            document.addEventListener(eventName, () => this.#handleFullscreenChange());
        });
    }

    async #toggleVisualization() {
        try {
            if (this.#visualizer.isRunning()) {
                this.#visualizer.stop();
                this.#startButton.textContent = BUTTON_TEXT.START;
            } else {
                await this.#visualizer.start();
                this.#startButton.textContent = BUTTON_TEXT.STOP;
            }
        } catch (error) {
            this.#errorMessage.textContent = error.message;
            this.#startButton.textContent = BUTTON_TEXT.START;
        }
    }

    async #toggleFullscreen() {
        try {
            const elem = document.documentElement;
            const isFullscreen = document.fullscreenElement
                || document.webkitFullscreenElement
                || document.msFullscreenElement;

            if (!isFullscreen) {
                await this.#enterFullscreen(elem);
            } else {
                await this.#exitFullscreen();
            }
        } catch (error) {
            this.#errorMessage.textContent = `Fullscreen error: ${error.message}`;
        }
    }

    async #enterFullscreen(elem) {
        if (elem.requestFullscreen) {
            await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            await elem.msRequestFullscreen();
        }
        document.body.classList.add('fullscreen-mode');
        this.#fullscreenButton.textContent = BUTTON_TEXT.EXIT_FULLSCREEN;
    }

    async #exitFullscreen() {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
        }
        document.body.classList.remove('fullscreen-mode');
        this.#fullscreenButton.textContent = BUTTON_TEXT.FULLSCREEN;
    }

    #handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullscreenElement
            || document.msFullscreenElement;

        if (!isFullscreen) {
            document.body.classList.remove('fullscreen-mode');
            this.#fullscreenButton.textContent = BUTTON_TEXT.FULLSCREEN;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});