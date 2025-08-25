# 📂 LocalFS
_POSIX-style navigation for the File System Access API_

LocalFS is a small utility library that makes it easier to navigate directories using POSIX-style paths on top of the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API).

The API itself already provides rich high-level features for reading and writing files, so this library doesn't attempt to replace those. Instead, `LocalFS` focuses on simplifying directory navigation and path management.

With LocalFS, you can:
- 🌳 Treat your selected root directory as a filesystem.
- 📌 Move around with `cd`, inspect your location with `pwd`.
- 🧭 Resolve absolute and relative paths automatically.
- 📄 Access files and directories by path, without manually chaining handles.
- ⚡ Use a few extra convenience methods for common tasks.

```ts
import { LocalFS, path } from "localfs";

// acquire a FileSystemDirectoryHandle
const handle = await window.showDirectoryPicker();
const fs = new LocalFS(handle);

// Navigate like a filesystem
await fs.cd("/projects");

// List JS files in current directory
const jsFiles = await fs.ls(".", (name, handle) => name.endsWith(".js"));

// Grab a file handle by path
const file = await fs.getFile("/notes/todo.txt");

// Use the native API for reading/writing
const contents = await (await file.getFile()).text();
```

## Documentation
See https://L1quidH2O.github.io/LocalFS/docs to learn more.
