precision mediump float;

#define PI 3.14159265359

varying vec2 vTexCoord;
uniform sampler2D tex;

// Effect Uniforms (0.0 means off / neutral)
uniform float uPixelate; // e.g., 0.0 to 100.0+
uniform float uFisheye;  // e.g., -2.0 to 2.0
uniform float uSwirl;    // e.g., -10.0 to 10.0
uniform float uWave;     // e.g., 
uniform float uTunnel;   // e.g., 
vec2 tunnel_anchor = vec2(0.5, 0.5);

uniform float uMirror;   // e.g., 
vec2 mirror_anchor = vec2(0.5, 0.5);

uniform float uAlpha;    // 1.0 = normal, 0.0 = fully transparent (Ghost effect)


vec2 mirror_point(vec2 point, float mir_angle) {
    // Normalize the line direction vector to ensure accurate normal calculations
    vec2 line_dir = vec2(cos(mir_angle), sin(mir_angle));
    
    // Find the normal vector perpendicular to the line direction (rotated 90 degrees)
    vec2 normal = vec2(-line_dir.y, line_dir.x);
    
    // Vector from the anchor point to the point being mirrored
    vec2 v = point - mirror_anchor;
    
    // Reflect the point across the line: p' = p - 2 * (v . normal) * normal
    return point - 2.0 * dot(v, normal) * normal;
}

vec2 get_point_at_polar(float angle, float distance, vec2 center) {
    return center + vec2(cos(angle), sin(angle)) * distance;
}

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

    // 4. WAVE EFFECT
    if (uWave != 0.0) {
        // 1. Generate the raw wave (-1.0 to 1.0) and animate it with TIME
        float wave = cos((uv.x * PI * 10.0) + (uWave * 5.0));
        
        vec2 shifted_uv = uv;
        shifted_uv.x += wave * 0.03;
        
        uv = shifted_uv;
    }

    // 5. Tunnel Effect
    if (uTunnel != 0.0) {
        float dist_to_cent = distance(uv, tunnel_anchor);
        float rad = uTunnel / 2.0;
        
        if (dist_to_cent > rad) {
            // Calculate the direction vector from the center to the distant point
            vec2 dir = uv - tunnel_anchor;
            float angle_rad = atan(dir.y, dir.x);
            
            // Trace the line along that angle from the center point to the length of one rad
            vec2 traced_coord = get_point_at_polar(angle_rad, rad, tunnel_anchor);
            
            // Assign the color of the circumference point to the frag coord
            uv = traced_coord;
        }
    }

    // 6. Mirror Effect
    if (uMirror != 0.0) {
        vec2 dir = uv - mirror_anchor;
        float angle_uv = atan(dir.y, dir.x);
        
        float mod_angle = mod(uMirror, 2.0 * PI);
        
        if (
            (angle_uv > mod_angle && angle_uv < PI + mod_angle) || 
            (angle_uv < -PI + mod_angle)
        ) {
            uv = mirror_point(uv, uMirror);
        }
    }



    // F. BOUNDS CHECK (Prevents texture repeating at edges)
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent black outside bounds
    } else {
        vec4 color = texture2D(tex, uv);
        // Apply Ghost / Opacity effect
        color.a *= uAlpha;
        gl_FragColor = color;
    }
}