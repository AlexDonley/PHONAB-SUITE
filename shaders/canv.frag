precision mediump float;

varying vec2 vTexCoord;
uniform sampler2D tex;

// Effect Uniforms (0.0 means off / neutral)
uniform float uPixelate; // e.g., 0.0 to 100.0+
uniform float uFisheye;  // e.g., -2.0 to 2.0
uniform float uSwirl;    // e.g., -10.0 to 10.0
uniform float uAlpha;    // 1.0 = normal, 0.0 = fully transparent (Ghost effect)

void main() {
    vec2 uv = vTexCoord;

    // 1. PIXELATE EFFECT
    if (uPixelate > 1.0) {
        uv = floor(uv * uPixelate) / uPixelate;
    }

    // 2. SWIRL EFFECT
    if (uSwirl != 0.0) {
        vec2 p = uv - 0.5;
        float radius = length(p);
        if (radius < 0.5) {
            float percent = (0.5 - radius) / 0.5;
            float theta = percent * percent * uSwirl;
            float s = sin(theta);
            float c = cos(theta);
            p = vec2(dot(p, vec2(c, -s)), dot(p, vec2(s, c)));
            uv = p + 0.5;
        }
    }

    // 3. FISHEYE EFFECT
    if (uFisheye != 0.0) {
        vec2 p = uv - 0.5;
        float r = dot(p, p);
        uv = uv + p * (r * uFisheye);
    }

    // 4. BOUNDS CHECK (Prevents texture repeating at edges)
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent black outside bounds
    } else {
        vec4 color = texture2D(tex, uv);
        // Apply Ghost / Opacity effect
        color.a *= uAlpha;
        gl_FragColor = color;
    }
}