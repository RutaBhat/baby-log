"""Generate simple PNG app icons (pink background, white circle, baby-bottle-ish shape) with no dependencies."""
import zlib, struct, sys

def png(size, path):
    bg = (247, 168, 189)
    white = (255, 255, 255)
    soft = (255, 214, 224)
    rows = []
    c = size / 2
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            dx, dy = x - c, y - c
            d = (dx * dx + dy * dy) ** 0.5
            px = bg
            if d < size * 0.36:
                px = white
                # inner heart-ish blob: a soft pink circle
                if (dx * dx + (dy - size * 0.02) ** 2) ** 0.5 < size * 0.2:
                    px = soft
            row += bytes(px)
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) \
        + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

for s in (180, 192, 512):
    png(s, f'icon-{s}.png')
print('ok')
