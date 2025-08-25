/**
 * A simple [FileSystemDirectoryHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle) wrapper to easily navigate a local directory with POSIX paths,
 * as well as other functionality for convenience purposes.
 *
 * All methods accept paths as both `string`, and `string[]` format (acquired through `path.toArray()`)
**/
export declare class LocalFS {
    rootHandle: FileSystemDirectoryHandle;
    current: {
        handle: FileSystemDirectoryHandle;
        path: string[];
    };
    /**
     * ```ts
     * // acquire a FileSystemDirectoryHandle
     * const handle = await window.showDirectoryPicker();
     * const fs = new LocalFS(handle);
     * ```
    **/
    constructor(dirHandle: FileSystemDirectoryHandle);
    /**
     * Get a FileSystemDirectoryHandle
     * @param create If true, it will recursively create directories
    **/
    getDir(path: string | string[], create?: boolean): Promise<FileSystemDirectoryHandle>;
    /**
     * Get a FileSystemFileHandle
    **/
    getFile(path: string | string[], create?: boolean): Promise<FileSystemFileHandle>;
    /**
     * Resolves the absolute path of given path or FileSystemHandle
    **/
    resolve(path: string | string[] | FileSystemHandle): Promise<string>;
    /**
     * Changes the current working directory
    **/
    cd(path: string | string[]): Promise<FileSystemDirectoryHandle>;
    /**
     * Returns the current working directory
    **/
    pwd(): string;
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
    ls(path: string | string[] | FileSystemDirectoryHandle, filter?: (name: string, handle: FileSystemHandle) => Promise<boolean> | boolean): Promise<[string, FileSystemHandle][]>;
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
    write(path: string | string[] | FileSystemFileHandle, content: FileSystemWriteChunkType, options?: {
        append?: boolean;
    } & FileSystemCreateWritableOptions): Promise<void>;
    /**
     * Copy file to destination.
     * If a file already exists in its destination, it will be overwritten.
     *
     * ```ts
     * const fs = new LocalFS(handle);
     * await fs.copyFile("/file.txt", "/folder/fileCopy.txt");
     * ```
    **/
    copyFile(path: string | string[] | FileSystemFileHandle, destination: string | string[] | FileSystemFileHandle): Promise<void>;
    /**
     * Copy directory to destination.
     * If a directory already exists in its destination, it will be merged and overwritten.
     *
     * ```ts
     * const fs = new LocalFS(handle);
     * await fs.copyDir("/folder", "/path/to/folder");
     * ```
    **/
    copyDir(path: string | string[] | FileSystemDirectoryHandle, destination: string | string[] | FileSystemDirectoryHandle): Promise<void>;
}
