import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

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
        super('FulcrumBlurWebGL1');

        LoadingUtils.LoadShaders(['assets/blur_glsl/fulcrum_vert.glsl', 'assets/blur_glsl/fulcrum_frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL({type: 'webgl'});
            this.el.appendChild(this.buffer.canvas);

            this.buffer.resize(window.innerWidth, window.innerHeight);

            this.rotationY = 0;
            this.mousePos = {
                x: 0.5,
                y: 0.5
            };

            var gl = this.buffer.gl;

            this.programInfo = twgl.createProgramInfo(gl, src);
            this.fadeProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsFade]);
            this.copyProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsCopy]);

            this.quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

            this.fadeAttachments = [
                {format: gl.RGBA, min: gl.NEAREST, max: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE,},
                {format: gl.DEPTH_STENCIL},
            ];

            this.fb1 = twgl.createFramebufferInfo(this.buffer.gl, this.fadeAttachments);
            this.fb2 = twgl.createFramebufferInfo(this.buffer.gl, this.fadeAttachments);
            twgl.bindFramebufferInfo(gl, null);
            this.createPyramid(src);

            //this.onResize(window.innerWidth, window.innerHeight);
        }).catch(err => {
            console.warn(e.message);
        });
    }

    createPyramid(src) {
        var gl = this.buffer.gl;
        var arrays = {
            'position': [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0, 0, 0, -1],
            'indices': [
                0, 4, 1,
                1, 4, 3,
                3, 4, 2,
                2, 4, 0],
            'texcoord': [0, 0, 1, 0, 0, 1, 1, 1, 1, 1]
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.buffer.gl, arrays);

        this.uniforms = {
            u_worldViewProjection: twgl.m4.identity(),
            u_world: twgl.m4.identity(),
            u_time: 0
        };

        this.pyramid = {
            'programInfo': this.programInfo,
            'bufferInfo': this.bufferInfo,
            'uniforms': {
                u_worldViewProjection: twgl.m4.identity(),
                u_world: twgl.m4.identity(),
                u_time: 0
            }
        };
    }

    //----------------------------------------

    draw(time) {
        if (this.buffer) {
            this.render(time);
        }
    }


    render(time) {

        twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
        this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

        var gl = this.buffer.ctx;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.1, 0.1, 0.1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.drawPyramid(time);
    }

    drawPyramid(time) {

        var viewProjection = this.viewProjection();

        var gl = this.buffer.ctx;
        var m4 = twgl.m4;

        //projector bufferInfo
        var uni = this.pyramid.uniforms;
        var world = m4.identity();
        m4.identity(world);
        //  m4.translate(world, [0,0,0], world);
        m4.scale(world, [1, 1, 8], world);
        m4.multiply(viewProjection, world, uni.u_worldViewProjection);

        this.buffer.ctx.useProgram(this.pyramid.programInfo.program);
        twgl.setUniforms(this.pyramid.programInfo, {
            u_worldViewProjection: uni.u_worldViewProjection,
            u_world: world,
            u_time: time * 0.000005
        });
        twgl.setBuffersAndAttributes(gl, this.pyramid.programInfo, this.pyramid.bufferInfo);
        twgl.drawBufferInfo(gl, this.pyramid.bufferInfo);

    }

    drawThing(gl, x, y, rotation, scale, color) {

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

    viewProjection() {
        var gl = this.buffer.ctx;
        var m4 = twgl.m4;

        //convert between -1 and 1
        var rotation = this.mousePos.x * 2 - 1;
        this.rotationY += rotation;
        var xPos = Math.sin(this.rotationY * Math.PI / 180) * 20;
        var zPos = Math.cos(this.rotationY * Math.PI / 180) * 20;
        //eye above scene
        var eye = [xPos, -0.1, zPos];

        var target = [0, 0, -3];

        var top = [0, 1, 0];
        var world = m4.identity();
        var mvp = m4.identity();
        var camera = m4.identity();
        var view = m4.identity();
        var viewProjection = m4.identity();
        var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 1000);

        //look down..
        m4.lookAt(eye, target, top, camera);
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);
        m4.multiply(viewProjection, world, mvp);

        return viewProjection;
    }


    onResize(w, h) {
        super.onResize(w, h);

        if (this.buffer)
            this.buffer.resize(w, h);
    }

    onMouseMove(e) {
        super.onMouseMove(e);

        this.mousePos = {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
        };

    }

    rand(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);

    }
}