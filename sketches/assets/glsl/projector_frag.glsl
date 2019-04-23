#version 300 es
precision mediump float;

in vec2 v_texCoord;

out vec4 color;

uniform vec3 u_color;
uniform sampler2D video;
uniform float alpha;
uniform float u_time;
uniform sampler2D diffuse;

void main(){

    color = texture(diffuse, v_texCoord);
    color.a *= (sin(u_time) / 2.) + 1.;
    color.a *= 0.4;
    //color *= texture(diffuse, v_texCoord);

}