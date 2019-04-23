#version 300 es
precision mediump float;

in vec2 v_texCoord;

out vec4 color;

uniform vec3 u_color;
uniform float alpha;
uniform sampler2D diffuse;

void main(){
    color = texture(diffuse, v_texCoord);

   /* if(v_texCoord.x < 0.0)
        color.a = 0.;
    else {
        color.rgb *= u_color;
        color.a *= alpha;
    }

    if(v_texCoord.x < 0.0 || v_texCoord.y < 0.0 || v_texCoord.x > 1. || v_texCoord.y > 1.)
        discard;*/
}