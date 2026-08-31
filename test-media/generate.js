const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
fs.mkdirSync(dir, { recursive: true });

/**
 * Minimal JPEG: 2x2 red pixel.
 * SOI + APP0 + DQT + SOF0 + DHT + SOS + data + EOI
 */
function createJpeg() {
  const buf = Buffer.from([
    0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
    0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
    0x07,0x07,0x07,0x09,0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
    0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,0x24,0x2E,0x27,0x20,
    0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,
    0x39,0x3D,0x38,0x32,0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x02,
    0x00,0x02,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,0x01,0x05,0x01,0x01,
    0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
    0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
    0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,0x01,0x02,0x03,0x00,
    0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,
    0x81,0x91,0xA1,0x08,0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,
    0x82,0x09,0x0A,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,0x29,0x2A,0x34,0x35,
    0x36,0x37,0x38,0x39,0x3A,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x53,0x54,0x55,
    0x56,0x57,0x58,0x59,0x5A,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x73,0x74,0x75,
    0x76,0x77,0x78,0x79,0x7A,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x92,0x93,0x94,
    0x95,0x96,0x97,0x98,0x99,0x9A,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xB2,
    0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,
    0xCA,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,
    0xE7,0xE8,0xE9,0xEA,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFF,0xDA,
    0x00,0x08,0x01,0x01,0x00,0x00,0x3F,0x00,0x7B,0x40,0x1B,0xFF,0xD9
  ]);
  return buf;
}

/**
 * Minimal PDF with text "Test PDF".
 */
function createPdf() {
  const objects = [];
  let offset = 0;

  const header = '%PDF-1.4\n';
  offset = header.length;

  // Object 1: Catalog
  objects.push({ offset, content: '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' });
  offset += objects[objects.length - 1].content.length;

  // Object 2: Pages
  objects.push({ offset, content: '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' });
  offset += objects[objects.length - 1].content.length;

  // Object 3: Page
  objects.push({ offset, content: '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' });
  offset += objects[objects.length - 1].content.length;

  // Object 4: Content stream
  const stream = 'BT /F1 24 Tf 100 700 Td (Test PDF - E-Learning) Tj ET';
  objects.push({ offset, content: `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n` });
  offset += objects[objects.length - 1].content.length;

  // Object 5: Font
  objects.push({ offset, content: '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' });
  offset += objects[objects.length - 1].content.length;

  const xrefOffset = offset;
  let xref = 'xref\n0 6\n';
  xref += '0000000000 65535 f \n';
  for (const obj of objects) {
    xref += String(obj.offset).padStart(10, '0') + ' 00000 n \n';
  }

  const tail = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(header + objects.map(o => o.content).join('') + xref + tail);
}

/**
 * Minimal valid MP4 (ftyp + moov + mdat).
 * 1 frame, 1 second, black pixel, H.264-like structure.
 * Browsers will recognize the container even without real codec data.
 */
