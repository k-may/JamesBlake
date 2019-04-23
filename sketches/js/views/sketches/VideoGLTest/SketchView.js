import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('VideoGLTest');

        this.particles = [];

        LoadingUtils.LoadShaders(['assets/smoke_test/glsl/vert.glsl', 'assets/smoke_test/glsl/frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL();
            this.el.appendChild(this.buffer.canvas);

            var playButton = document.createElement('button');
            playButton.style.width = '100px';
            playButton.style.height = '100px';
            playButton.style.position = 'absolute';
            playButton.style.top = '50%';
            playButton.style.left = '50%';

            this.el.appendChild(playButton);
            playButton.onclick = () => {
                this.video.play();
            };

            this.video = document.createElement('video');
            this.video.src = 'assets/Black and White 8mm Footage.mp4';
            this.video.autoplay = true;
            this.video.playsInline = true;
            this.video.volume = 0;
            this.video.addEventListener('playing', () => {
                this.copyVideo = true;
            }, true);

            this.program = twgl.createProgramInfo(this.buffer.ctx, src);
            this.texture = twgl.createTexture(this.buffer.ctx, {
                src: [0, 0, 255],
                format: this.buffer.ctx.RGB,
                min: this.buffer.ctx.LINEAR,
                wrap: this.buffer.ctx.CLAMP_TO_EDGE,
            });

            const arrays = {
                position: [-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
                indices: [0, 1, 2, 2, 1, 3],
                texcoord: [0, 0, 0, 1, 1, 0, 1, 1]
            };

            this.bufferInfo = twgl.createBufferInfoFromArrays(this.buffer.ctx, arrays);

            this.onResize(window.innerWidth, window.innerHeight);
        });

    }

    draw(time) {

        if (this.buffer) {

            twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
            this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

            var gl = this.buffer.ctx;

           // gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (this.copyVideo) {
                this.texture = twgl.createTexture(this.buffer.ctx, { src : this.video});/*
                gl.bindTexture(this.buffer.ctx.TEXTURE_2D, this.texture);
                gl.texImage2D(this.buffer.ctx.TEXTURE_2D, 1, this.buffer.ctx.RGB, this.buffer.ctx.RGB, this.buffer.ctx.UNSIGNED_BYTE, this.video);
*/            }

            this.buffer.ctx.useProgram(this.program.program);
            twgl.setUniforms({video : this.texture});
            twgl.setBuffersAndAttributes(this.buffer.ctx, this.program, this.bufferInfo);
            twgl.drawBufferInfo(this.buffer.ctx, this.bufferInfo);

            super.draw(time);
        }

    }

    onResize(w, h) {

        super.onResize(w, h);

        if (this.buffer)
            this.buffer.resize(w, h);
    }
}