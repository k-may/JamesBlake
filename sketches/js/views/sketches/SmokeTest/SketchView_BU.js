import {BaseSketch} from '../../BaseSketch.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('SmokeTest');

        this.particles = [];

        LoadingUtils.LoadShaders(['assets/smoke_test/glsl/vert.glsl', 'assets/smoke_test/glsl/frag.glsl']).then(src => {

            this.buffer = CanvasUtils.CreateBufferWebGL();
            this.el.appendChild(this.buffer.canvas);

            this.createSmoke();

            this.onResize(window.innerWidth, window.innerHeight);
        });

    }

    createSmoke() {

        LoadingUtils.LoadShaders(['assets/smoke_test/glsl/vert.glsl', 'assets/smoke_test/glsl/smoke_frag.glsl']).then(src => {

            var smokeTexture = twgl.createTexture(this.buffer.ctx, {src: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png'});

            var m4 = twgl.m4;
            var program = twgl.createProgramInfo(this.buffer.ctx, src);
            // Shared values
            const lightWorldPosition = [1, 8, -10];
            const lightColor = [1, 1, 1, 1];
            const camera = m4.identity();
            const view = m4.identity();
            const viewProjection = m4.identity();

            const arrays = {
                position: [-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
                indices: [0, 1, 2, 2, 1, 3],
                texcoord: [0, 0, 0, 1, 1, 0, 1, 1]
            };
            var bufferInfo = twgl.createBufferInfoFromArrays(this.buffer.ctx, arrays);
            var rand = Math.random;

            this.particles.push({
                uniforms: {
                    diffuse: smokeTexture,
                    //  u_lightWorldPos: lightWorldPosition,
                    // u_lightColor: lightColor,
                    //  u_diffuseMult: chroma.hsv((baseHue + rand(0, 60)) % 360, 0.4, 0.8).gl(),
                    // u_specular: [1, 1, 1, 1],
                    // u_shininess: 50,
                    //  u_specularFactor: 1,
                    // u_diffuse: tex,
                    //  u_viewInverse: camera,
                    //   u_world: m4.identity(),
                    //  u_worldInverseTranspose: m4.identity(),
                    //  u_worldViewProjection: m4.identity(),
                },
                //  translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
                programInfo: program,
                bufferInfo: bufferInfo
            });
        });

    }

    draw(time) {

        if (this.buffer) {

            twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
            this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

            var gl = this.buffer.ctx;

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clearColor(0.1, 0.1, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var m4 = twgl.m4;
            var gl = this.buffer.ctx;
            /*// Shared values
            const camera = m4.identity();
            const view = m4.identity();
            const viewProjection = m4.identity();


            var radius = 10;
            var orbitSpeed = time * 0.01;
            var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
            var eye = [Math.cos(orbitSpeed) * radius, 4, Math.sin(orbitSpeed) * radius];
            var target = [0, 0, 0];
            var up = [0, 1, 0];

            m4.lookAt(eye, target, up, camera);
            m4.inverse(camera, view);
            m4.multiply(projection, view, viewProjection);
*/
            if (this.particles.length) {

            /*    this.particles.forEach(obj => {
                    const uni = obj.uniforms;
                    const world = uni.u_world;
                    m4.identity(world);
                    //    m4.rotateY(world, time * obj.ySpeed, world);
                    //   m4.rotateZ(world, time * obj.zSpeed, world);
                    // m4.translate(world, obj.translation, world);
                    //  m4.rotateX(world, time, world);
                    //  m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
                    //  m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

                });*/
                twgl.drawObjectList(this.buffer.ctx, this.particles);
            }

            super.draw(time);
        }

    }

    onResize(w, h) {

        super.onResize(w, h);

        if (this.buffer)
            this.buffer.resize(w, h);
    }
}