# WinClip — GNOME 51 clipboard repair

Date: October 10, 2026. Project branch: `custom`.

## Status

**Compatibility patch saved and tested; a new GNOME login is required for runtime verification.** Save your work, log out normally, log back in, then press **Super+V**. No automatic logout, reboot, or GNOME Shell restart was performed.

## Cause

The application previously providing clipboard history was **WinClip**, GNOME extension `winclip@stevebushwa.github.io`. This workstation now runs **GNOME Shell 51.0 on Wayland**, while the installed extension declared support only for Shell 50. GNOME therefore reported **Enabled: Yes / State: OUT OF DATE** and did not load it.

The shortcut was already correct: WinClip `toggle-overlay` is `['<Super>v']`; GNOME notifications use `['<Super>m']`. The older `clipboard-history@Diyar1877` remains disabled.

## Changes made

Only these three existing files were patched in both the checkout's `src/` and the installed extension:

| File | Change |
|---|---|
| `metadata.json` | Declare Shell 50 and 51 support |
| `imageUtil.js` | Get the Cogl context through the stage-owned Clutter backend |
| `paste.js` | Get the input seat through the stage-owned Clutter backend |

The replacement backend expression is `global.stage.get_context().get_backend()`, replacing `Clutter.get_default_backend()`, which GNOME 51 removed. Existing layout code already uses `Clutter.Orientation`; no layout rewrite was needed. See the [official GNOME 51 porting guide](https://gjs.guide/extensions/upgrading/gnome-shell-51.html).

**Checkout source:**

```text
/home/jerry/Projects/winclip/src/
```

**Installed extension:**

```text
/home/jerry/.local/share/gnome-shell/extensions/winclip@stevebushwa.github.io/
```

**Original code backups — source and installed copies, private directory:**

```text
/home/jerry/.local/share/winclip-repair-20261010-CsMpn5/
```

Clipboard history was not edited, cleared, or reset. The existing clipboard-index checksum remained unchanged during this repair; its contents were not printed. Retention preferences remain 100 entries and 200 MiB of image blobs. No global extension-version-validation bypass, package upgrade, conflicting-extension enablement, or installer download/execution was used. No Git commit or push was made.

## Checks performed

- Before patching, both new regression tests failed: image previews returned no usable content and automatic paste emitted no key sequence with the GNOME 51 backend interface.
- After patching, `node --test` passed both tests; running the same tests against the installed copy also passed.
- All checkout JavaScript files passed syntax checks; the GSettings schema passed strict dry-run validation.
- The replacement actor/context/backend methods were also verified on the installed GNOME 51 Clutter interfaces without creating graphics or input devices. The first standalone GJS probe could not locate Mutter's private shared libraries; setting the packaged library and typelib paths for that probe only resolved it. No persistent environment setting was changed.
- Metadata JSON parses correctly; source and installed copies both declare Shell 51.
- Native graphics/input interfaces are substituted in the Node tests. They test the real WinClip functions, but **do not replace testing the actual overlay and paste in GNOME**.
- The public extension D-Bus interface advertises `ReloadExtension`, but invoking it returned **Method ReloadExtension is not implemented**. The Shell-owned extension object exposed no alternative reload interface. The current session therefore still reports cached Shell-50 metadata and OUT OF DATE.
- The enabled/disabled extension lists and notification shortcut were preserved.

**Repeat the regression tests — no clipboard-content access:**

```bash
cd /home/jerry/Projects/winclip
```

```bash
node --test
```

## After logging back in

1. Press **Super+V**. Confirm the existing clipboard history appears.
2. Test pasting a harmless copied text into a blank editor, and an image preview if needed.
3. Check the extension state:

```bash
gnome-extensions info winclip@stevebushwa.github.io
```

Expected: **Enabled: Yes / State: ACTIVE**. If it reports ERROR, obtain the extension's error message before changing anything else; do not clear the clipboard database.

## Recovery and maintenance

Original versions of the three changed files are in the backup's `source/` and `installed/` subfolders. If this patch causes problems after login, disable only WinClip and restore only those exact code files after checking for later edits; do not overwrite unrelated files or the clipboard history directory.

The checkout's changes were committed and pushed on `custom` on October 30, 2026. Keep them when merging later upstream updates. Do not run the upstream installer over the customized extension; it currently still targets Shell 50 and could replace this repair.
