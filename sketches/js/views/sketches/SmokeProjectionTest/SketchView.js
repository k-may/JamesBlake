import {BaseSketch} from '../../BaseSketch.js';
import {LoadingUtils} from '../../../utils/LoadingUtils.js';
import {CanvasUtils} from '../../../utils/CanvasUtils.js';

export default class SketchView extends BaseSketch {

    constructor() {
        super('SmokeProjectionTest');

        LoadingUtils.LoadShaders(['assets/glsl/vert.glsl','assets/glsl/projector_frag.glsl', 'assets/glsl/smoke_screen_vert.glsl', 'assets/glsl/smoke_screen_frag.glsl']).then(src => {

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
            this.screenProgInfo = twgl.createProgramInfo(this.buffer.ctx, [src[2], src[3]]);

            this.createVideo();
            this.createAudio();
            this.createPlayButton();
            this.createProjectorSource(src);
            //this.createProjectionScreen(src);
            this.createSmoke();
            this.onResize(window.innerWidth, window.innerHeight);

        });
    }

    createAudio(){

        this.audio = document.createElement("audio");
        this.audio.src = "assets/12. Lullaby for My Insomniac.mp3";
        this.audio.playsInline = true;
        this.audio.autoplay = true;
        this.audio.loop = true;
        this.audio.addEventListener("ended", () =>{
            this.audio.currentTime = 0;
        })

    }

    createVideo() {

        this.video = document.createElement('video');
        this.video.src = 'assets/Black and White 8mm Footage.mp4';
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.volume = 0;
        this.video.currentTime = 5;
        this.video.addEventListener('playing', () => {
            this.copyVideo = true;
            this.playButton.style.display = 'none';
        }, true);
        this.video.addEventListener('ended', () => {
            this.video.currentTime = 5;
            this.copyVideo = false;
            this.video.play();
        }, true);

    }

    createPlayButton() {
        var playButton = document.createElement('button');
        playButton.style.width = '100px';
        playButton.style.height = '100px';
        playButton.style.position = 'absolute';

        playButton.style.top = '50%';
        playButton.style.left = '50%';
        playButton.style.backgroundImage = 'url(assets/play_button.png)';
        playButton.style.backgroundSize = 'contain';
        playButton.style.backgroundColor = '#ffffff00';
        playButton.style.border = '0';

        this.el.appendChild(playButton);
        playButton.onclick = () => {
            this.video.play();
        };
        this.playButton = playButton;
    }

    createSmoke() {

        var smokeTexture = twgl.createTexture(this.buffer.ctx, {src: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png'});
        var gl = this.buffer.ctx;
        this.videoTexture = twgl.createTexture(gl, {
            src: [0, 0, 255],
            format: gl.RGB,
            min: gl.LINEAR,
            wrap: gl.CLAMP_TO_EDGE,
        });

        var numClouds = 80;
        var distance = 8;//180 / numClouds;

        var plane = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);
        this.particles = [];
        for(var i =0; i < numClouds; i ++) {

            var scale = Math.random() * 0.5 + 0.5;
            var translation = [(Math.random() * 2 - 1) * 2, (i / numClouds) * distance, (Math.random() * 2 - 1) *2];
            var rotationY  = Math.random() * Math.PI;

            this.particles.push({
                uniforms: {
                    alpha: 0.2,
                    diffuse: smokeTexture,
                    video : this.videoTexture,
                    u_worldViewProjection: twgl.m4.identity(),
                    u_world: twgl.m4.identity(),
                    u_scale: scale,
                    u_transform: translation,
                    u_color: [1, 1, 1],
                    u_rotation : rotationY
                },
                programInfo: this.screenProgInfo,
                bufferInfo: plane,
                scale : scale,
                rotationY : rotationY,
                rotationSpeed : Math.random()*0.001 + 0.0005,
                translation: translation
            });
        }

    }

    createProjectorSource(src) {

        var projectorSource = twgl.createTexture(this.buffer.ctx, {src: 'assets/glare.png'});

        var plane = twgl.primitives.createPlaneBufferInfo(this.buffer.ctx, 2, 2);
        this.projector = {
            programInfo: this.programInfo,
            bufferInfo: plane,
            uniforms: {
                alpha: 1,
                color : [1,1,1],
                diffuse: projectorSource,
                u_worldViewProjection: twgl.m4.identity(),
                u_world: twgl.m4.identity()
            },
            translation: [0, 90, 0]
        };
    }

    draw(time) {

        if (this.buffer) {
            this.drawScene(time);
            super.draw(time);
        }
    }

    drawScene(time) {

        twgl.resizeCanvasToDisplaySize(this.buffer.canvas);
        this.buffer.ctx.viewport(0, 0, this.buffer.width, this.buffer.height);

        var gl = this.buffer.ctx;
        gl.enable(gl.BLEND);
        // gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var m4 = twgl.m4;
        var gl = this.buffer.ctx;

        var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 1000);
        //eye above scene

        this.destMousePos.x += (this.mousePos.x - this.destMousePos.x)*0.1;
        this.destMousePos.y += (this.mousePos.y - this.destMousePos.y)*0.1;

        var eye = [this.destMousePos.x * -2 + 1, -2, this.destMousePos.y * 2 - 1];

        var target = [0, 40, 0];
        var left = [0, 0, -1];
        var world = m4.identity();
        var mvp = m4.identity();
        var camera = m4.identity();
        var view = m4.identity();
        var viewProjection = m4.identity();

        //look down..
        m4.lookAt(eye, target, left, camera);
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);
        m4.multiply(viewProjection, world, mvp);

        //projector bufferInfo
        var uni = this.projector.uniforms;
        var world = uni.u_world;
        m4.identity(world);
        m4.translate(world, this.projector.translation, world);
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

        if (this.copyVideo) {
            gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);
        }

        this.projector.uniforms.u_time = time;//this.videoTexture;

        this.particles.forEach(obj => {

            //projection bufferInfo
            uni = obj.uniforms;
            var world = uni.u_world;
            m4.identity(world);

            //todo move this to vert
            var scale = (this.projector.translation[1] - obj.translation[1]) / this.projector.translation[1];
            scale *= obj.scale;

            m4.scale(world, [scale, scale, scale], world);
            m4.translate(world, obj.translation, world);
            obj.rotationY += obj.rotationSpeed;
           // m4.rotateY(world, obj.rotationY, world);
            m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

            uni.video = this.videoTexture;
            uni.u_scale = obj.scale;
            uni.u_rotation = obj.rotationY;

            //  uni.u_projector = m4.getTranslation(this.projector.uniforms.u_world);
            //  uni.u_scale = obj.scale;
        });


        var arr = this.particles.concat([this.projector]);
        twgl.drawObjectList(this.buffer.ctx, arr);

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

}