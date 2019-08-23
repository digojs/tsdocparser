import { parseDoc } from "../src/typeScriptDocParser"

// require("inspector").open(undefined, undefined, true)
console.log(parseDoc(
    __dirname + "/fixtures/variable.ts",
    __dirname + "/fixtures/function.ts",
    __dirname + "/fixtures/interface.ts",
    __dirname + "/fixtures/class.ts",
    __dirname + "/fixtures/enum.ts",
    __dirname + "/fixtures/namespace.ts",
    __dirname + "/fixtures/module.ts",
    __dirname + "/fixtures/script.ts",
    __dirname + "/fixtures/type.ts",
))


debugger