function createMp4() {
  function box(type, payload) {
    const size = 8 + payload.length;
    const header = Buffer.alloc(8);
    header.writeUInt32BE(size, 0);
    header.write(type, 4, 'ascii');
    return Buffer.concat([header, payload]);
  }

  function fullBox(type, version, flags, payload) {
    const header = Buffer.alloc(12);
    header.writeUInt32BE(12 + payload.length, 0);
    header.write(type, 4, 'ascii');
    header.writeUInt8(version, 8);
    header.writeUInt8((flags >> 16) & 0xFF, 9);
    header.writeUInt8((flags >> 8) & 0xFF, 10);
    header.writeUInt8(flags & 0xFF, 11);
    return Buffer.concat([header, payload]);
  }

  // ftyp
  const ftypPayload = Buffer.concat([
    Buffer.from('isom', 'ascii'),
    Buffer.from([0x00, 0x00, 0x00, 0x01]),
    Buffer.from('isomiso2mp41', 'ascii'),
  ]);
  const ftyp = box('ftyp', ftypPayload);

  // mvhd (version 0, 1 second = 1000 ticks, 1 fps)
  const mvhdPayload = Buffer.alloc(100);
  mvhdPayload.writeUInt32BE(0, 0);       // creation time
  mvhdPayload.writeUInt32BE(0, 4);       // modification time
  mvhdPayload.writeUInt32BE(1000, 8);    // timescale
  mvhdPayload.writeUInt32BE(1000, 12);   // duration (1 sec)
  mvhdPayload.writeUInt32BE(0x00010000, 16); // rate 1.0
  mvhdPayload.writeUInt16BE(0x0100, 20); // volume 1.0
  // matrix (identity) at offset 24..60
  mvhdPayload.writeUInt32BE(0x00010000, 24);
  mvhdPayload.writeUInt32BE(0x00010000, 44);
  mvhdPayload.writeUInt32BE(0x40000000, 64);
  mvhdPayload.writeUInt32BE(2, 80);      // next track ID
  const mvhd = box('mvhd', mvhdPayload);

  // tkhd
  const tkhdPayload = Buffer.alloc(92);
  tkhdPayload.writeUInt32BE(0, 0);       // creation time
  tkhdPayload.writeUInt32BE(0, 4);       // modification time
  tkhdPayload.writeUInt32BE(1, 8);       // track ID
  tkhdPayload.writeUInt32BE(0, 12);      // reserved
  tkhdPayload.writeUInt32BE(1000, 16);   // duration
  tkhdPayload.writeUInt32BE(0, 20);      // reserved
  tkhdPayload.writeUInt32BE(0, 24);      // reserved
  tkhdPayload.writeUInt16BE(0, 28);      // layer
  tkhdPayload.writeUInt16BE(0, 30);      // alternate group
  tkhdPayload.writeUInt16BE(0, 32);      // volume
  tkhdPayload.writeUInt16BE(0, 34);      // reserved
  // matrix at 36..72
  tkhdPayload.writeUInt32BE(0x00010000, 36);
  tkhdPayload.writeUInt32BE(0x00010000, 56);
  tkhdPayload.writeUInt32BE(0x40000000, 76);
  tkhdPayload.writeUInt32BE(2, 80);      // width (2 pixels)
  tkhdPayload.writeUInt32BE(2, 84);      // height (2 pixels)
  const tkhd = box('tkhd', tkhdPayload);

  // mdhd (version 0)
  const mdhdPayload = Buffer.alloc(20);
  mdhdPayload.writeUInt32BE(0, 0);       // creation time
  mdhdPayload.writeUInt32BE(0, 4);       // modification time
  mdhdPayload.writeUInt32BE(1000, 8);    // timescale
  mdhdPayload.writeUInt32BE(1000, 12);   // duration
  mdhdPayload.writeUInt32BE(0x55C40000, 16); // language + pre-defined
  const mdhd = box('mdhd', mdhdPayload);

  // hdlr
  const hdlrPayload = Buffer.concat([
    Buffer.alloc(4),                      // version + flags
    Buffer.from('vide', 'ascii'),         // handler type
    Buffer.alloc(12),                     // reserved
    Buffer.from('VideoHandler\0', 'ascii'),
  ]);
  const hdlr = box('hdlr', hdlrPayload);

  // vmhd
  const vmhdPayload = Buffer.concat([
    Buffer.alloc(8),                      // version + flags + graphicsmode
    Buffer.alloc(8),                      // opcolor
  ]);
  const vmhd = box('vmhd', vmhdPayload);

  // dref
  const drefPayload = Buffer.concat([
    Buffer.alloc(4),                      // version + flags
    Buffer.from('00000001', 'hex'),       // entry count
    Buffer.from('0000000C', 'hex'),       // entry size
    Buffer.from('url \x00\x00\x00\x01', 'ascii'), // self-contained flag
  ]);
  const dref = box('dref', drefPayload);

  // dinf
  const dinf = box('dinf', dref);

  // stsd (minimal avc1 entry)
  const avc1 = Buffer.concat([
    Buffer.alloc(6),                      // reserved
    Buffer.from([0x00, 0x01]),            // data reference index
    Buffer.alloc(16),                     // pre-defined + reserved
    Buffer.from([0x00, 0x02]),            // width
    Buffer.from([0x00, 0x02]),            // height
    Buffer.alloc(4),                      // horiz/vert resolution
    Buffer.alloc(4),                      // reserved
    Buffer.from([0x00, 0x01]),            // frame count
    Buffer.alloc(32),                     // compressor name
    Buffer.from([0x00, 0x18]),            // depth
    Buffer.from([0xFF, 0xFF]),            // pre-defined
  ]);
  const stsdPayload = Buffer.concat([
    Buffer.alloc(4),                      // version + flags
    Buffer.from('00000001', 'hex'),       // entry count
    box('avc1', avc1),
  ]);
  const stsd = box('stsd', stsdPayload);

  // stts (1 sample, duration 1000)
  const sttsPayload = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from('00000001', 'hex'),
    Buffer.from('00000001', 'hex'),       // sample count
    Buffer.from('000003E8', 'hex'),       // sample delta (1000)
  ]);
  const stts = box('stts', sttsPayload);

  // stsc (empty)
  const stscPayload = Buffer.concat([Buffer.alloc(4), Buffer.from('00000000', 'hex')]);
  const stsc = box('stsc', stscPayload);

  // stsz (1 sample, size 0)
  const stszPayload = Buffer.concat([
    Buffer.alloc(4),
    Buffer.from('00000000', 'hex'),
    Buffer.from('00000001', 'hex'),
    Buffer.from('00000000', 'hex'),
  ]);
  const stsz = box('stsz', stszPayload);

  // stco (empty)
  const stcoPayload = Buffer.concat([Buffer.alloc(4), Buffer.from('00000000', 'hex')]);
  const stco = box('stco', stcoPayload);

  const stbl = box('stbl', Buffer.concat([stsd, stts, stsc, stsz, stco]));
  const minf = box('minf', Buffer.concat([vmhd, dinf, stbl]));
  const mdia = box('mdia', Buffer.concat([mdhd, hdlr, minf]));
  const trak = box('trak', Buffer.concat([tkhd, mdia]));
  const moov = box('moov', Buffer.concat([mvhd, trak]));

  // mdat (empty — no actual frame data, but the container is valid)
  const mdat = box('mdat', Buffer.alloc(8));

  return Buffer.concat([ftyp, moov, mdat]);
}

// Generate files
const jpeg = createJpeg();
fs.writeFileSync(path.join(dir, 'test-image.jpg'), jpeg);
console.log(`test-image.jpg: ${jpeg.length} bytes`);

const pdf = createPdf();
fs.writeFileSync(path.join(dir, 'test-document.pdf'), pdf);
console.log(`test-document.pdf: ${pdf.length} bytes`);

const mp4 = createMp4();
fs.writeFileSync(path.join(dir, 'test-video-short.mp4'), mp4);
fs.writeFileSync(path.join(dir, 'test-video-long.mp4'), mp4);
console.log(`test-video-short.mp4: ${mp4.length} bytes`);
console.log(`test-video-long.mp4: ${mp4.length} bytes`);

const txt = Buffer.from('Ceci est un fichier texte de test pour la plateforme E-Learning.\nLigne 2: test.\nLigne 3: fin du test.\n');
fs.writeFileSync(path.join(dir, 'test-document.txt'), txt);
console.log(`test-document.txt: ${txt.length} bytes`);

console.log('All test media files created in', dir);
