precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform float u_mixAmount;
uniform vec4 u_fadeColor;

void main() {
    vec4 color = texture2D(u_texture, v_texcoord);
    gl_FragColor = mix(color, u_fadeColor, u_mixAmount);
}