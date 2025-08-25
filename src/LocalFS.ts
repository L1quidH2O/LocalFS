import * as _path from "./path.js";

/** Since the current working directory is always absolute, this will always return an absolute path */
function resolvePath(cd: string[], path: string|string[]): string[] {
    return _path.resolve(cd, Array.isArray(path) ? path : _path.toArray(path));
}

/** path must be absolute and normalized */
function isChildOrEqual(cd: string[], path: string[]): boolean {
    const lParent = cd.length;
    if(path.length < lParent){ return false; }
    for(let i = 0; i < lParent; i++){
        if(path[i] !== cd[i]){ return false; }
    }
    return true;
}

/**
 * A simple [FileSystemDirectoryHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle) wrapper to easily navigate a local directory with POSIX paths,
 * as well as other functionality for convenience purposes.
 * 
 * All methods accept paths as both `string`, and `string[]` format (acquired through `path.toArray()`)
**/
export class LocalFS {
    rootHandle: FileSystemDirectoryHandle;
    current: {handle: FileSystemDirectoryHandle, path: string[]};
    
    /**
     * ```ts
     * // acquire a FileSystemDirectoryHandle
     * const handle = await window.showDirectoryPicker();
     * const fs = new LocalFS(handle);
     * ```
    **/
    constructor(dirHandle: FileSystemDirectoryHandle){
        this.rootHandle = dirHandle;
        this.current = {handle: this.rootHandle, path: [_path.ROOT_NAME]};
    }

    /**
     * Get a FileSystemDirectoryHandle
     * @param create If true, it will recursively create directories
    **/
    async getDir(path: string|string[], create: boolean = false): Promise<FileSystemDirectoryHandle> {
        const absolutePath = resolvePath(this.current.path, path);
        const isChild = isChildOrEqual(this.current.path, absolutePath);
        let dir = isChild ? this.current.handle : this.rootHandle;
        for(let i = isChild ? this.current.path.length : 1, l = absolutePath.length; i < l; i++){
            dir = await dir.getDirectoryHandle(absolutePath[i], {create: create})
        }

        return dir;
    }

    /**
     * Get a FileSystemFileHandle
    **/
    async getFile(path: string|string[], create: boolean = false): Promise<FileSystemFileHandle> {
        const absolutePath = resolvePath(this.current.path, path);

        const isChild = isChildOrEqual(this.current.path, absolutePath);
        let dir = isChild ? this.current.handle : this.rootHandle;
        for(let i = isChild ? this.current.path.length : 1, l = absolutePath.length; i < l-1; i++){
            dir = await dir.getDirectoryHandle(absolutePath[i], {create: create})
        }

        return await dir.getFileHandle(absolutePath.at(-1)!, { create });
    }

    /**
     * Resolves the absolute path of given path or FileSystemHandle
    **/
    async resolve(path: string|string[]|FileSystemHandle): Promise<string> {
        if(path instanceof FileSystemHandle){
            const resolved = await this.rootHandle.resolve(path);
            if(resolved === null){ throw new Error("Could not resolve path of FileSystemHandle. It might not be a child of this root directory."); }
            resolved.unshift(_path.ROOT_NAME);
            return _path.toString(resolved);
        }
        return _path.toString(resolvePath(this.current.path, path));
    }

    /**
     * Changes the current working directory
    **/
    async cd(path: string|string[]): Promise<FileSystemDirectoryHandle> {
        this.current.handle = await this.getDir(path);
        this.current.path = resolvePath(this.current.path, path);
        return this.current.handle;
    }

    /**
     * Returns the current working directory
    **/
    pwd(): string {
        return _path.toString(this.current.path)
    }

    /**
     * Lists all entries of the specified directory
     * 
     * ```ts
     * const fs = new LocalFS(handle);
     * const allFiles = await fs.ls("/");
     * const jsFiles = await fs.ls("/", (name, handle)=>name.endsWith(".js"));
     * const hasPermission = await fs.ls("/", async (name, handle)=>await handle.queryPermission() === "granted");
     * ```
     * @param filter a function to filter out entries, can be asynchronous
    **/
    async ls(path: string|string[]|FileSystemDirectoryHandle, filter?: (name: string, handle: FileSystemHandle)=>Promise<boolean>|boolean): Promise<[string, FileSystemHandle][]> {
        const dir = path instanceof FileSystemDirectoryHandle ? path : await this.getDir(path);
        const entries = await Array.fromAsync(dir.entries());

        if(filter){
            const e = await Promise.all(entries.map(([name, handle])=>filter(name, handle)));
            return entries.filter((_,i)=>e[i]);
        }

        return entries;
    }

