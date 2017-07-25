# TSDocParser
Document comment parser for TypeScript & JavaScript.

This libaray is designed to parse TypeScript & JavaScript source code and create a data json which you can do more with. It does not create full html documents for you.

## Usage
```bash
npm install tsdocparser
```

```js
var parseDoc = require("tsdocparser").default;

var output = parseDoc("foo.ts");
// =>
// ​ {
//   "members": [​​​​​
//     {​​​​​
//       "memberType": "method",​​​​​
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
//       "sourceColumn": 0,​​​​​
//       "name": "fn",​​​​​
//       "summary": "The Method"​​​​​
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