# Jerry's customizations

This folder holds my own additions to WinClip. Keeping them here, instead of
scattered through the project, means the original owner's updates almost never
collide with my changes.

## How this repo is set up

| Remote     | Points to                                   | Used for                       |
|------------|---------------------------------------------|--------------------------------|
| `origin`   | `Gerald-Jinx-Mouse/winclip` (my fork)       | pushing and pulling my work    |
| `upstream` | `stevebushwa/winclip` (the original)        | fetching the owner's updates   |

Pushing to `upstream` is disabled on purpose, so I can't push to the owner's
repo by accident.

| Branch   | What it is                                                      |
|----------|-----------------------------------------------------------------|
| `main`   | An untouched copy of the owner's code. Tracks `upstream/main`.  |
| `custom` | My work: the owner's code plus my changes. Tracks `origin/custom`. |

Do my work on `custom`. Leave `main` alone.

## Everyday work

```bash
git switch custom
# edit, then:
git add -A
git commit -m "Describe the change"
git push
```

## Getting the owner's latest updates

```bash
git switch custom
git fetch upstream && git merge --no-edit upstream/main && git push
```

If git reports a merge conflict, the owner and I changed the same lines. Fix
the marked files, then `git add` them and `git commit`.

## Making changes show up in GNOME

GNOME runs an installed copy of the extension, not the files in this folder.
After editing or merging updates:

```bash
make install
```

Then log out and back in.

Don't use `install-winclip.sh`: it downloads the owner's latest release and
would replace my customized version.

## Note on what can live here

New files (notes, scripts, assets) belong in this folder. Changes to how the
extension itself behaves still have to be made in `src/`, since that is what
`make install` packages. Keep those edits small to make merges easy.