    /**
     * Overwrites, writes, or appends content to a file.  
     * This method opens a write stream and immediately closes it after writing.  
     * For continuous or large-scale writing, consider writing a buffered writer for better performance.
     * 
     * ```ts
     * const fs = new LocalFS(handle);
     * 
     * // overwrite entire file
     * await fs.write("/file.txt", "Hello World!!!");
     * 
     * // append to end of file
     * await fs.write("/file.txt", " append this.", {append: true});
     * 
     * // refer to (https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write#parameters) for clarification
     * await fs.write("/file.txt", {
     *     type: "write",
     *     position: 6,
     *     data: "LocalFS"
     * }, {append: false, keepExistingData: true});
     * ```
     * 
     * @param content refer to [`FileSystemWriteChunkType` MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write#parameters) for clarification
     * @param options.append If true, the content will be appended to the end of the file
    **/
    async write(path: string|string[]|FileSystemFileHandle, content: FileSystemWriteChunkType, options?: {append?: boolean} & FileSystemCreateWritableOptions): Promise<void> {
        const fileHandle = path instanceof FileSystemFileHandle ? path : await this.getFile(path, true);

        if(options?.append) options.keepExistingData = true;

        const writable = await fileHandle.createWritable(options);
        try{
            if(options?.append) await writable.seek((await fileHandle.getFile()).size);
            await writable.write(content);
        }
        finally{
            await writable.close();
        }
    }

    /**
     * Copy file to destination.  
     * If a file already exists in its destination, it will be overwritten.
     * 
     * ```ts
     * const fs = new LocalFS(handle);
     * await fs.copyFile("/file.txt", "/folder/fileCopy.txt");
     * ```
    **/
    async copyFile(path: string|string[]|FileSystemFileHandle, destination: string|string[]|FileSystemFileHandle): Promise<void> {
        const file = path instanceof FileSystemFileHandle ? path : await this.getFile(path, false);
        const to = destination instanceof FileSystemFileHandle ? destination : await this.getFile(destination, true);

        if(await file.isSameEntry(to)){ return; }

        await copyFileHelper(file, to);
    }

    /**
     * Copy directory to destination.  
     * If a directory already exists in its destination, it will be merged and overwritten.
     * 
     * ```ts
     * const fs = new LocalFS(handle);
     * await fs.copyDir("/folder", "/path/to/folder");
     * ```
    **/
    async copyDir(path: string|string[]|FileSystemDirectoryHandle, destination: string|string[]|FileSystemDirectoryHandle): Promise<void> {
        const dir = path instanceof FileSystemDirectoryHandle ? path : await this.getDir(path, false);
        const to = destination instanceof FileSystemDirectoryHandle ? destination : await this.getDir(destination, true);

        if(await dir.isSameEntry(to)){ return; }

        await copyDirHelper(dir, to, to);
    }
}

async function copyFileHelper(file: FileSystemFileHandle, to: FileSystemFileHandle){
    const readStream = (await file.getFile()).stream();
    await readStream.pipeTo(await to.createWritable());
}

async function copyDirHelper(dir: FileSystemDirectoryHandle, to: FileSystemDirectoryHandle, originalTo: FileSystemDirectoryHandle){
    const promises = [];
    for(let entries = dir.entries(), entry; (entry = await entries.next()).done == false;){
        const [name, handle] = entry.value;
        if(handle instanceof FileSystemDirectoryHandle){
            promises.push(
                handle.isSameEntry(originalTo)
                .then(r=>{
                    if(r === false)
                        return to.getDirectoryHandle(name, {create: true})
                        .then(dir=>copyDirHelper(handle, dir, originalTo))
                })
            );
        }
        else if(handle instanceof FileSystemFileHandle){
            promises.push(
                to.getFileHandle(name, {create: true})
                .then(file=>copyFileHelper(handle, file))
            );
        }
    }
    await Promise.all(promises);
}