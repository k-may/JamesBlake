#version 300 es
precision mediump float;

in vec2 uv;
out vec4 color;

uniform sampler2D video;

void main(){
    color = texture(video, uv);
}