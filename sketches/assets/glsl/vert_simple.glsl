#version 300 es

precision mediump float;

in vec4 position;
in vec2 texcoord;

out vec2 v_texCoord;
out vec4 v_position;

void main(){

    v_texCoord = texcoord;
    v_position = position;
   gl_Position = v_position;
}