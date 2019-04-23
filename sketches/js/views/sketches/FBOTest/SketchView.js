import {BaseSketch} from '../../BaseSketch.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';

//see https://stackoverflow.com/questions/38402546/webgl-fade-drawing-buffer/38407507#38407507
var vs = `
attribute vec4 position;

uniform mat4 u_matrix;

void main() {
  gl_Position = u_matrix * position;
}
`;

var fs = `
precision mediump float;

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`;
var vsQuad = `
attribute vec4 position;
attribute vec2 texcoord;

varying vec2 v_texcoord;

void main() {
  gl_Position = position;
  v_texcoord = texcoord;
}
`;

var fsFade = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform float u_mixAmount;
uniform vec4 u_fadeColor;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  gl_FragColor = mix(color, u_fadeColor, u_mixAmount);
}
`;

var fsCopy = `
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;

export default class SketchView extends BaseSketch {

    constructor() {
        super('FBOTest');

        this.buffer = CanvasUtils.CreateBufferWebGL({type: 'webgl'});
        this.el.appendChild(this.buffer.canvas);
        this.buffer.resize(window.innerWidth, window.innerHeight)

        var gl = this.buffer.gl;

        this.programInfo = twgl.createProgramInfo(gl, [vs, fs]);
        this.fadeProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsFade]);
        this.copyProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsCopy]);

// Creates a -1 to +1 quad
        this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

// Creates an RGBA/UNSIGNED_BYTE texture and depth buffer framebuffer
        this.imgFbi = twgl.createFramebufferInfo(gl);

// Creates 2 RGBA texture + depth framebuffers
        this.fadeAttachments = [
            {format: gl.RGBA, min: gl.NEAREST, max: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE,},
            {format: gl.DEPTH_STENCIL},
        ];
        this.fb1 = twgl.createFramebufferInfo(gl, this.fadeAttachments);
        this.fb2 = twgl.createFramebufferInfo(gl, this.fadeAttachments);
    }

    draw(time) {
        super.draw(time);

        this.render();
    }

    render(time) {

        this.mixAmount = 0.05;

        var gl = this.buffer.gl;
        var m4 = twgl.m4;
        if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
            twgl.resizeFramebufferInfo(gl, this.fb1, this.fadeAttachments);
            twgl.resizeFramebufferInfo(gl, this.fb2, this.fadeAttachments);
        }

        // fade by copying from fb1 into fabeFbi2 using mixAmount.
        // fb2 will contain mix(fadeFb1, u_fadeColor, u_mixAmount)
        twgl.bindFramebufferInfo(gl, this.fb2);

        gl.useProgram(this.fadeProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, this.fadeProgramInfo, this.quadBufferInfo);
        twgl.setUniforms(this.fadeProgramInfo, {
            u_texture: this.fb1.attachments[0],
            u_mixAmount: this.mixAmount,
            u_fadeColor: [0, 0, 0, 0],
        });
        twgl.drawBufferInfo(gl, this.quadBufferInfo);

        // now draw new stuff to fadeFb2. Notice we don't clear!
        twgl.bindFramebufferInfo(gl, this.fb2);

        var x = this.rand(gl.canvas.width);
        var y = this.rand(gl.canvas.height);
        var rotation = this.rand(Math.PI);
        var scale = this.rand(10, 20);
        var color = [this.rand(1), this.rand(1), this.rand(1), 1];
        this.drawThing(gl, x, y, rotation, scale, color);


        // now copy fb2 to the canvas so we can see the result
        twgl.bindFramebufferInfo(gl, null);

        gl.useProgram(this.copyProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, this.copyProgramInfo, this.quadBufferInfo);
        twgl.setUniforms(this.copyProgramInfo, {
            u_texture: this.fb2.attachments[0],
        });
        twgl.drawBufferInfo(gl, this.quadBufferInfo);

        // swap the variables so we render to the opposite textures next time
        var temp = this.fb1;
        this.fb1 = this.fb2;
        this.fb2 = temp;
    }

    drawThing (gl, x, y, rotation, scale, color) {

        var m4 = twgl.m4;

        var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        matrix = m4.translate(matrix, [x, y, 0]);
        matrix = m4.rotateZ(matrix, rotation);
        matrix = m4.scale(matrix, [scale, scale, 1]);

        gl.useProgram(this.programInfo.program);
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.quadBufferInfo);
        twgl.setUniforms(this.programInfo, {
            u_matrix: matrix,
            u_color: color,
        });
        twgl.drawBufferInfo(gl, this.quadBufferInfo);
    }

    rand(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);

    }

}