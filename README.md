# Audio Visualizer
![image](https://github.com/user-attachments/assets/55ddff0f-8162-477b-961e-681a376e6c66)
A simple real-time audio visualization tool that creates dynamic visual representations of system audio output. Built with vanilla JavaScript using the Web Audio API and Canvas for smooth rendering.

## Features
- Real-time audio visualization 
- System audio capture
- Full screen mode
- Responsive design
- Gradient color animations

## How It Works
The visualizer captures system audio using the Web Audio API's `getDisplayMedia()` method. The audio data is analyzed in real-time using an `AnalyserNode`, which provides frequency data that is then rendered as animated bars on an HTML canvas element.

## Tech Stack
- HTML5
- CSS3
- JavaScript (ES6+)
- Web Audio API
- Canvas API

## Usage
1. Click "Start Visualizer"
2. Select the "Entire Screen" tab, click the entire screen option that appears
3. Make sure to enable "Share system audio" in the sharing dialog
4. Use the Fullscreen button to toggle fullscreen mode

## Setup
Clone the repo in visual studio and run the project.


