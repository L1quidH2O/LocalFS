/*
    A simple implementation of a POSIX path library
*/


export const ROOT_NAME = "";
export const PATH_SEPERATOR = "/";

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
export function normalize(path: string[], allowUpstream: boolean): string[] {
    let res = [];
    let segCount = 0;
    let isAbsolute = false;

    const l = path.length;

    for(let i = 0; i <= l; i++){
        const p = path[i];
        if(i === 0 && p === ROOT_NAME){ isAbsolute = true; res.push(p); continue; }

        if (!p || p === "."){}
        else if (p === "..") {
            
            if(isAbsolute && res.length > 1){ res.pop(); }
            else if(!isAbsolute && allowUpstream){
                if(segCount>0){
                    res.pop();
                    segCount--;
                }
                else res.push("..");
            }
            else if(!isAbsolute && res.length > 0){ res.pop(); }
            else if(!isAbsolute){ return [] }
        }
        else {
            res.push(p);
            segCount++;
        }
    }
    return res;
}

/**
 * joins a sequence of paths or path segments.
 * 
 * ```ts
 * resolve(toArray("/folder/subfolder"), toArray("../subfolder2/project"))  // returns toArray("/folder/subfolder2/project")
 * ```
**/
export function resolve(...args: string[][]): string[] {
    let resolvedPath: string[] = [];
    let resolvedAbsolute = false;
    for(let i = args.length-1; !resolvedAbsolute && i >= 0; i--){
        const path = args[i];
        if (path.length === 0) continue;
        resolvedPath = path.concat(resolvedPath);
        resolvedAbsolute = path[0] === ROOT_NAME;
    }
    
    resolvedPath = normalize(resolvedPath, true);
    
    if (resolvedPath.length === 0) return ['.'];
    return resolvedPath;
}

/**
 * Converts a POSIX path string into an array for processing through other methods.
 * 
 * ```ts
 * toArray("/folder/folder2/../file")
 * // returns ["", "folder", "folder2", "..", "file"]
 * // where "" is root
 * ```
**/
export function toArray(path: string=""): string[] {
    const arr = path.split(PATH_SEPERATOR);
    if(arr.at(-1) === ""){ arr.pop(); }
    return arr;
}

export function toString(path: string[]): string {
    if(path[0] === ROOT_NAME && path.length == 1){ return PATH_SEPERATOR }
    return path.join(PATH_SEPERATOR);
}