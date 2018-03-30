# TSDocParser
TSDocParser is a documentation comment core parser for TypeScript & JavaScript.

It reads documentation comments(The well known JSDoc format like `/** ... */`) from TypeScript & JavaScript source files and products a json file, which you can do more with(e.g. generate html files).

If you are looking for a full html document generator, go to [TSDoc](https://www.npmjs.com/package/tsdoc)

## Usage
```bash
npm install tsdocparser
```

```js
var parseDoc = require("tsdocparser").default;

var output = parseDoc("foo.ts");
// =>
// ​ {
//   // All exported members in foo.js
//   "members": [​​​​​  
//     {​​​​​
//       "memberType": "method",​​​​​
//       "name": "fn",​​​​​
//       "summary": "The Method"​​​​​,​​​​​
//       "parameters": [​​​​​
//         {​​​​​
//           "name": "a",​​​​​
//           "type": [{
//             "type": "keyword",
//             "text": "number"
//           }​​​​​]​​​​​,​​​​​
//           "summary": "The paramteter",​​​​​
//           "rest": false,​​​​​
//           "optional": false​​​​​
//         }​​​​​
//       ],​​​​​
//       "returnType": [​​​​​{
//         "type": "keyword",
//         "text": "number"
//       }​​​​​]​​​​​,​​​​​
//       "sourceFile": "test.ts",​​​​​
//       "sourceLine": 2,​​​​​
//       "sourceColumn": 0
//     }​​​​​
//   ],​​​​​
//   "imports": [],​​​​​
//   "name": "test.ts",​​​​​
//   "commonJsModule": true​​​​​
// }​​​​​
```

If you are trying to parse from string, or using a custom compiler options, use the `parseProgram` api.
```js
// For more documents of codes below, visit https://github.com/Microsoft/TypeScript
var ts = require("typescript");
var program = ts.createProgram(["foo.ts"], {});
var sourceFiles = program.getSourceFiles().filter(x => !x.isDeclarationFile);

// Parse documents from the program object.
var parseProgram = require("tsdocparser").parseProgram;
var output = parseProgram(program, sourceFiles);
```