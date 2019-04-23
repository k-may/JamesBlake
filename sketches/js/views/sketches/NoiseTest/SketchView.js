import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('NoiseTest');

        LoadingUtils.LoadShaders(['assets/glsl/vert_simple.glsl','assets/glsl/noise_frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL({alpha: false, premultipliedAlpha: false});
            this.el.appendChild(this.buffer.canvas);

            this.mousePos = {
                x: 0.5,
                y: 0.5
            };

            this.destMousePos = {
                x : 0.5,
                y : 0.5
            };

            this.programInfo = twgl.createProgramInfo(this.buffer.ctx, [src[0], src[1]]);

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
        super.draw(time);

        if(this.buffer)
            this.drawNoiseBuffer(time);
    }

    drawNoiseBuffer(time){

        var gl = this.buffer.ctx;

        twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
        this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

/*
        gl.enable(gl.BLEND);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
*/

        gl.useProgram(this.programInfo.program);
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
        twgl.setUniforms(this.programInfo, {
            u_time : time
        });
        twgl.drawBufferInfo(gl, this.bufferInfo);

    }

    onResize(w, h) {

        super.onResize(w, h);

        if (this.buffer)
            this.buffer.resize(w, h);
    }
}