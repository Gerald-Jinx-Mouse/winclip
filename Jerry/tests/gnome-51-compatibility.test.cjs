// Exercise WinClip's real functions with native GI/compositor boundaries
// substituted: a Node test process cannot create GNOME Shell GPU/input devices.
// The GNOME 51 boundary deliberately has no Clutter.get_default_backend().
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourceDir = process.env.WINCLIP_TEST_SOURCE || path.resolve(__dirname, '../../src');

function loadModule(filename, bindings) {
    const source = fs.readFileSync(path.join(sourceDir, filename), 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace(/^export\s+/gm, '');
    const errors = [];
    const context = vm.createContext({
        console: {error: (...args) => errors.push(args), warn: (...args) => errors.push(args)},
        ...bindings,
    });
    vm.runInContext(source, context, {filename});
    return {context, errors};
}

test('image preview uploads pixel data using the stage-owned GNOME 51 Cogl context', () => {
    const coglContext = {};
    const pixels = new Uint8Array([10, 20, 30, 255]);
    const uploads = [];
    const content = {
        set_bytes: (...args) => {
            uploads.push(args);
            return args[0] === coglContext;
        },
    };
    const {context, errors} = loadModule('imageUtil.js', {
        Clutter: {},
        Cogl: {PixelFormat: {RGBA_8888: 1, RGB_888: 2}},
        GLib: {}, GdkPixbuf: {}, Gio: {},
        St: {ImageContent: {new_with_preferred_size: (width, height) => {
            assert.equal(width, 1);
            assert.equal(height, 1);
            return content;
        }}},
        global: {stage: {get_context: () => ({
            get_backend: () => ({get_cogl_context: () => coglContext}),
        })}},
    });
    const result = context.pixbufToContent({
        get_width: () => 1, get_height: () => 1,
        get_has_alpha: () => true, get_rowstride: () => 4,
        read_pixel_bytes: () => pixels,
    });
    assert.notEqual(result, null, 'GNOME 51 must produce a usable image preview');
    assert.equal(uploads.length, 1);
    assert.deepEqual(uploads[0], [coglContext, pixels, 1, 1, 1, 4]);
    assert.equal(errors.length, 0);
});

test('automatic paste obtains the GNOME 51 seat and emits one balanced Ctrl+V sequence', () => {
    let callback;
    let actualDelay;
    const events = [];
    const deviceTypes = [];
    const {context, errors} = loadModule('paste.js', {
        Clutter: {
            InputDeviceType: {KEYBOARD_DEVICE: 1},
            KEY_Control_L: 65507, KEY_v: 118,
            KeyState: {PRESSED: 1, RELEASED: 0},
        },
        GLib: {
            PRIORITY_DEFAULT: 0, SOURCE_REMOVE: false,
            get_monotonic_time: () => 12345,
            source_remove: () => {},
            timeout_add: (_priority, delay, action) => {
                actualDelay = delay;
                callback = action;
                return 7;
            },
        },
        global: {stage: {get_context: () => ({get_backend: () => ({
            get_default_seat: () => ({create_virtual_device: type => {
                deviceTypes.push(type);
                return {notify_keyval: (...args) => events.push(args)};
            }}),
        })})}},
    });
    assert.equal(context.sendPaste(90), 7);
    assert.equal(actualDelay, 90);
    assert.equal(callback(), false);
    assert.deepEqual(events, [
        [12345, 65507, 1], [12345, 118, 1],
        [12345, 118, 0], [12345, 65507, 0],
    ]);
    assert.deepEqual(deviceTypes, [1]);
    assert.equal(errors.length, 0);
    context.releaseDevice();
});
