export declare const ROOT_NAME = "";
export declare const PATH_SEPERATOR = "/";
/**
 * Resolves . and .. elements in a path
 * @param path A path array. @see toArray
 * @param allowUpstream Allow relative paths to continue upstream
 *
 * ```ts
 * normalize(toArray("./folder/../../../../file"), false)  // returns []
 * normalize(toArray("./folder/../../../../file"), true)  // returns toArray('../../../file')
 * ```
**/
export declare function normalize(path: string[], allowUpstream: boolean): string[];
/**
 * joins a sequence of paths or path segments.
 *
 * ```ts
 * resolve(toArray("/folder/subfolder"), toArray("../subfolder2/project"))  // returns toArray("/folder/subfolder2/project")
 * ```
**/
export declare function resolve(...args: string[][]): string[];
/**
 * Converts a POSIX path string into an array for processing through other methods.
 *
 * ```ts
 * toArray("/folder/folder2/../file")
 * // returns ["", "folder", "folder2", "..", "file"]
 * // where "" is root
 * ```
**/
export declare function toArray(path?: string): string[];
export declare function toString(path: string[]): string;
