#version 300 es
precision mediump float;

in vec2 v_texCoord;
in vec2 v_videoTexCoord;
in float v_light;
out vec4 color;

uniform vec3 u_color;
uniform float alpha;

uniform sampler2D diffuse;
uniform sampler2D video;

float getEdge(vec2 uv){
    float edge = smoothstep(0., 0.1, uv.x) * smoothstep(1., 0.9, uv.x);
    edge *= smoothstep(0., 0.1, uv.y) * smoothstep(1., 0.9, uv.y);
    return edge;
}

void main(){

    color = texture(diffuse, v_texCoord);
    float e = getEdge(v_texCoord);
    color *= e;

    vec4 vidColor = texture(video, v_videoTexCoord);
    e = getEdge(v_videoTexCoord);
    vidColor *= e;

/*
    if(v_videoTexCoord.x < 0.0 || v_videoTexCoord.y < 0.0 || v_videoTexCoord.x > 1. || v_videoTexCoord.y > 1.)
    vidColor = vec4(1., 1.,1.,0.3);
*/

    color *= vidColor;
    //color.a *= edge;
    float gamma = 2.2;
    color.rgb = pow(color.rgb, vec3(1.0/gamma));

    color *= pow(v_light, 0.1);

  //  color = pow(color.rgb, 2.2);

    if(v_texCoord.x < 0.0)
        color.a = 0.;
    else {
        color.rgb *= u_color;
        //color.a *= alpha;
    }

}