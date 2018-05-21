"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
/**
 * 解析指定的源码。
 * @param paths 要解析的路径。
 * @return 返回已解析的文档对象。
 */
function parseDoc(...paths) {
    const program = ts.createProgram(paths, {});
    return parseProgram(program, program.getSourceFiles().filter(x => !x.isDeclarationFile));
}
exports.default = parseDoc;
/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
function parseProgram(program, sourceFiles) {
    const checker = program.getTypeChecker();
    const builder = checker.getSymbolDisplayBuilder();
    const result = {
        sourceFiles: []
    };
    for (const sourceFile of sourceFiles) {
        result.sourceFiles.push(parseSouceFile(sourceFile));
    }
    return result;
    function parseSouceFile(sourceFile) {
        if (sourceFile._docMember) {
            return sourceFile._docMember;
        }
        const result = sourceFile._docMember = {
            name: sourceFile.fileName
        };
        const jsDoc = getJSDoc(sourceFile);
        if (jsDoc && jsDoc.tags) {
            for (const tag of jsDoc.tags) {
                const tagName = tag.tagName.text;
                const comment = tag.comment.trim();
                switch (tagName) {
                    case "file":
                    case "fileoverview":
                    case "fileOverview":
                        result.summary = comment;
                        break;
                    case "author":
                        result.author = comment;
                        break;
                    case "version":
                        result.version = comment;
                        break;
                    case "license":
                    case "licence":
                        result.license = comment;
                        break;
                }
            }
        }
        if (ts.isExternalModule(sourceFile)) {
            result.commonJsModule = true;
        }
        for (const rf of sourceFile.referencedFiles) {
            result.imports = result.imports || [];
            result.imports.push({
                name: rf.fileName,
                reference: true
            });
        }
        if (result.commonJsModule) {
            for (const importDeclaration of sourceFile.imports) {
                result.imports = result.imports || [];
                result.imports.push({
                    name: importDeclaration.text
                });
            }
            for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile))) {
                const member = addMember(result, symbol);
                if (member) {
                    member.exportName = symbol.name;
                }
            }
        }
        else {
            for (const statement of sourceFile.statements) {
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (const declaration of statement.declarationList.declarations) {
                            addMember(result, checker.getSymbolAtLocation(declaration.name));
                        }
                        break;
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.EnumDeclaration:
                    case ts.SyntaxKind.TypeAliasDeclaration:
                        addMember(result, checker.getSymbolAtLocation(statement.name));
                        break;
                }
            }
        }
        return result;
    }
    function addMember(container, symbol) {
        const member = parseMember(symbol);
        if (member) {
            container.members = container.members || [];
            container.members.push(member);
        }
        return member;
    }
    function parseMember(symbol) {
        if (symbol._docMember) {
            return symbol._docMember;
        }
        if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor | ts.SymbolFlags.Signature)) {
            let result;
            let overloads;
            for (const declaration of symbol.getDeclarations()) {
                if (declaration.flags & ts.NodeFlags.Namespace || !declaration.parameters) {
                    continue;
                }
                const signature = checker.getSignatureFromDeclaration(declaration);
                const method = createMember(symbol.flags & ts.SymbolFlags.Constructor ? "constructor" : symbol.flags & ts.SymbolFlags.Signature ? "indexer" : symbol.flags & ts.SymbolFlags.Method ? "method" : "function", signature, declaration, symbol.parent);
                if (declaration.asteriskToken) {
                    method.generator = true;
                }
                const modifierFlags = ts.getCombinedModifierFlags(declaration);
                if (modifierFlags & ts.ModifierFlags.Async) {
                    method.async = true;
                }
                if (modifierFlags & ts.ModifierFlags.Abstract) {
                    method.abstract = true;
                }
                if (signature.typeParameters) {
                    method.typeParameters = parseTypeParameters(signature.typeParameters);
                }
                const thisParameterSymbol = signature.thisParameter;
                if (thisParameterSymbol) {
                    method.thisType = parseType(checker.getTypeOfSymbolAtLocation(thisParameterSymbol, thisParameterSymbol.valueDeclaration));
                }
                method.parameters = parseParameters(signature.getParameters());
                method.returnType = parseType(signature.getReturnType());
                const returnDoc = ts.getJSDocReturnTag(declaration);
                if (returnDoc) {
                    method.returnSummary = returnDoc.comment;
                }
                if (!result && checker.isImplementationOfOverload(declaration)) {
                    result = method;
                }
                else {
                    overloads = overloads || [];
                    overloads.push(method);
                }
            }
            // 如果所有函数都没有主体，则创建新主体。
            if (!result && overloads) {
                result = {
                    memberType: overloads[0].memberType,
                    name: overloads[0].name,
                    overloads: overloads
                };
                copyMember(result, overloads[0]);
            }
            if (overloads) {
                result.overloads = overloads;
                if (!result.summary) {
                    for (const overload of overloads) {
                        if (result.summary = overload.summary) {
                            break;
                        }
                    }
                }
            }
            if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
                const type = parseAsInterface(symbol);
                type.prototypes = type.prototypes || [];
                type.prototypes.unshift(result);
                return type;
            }
            return result;
        }
        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property)) {
            if (symbol.flags & ts.SymbolFlags.Prototype) {
                return null;
            }
            const declaration = symbol.valueDeclaration;
            const result = createMember(symbol.flags & ts.SymbolFlags.Property ? "field" : "variable", symbol, declaration, symbol.parent);
            if (symbol.flags & ts.SymbolFlags.Optional) {
                result.optional = true;
            }
            if (ts.isConst(declaration)) {
                result.const = true;
            }
            if (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) {
                result.readOnly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, declaration));
            if (result.tags && result.tags.default) {
                result.default = result.tags.default;
                delete result.tags.default;
            }
            else if (declaration.initializer) {
                result.default = declaration.initializer.getText();
            }
            return result;
        }
        if (symbol.flags & ts.SymbolFlags.Accessor) {
            const result = createMember("accessor", symbol, getDeclaration(symbol), symbol.parent);
            if (!(symbol.flags & ts.SymbolFlags.SetAccessor)) {
                result.readOnly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, getDeclaration(symbol)));
            if (result.tags && result.tags.default) {
                result.default = result.tags.default;
                delete result.tags.default;
            }
            return result;
        }
        if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
            return parseAsInterface(symbol);
        }
        if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            const result = createMember("enum", symbol, getDeclaration(symbol), symbol.parent);
            if (symbol.flags & ts.SymbolFlags.ConstEnum) {
                result.const = true;
            }
            if (symbol.exports) {
                symbol.exports.forEach((symbol, key) => {
                    addMember(result, symbol);
                });
            }
            let lastValue = -1;
            for (const member of result.members) {
                if (member.default == null) {
                    member.default = (++lastValue).toString();
                }
                else {
                    lastValue = +member.default || lastValue;
                }
            }
            return result;
        }
        if (symbol.flags & ts.SymbolFlags.EnumMember) {
            const result = createMember("enumMember", symbol, getDeclaration(symbol), symbol.parent);
            if (symbol.valueDeclaration.initializer) {
                result.default = symbol.valueDeclaration.initializer.getText();
            }
            return result;
        }
        if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule)) {
            const result = createMember("namespace", symbol, getDeclaration(symbol), symbol.parent);
            if (symbol.exports) {
                symbol.exports.forEach((symbol, key) => {
                    addMember(result, symbol);
                });
            }
            return result;
        }
        if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            const result = createMember("type", symbol, getDeclaration(symbol), symbol.parent);
            result.type = parseType(checker.getDeclaredTypeOfSymbol(symbol), true);
            return result;
        }
        return null;
    }
    function parseAsInterface(symbol) {
        const result = createMember(symbol.flags & ts.SymbolFlags.Class ? "class" : "interface", symbol, getDeclaration(symbol), symbol.parent);
        const type = checker.getDeclaredTypeOfSymbol(symbol);
        if (type.typeParameters) {
            result.typeParameters = parseTypeParameters(type.typeParameters);
        }
        for (const baseType of checker.getBaseTypes(type)) {
            result.extends = result.extends || [];
            result.extends.push(parseType(baseType));
        }
        const implementTypes = symbol.valueDeclaration && ts.getClassImplementsHeritageClauseElements(symbol.valueDeclaration);
        if (implementTypes) {
            for (const implementType of implementTypes) {
                result.implements = result.implements || [];
                result.implements.push(parseType(checker.getTypeAtLocation(implementType.expression)));
            }
        }
        const constructor = symbol.members.get("__constructor");
        if (constructor) {
            result.constructor = parseMember(constructor);
        }
        const index = symbol.members.get("__index");
        if (index) {
            result.indexer = parseMember(index);
        }
        const baseTypes = checker.getBaseTypes(type);
        for (const childSymbol of checker.getPropertiesOfType(type)) {
            const member = parseMember(childSymbol);
            let own = childSymbol.parent === symbol;
            if (own) {
                for (const baseType of baseTypes) {
                    if (baseType.getProperty(childSymbol.name)) {
                        own = false;
                        member.override = parseType(baseType, true);
                        break;
                    }
                }
            }
            if (!member.summary && own === false) {
                const copySummaryFromBaseType = (type) => {
                    for (const baseType of checker.getBaseTypes(type)) {
                        if (baseType.getProperty(childSymbol.name)) {
                            copyMember(member, parseMember(baseType.getProperty(childSymbol.name)));
                        }
                        if (!member.summary) {
                            copySummaryFromBaseType(baseType);
                        }
                    }
                };
                copySummaryFromBaseType(type);
            }
            if (member) {
                if (own) {
                    result.prototypes = result.prototypes || [];
                    result.prototypes.push(member);
                }
                else {
                    result.extendedPrototypes = result.extendedPrototypes || [];
                    result.extendedPrototypes.push(member);
                }
            }
        }
        if (symbol.exports) {
            symbol.exports.forEach((symbol, key) => {
                addMember(result, symbol);
            });
        }
        return result;
    }
    function createMember(memberType, symbolOrSignature, declaration, parentSymbol) {
        const result = symbolOrSignature._docMember = {
            memberType: memberType,
            name: getSymbolName(symbolOrSignature, declaration),
            summary: memberType === "indexer" ? getJSDoc(declaration) && getJSDoc(declaration).comment.trim() : ts.displayPartsToString(symbolOrSignature.getDocumentationComment(checker))
        };
        if (parentSymbol && (parentSymbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface))) {
            result.parent = parseType(checker.getDeclaredTypeOfSymbol(parentSymbol));
        }
        for (const tag of symbolOrSignature.getJsDocTags()) {
            switch (tag.name) {
                case "desc":
                case "description":
                case "remark":
                    if (result.description) {
                        result.description += "\n" + tag.text;
                    }
                    else {
                        result.description = tag.text;
                    }
                    break;
                case "see":
                case "seeAlso":
                case "seealso":
                    result.sees = result.sees || [];
                    result.sees.push(tag.text);
                    break;
                case "example":
                case "sample":
                case "demo":
                    result.examples = result.examples || [];
                    result.examples.push(tag.text);
                    break;
                case "summary":
                    result.summary = tag.text;
                    break;
                case "internal":
                    result.internal = true;
                    break;
                case "name":
                    result.name = tag.text;
                    break;
                case "private":
                    result.private = true;
                    break;
                case "protected":
                    result.protected = true;
                    break;
                default:
                    result.tags = result.tags || { __proto__: null };
                    if (result.tags[tag.name]) {
                        result.tags[tag.name] += "\n" + tag.text;
                    }
                    else {
                        result.tags[tag.name] = tag.text;
                    }
                    break;
            }
        }
        const sourceFile = declaration.getSourceFile();
        result.sourceFile = sourceFile.fileName;
        const loc = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile, true));
        result.sourceLine = loc.line;
        result.sourceColumn = loc.character;
        const locEnd = sourceFile.getLineAndCharacterOfPosition(declaration.getEnd());
        result.sourceEndLine = locEnd.line;
        result.sourceEndColumn = locEnd.character;
        const modifierFlags = ts.getCombinedModifierFlags(declaration);
        if (modifierFlags & ts.ModifierFlags.Private) {
            result.private = true;
        }
        if (modifierFlags & ts.ModifierFlags.Protected) {
            result.protected = true;
        }
        return result;
    }
    function parseTypeParameters(typeParameters) {
        const result = [];
        for (const typeParameter of typeParameters) {
            const tp = {
                name: typeParameter.symbol.getName(),
                summary: ts.displayPartsToString(typeParameter.symbol.getDocumentationComment(checker))
            };
            if (typeParameter.getDefault && typeParameter.getDefault()) {
                tp.default = parseType(typeParameter.getDefault());
            }
            if (typeParameter.getConstraint && typeParameter.getConstraint()) {
                tp.extends = parseType(typeParameter.getConstraint());
            }
            result.push(tp);
        }
        return result;
    }
    function parseParameters(parameters) {
        const result = [];
        for (const parameterSymbol of parameters) {
            const paramNode = parameterSymbol.valueDeclaration;
            const p = {
                name: parameterSymbol.getName(),
                type: parseType(checker.getTypeOfSymbolAtLocation(parameterSymbol, paramNode)),
                summary: ts.displayPartsToString(parameterSymbol.getDocumentationComment(checker))
            };
            if (paramNode.initializer) {
                p.default = paramNode.initializer.getText();
            }
            if (paramNode.dotDotDotToken != null) {
                p.rest = true;
            }
            if (paramNode.questionToken != null || paramNode.dotDotDotToken != null || paramNode.initializer != null) {
                p.optional = true;
            }
            result.push(p);
        }
        return result;
    }
    function parseType(type, keepTypeAlias) {
        if (type._docMember && !keepTypeAlias) {
            return type._docMember;
        }
        const result = [];
        if (!keepTypeAlias) {
            type._docMember = result;
        }
        builder.buildTypeDisplay(type, {
            writeKeyword(text) {
                result.push({
                    type: "keyword",
                    text: text
                });
            },
            writeOperator(text) {
                result.push({
                    type: "operator",
                    text: text
                });
            },
            writePunctuation(text) {
                result.push({
                    type: "punctuation",
                    text: text
                });
            },
            writeSpace(text) {
                result.push({
                    type: "space",
                    text: text
                });
            },
            writeStringLiteral(text) {
                result.push({
                    type: "string",
                    text: text
                });
            },
            writeParameter(text) {
                result.push({
                    type: "name",
                    text: text
                });
            },
            writeProperty(text) {
                result.push({
                    type: "name",
                    text: text
                });
            },
            writeSymbol(text, symbol) {
                writeSymbol(symbol);
                function writeSymbol(symbol) {
                    if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.TypeParameter | ts.SymbolFlags.PropertyOrAccessor)) {
                        result.push({
                            type: "name",
                            text: symbol.name
                        });
                    }
                    else {
                        const declaration = getDeclaration(symbol);
                        result.push({
                            type: "symbol",
                            text: getSymbolName(symbol, declaration),
                            sourceFile: declaration && declaration.getSourceFile().fileName
                        });
                    }
                }
            },
            writeLine() {
                result.push({
                    type: "line",
                    text: " "
                });
            },
            increaseIndent() {
                result.push({
                    type: "indent",
                    text: ""
                });
            },
            decreaseIndent() {
                result.push({
                    type: "unindent",
                    text: ""
                });
            },
            clear() {
                result.length = 0;
            },
            trackSymbol() { },
            reportInaccessibleThisError() { },
            reportPrivateInBaseOfClassExpression() { }
        }, undefined, (keepTypeAlias ? ts.TypeFormatFlags.InTypeAlias : ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope) | ts.TypeFormatFlags.WriteArrowStyleSignature | ts.TypeFormatFlags.WriteClassExpressionAsTypeLiteral);
        return result;
    }
}
exports.parseProgram = parseProgram;
function getJSDoc(node) {
    const jsDocRanges = ts.getLeadingCommentRanges(node.getSourceFile().text, node.pos);
    if (jsDocRanges && jsDocRanges.length) {
        const jsDocRange = jsDocRanges[0];
        const rootJsDoc = ts.parseIsolatedJSDocComment(node.getSourceFile().text, jsDocRange.pos, jsDocRange.end - jsDocRange.pos);
        if (rootJsDoc && rootJsDoc.jsDoc) {
            return rootJsDoc.jsDoc;
        }
    }
}
function getDeclaration(symbol) {
    return symbol.valueDeclaration || (symbol.getDeclarations() || [])[0];
}
function getSymbolName(symbol, declaration) {
    const nameNode = declaration && ts.getNameOfDeclaration(declaration);
    return nameNode ? nameNode.getText() : symbol.name;
}
function copyMember(dest, src) {
    for (const key in src) {
        if (key === "parent" || dest[key] == undefined || dest[key] === "") {
            dest[key] = src[key];
        }
        else if (key === "parameters" || key === "typeParameters") {
            dest[key].forEach((p, i) => {
                p.summary = p.summary || src[key] && src[key][i] && src[key][i].summary;
            });
        }
    }
}
/**
 * 重新整理归类所有成员。
 * @param members 要处理的成员。
 * @param publicOnly 是否删除内部成员。
 * @param docOnly 是否删除未编写文档的成员。
 * @return 返回已整理的成员。
 */
function sort(members, publicOnly, docOnly) {
    const global = {
        name: "",
        propteries: new Map(),
        methods: new Map()
    };
    const types = [global];
    for (const member of members) {
        addMember(global, member, "");
    }
    if (!global.propteries.size && !global.methods.size) {
        types.shift();
    }
    return types;
    function addMember(container, member, prefix) {
        if (publicOnly && (member.private || member.internal)) {
            return;
        }
        if (docOnly && !member.summary) {
            return;
        }
        const name = prefix + member.name;
        switch (member.memberType) {
            case "variable":
            case "field":
            case "accessor":
            case "enumMember":
                container.propteries.set(name, member);
                break;
            case "function":
            case "method":
                container.methods.set(name, member);
                break;
            case "class":
            case "interface":
            case "enum":
                container = {
                    name: name,
                    member: member,
                    propteries: new Map(),
                    methods: new Map()
                };
                types.push(container);
                const constructor = member.constructor;
                if (typeof constructor === "object" && !(publicOnly && (constructor.private || constructor.internal) && !(docOnly && !constructor.summary))) {
                    container.methods.set(`new ${name}`, constructor);
                }
                const indexer = member.indexer;
                if (indexer && !(publicOnly && (indexer.private || indexer.internal) && !(docOnly && !indexer.summary))) {
                    container.propteries.set(`[]`, indexer);
                }
                if (member.prototypes) {
                    for (const child of member.prototypes) {
                        addMember(container, child, "");
                    }
                }
                if (member.extendedPrototypes) {
                    for (const child of member.extendedPrototypes) {
                        addMember(container, child, "");
                    }
                }
                break;
            case "type":
                container = {
                    name: name,
                    member: member,
                    propteries: new Map(),
                    methods: new Map()
                };
                types.push(container);
                break;
        }
        if (member.members) {
            for (const child of member.members) {
                addMember(container, child, name + ".");
            }
        }
    }
}
exports.sort = sort;
/**
 * 获取类型的名称。
 * @param type 类型。
 * @return 返回对应的字符串。
 */
function typeToString(type) {
    let result = "";
    for (const part of type) {
        result += part.text;
    }
    return result;
}
exports.typeToString = typeToString;
/**
 * 精简类型表达式。
 * @param type 类型。
 * @return 返回精简的类型。
 */
function toSimpleType(type) {
    if (type._simple) {
        return type._simple;
    }
    const result = type._simple = [];
    read(result, 0, type.length);
    return result;
    function read(result, start, end) {
        let ignoreString;
        let ignoreNumber;
        while (start < end) {
            const token = type[start];
            if (token.text === "new" && token.type === "keyword") { // new (...) => ...
                result.push({ type: "keyword", text: "function" });
                return end;
            }
            else if (token.text === "(") { // (...) => ..., (...)
                const right = matched(start, end, "(", ")");
                if (right + 2 < end && type[right + 2].text === "=>") {
                    result.push({ type: "keyword", text: "function" });
                    return end;
                }
                const temp = [];
                read(temp, start + 1, right);
                if (temp.length === 1) {
                    result.push(temp[0]);
                }
                else {
                    result.push(type[start], ...temp, type[right]);
                }
                start = right + 1;
            }
            else if (token.text === "{" || token.text === "class" && token.type === "keyword") { // {...}
                const right = matched(start, end, "{", "}");
                result.push({ type: "keyword", text: "object" });
                start = right + 1;
            }
            else if (token.text === "[") { // [...]
                const right = matched(start, end, "[", "]");
                result.push({ type: "keyword", text: "array" });
                start = right + 1;
            }
            else if (token.type === "string" && /^(\d+|".*")$/.test(token.text)) { // "", 0
                result.push({ type: "keyword", text: /^"/.test(token.text) ? "string" : "number" });
                start++;
            }
            else {
                do {
                    result.push(type[start++]);
                    if (start < end && type[start].text === "<") {
                        const right = matched(start, end, "<", ">");
                        while (start < right) {
                            result.push(type[start++]);
                        }
                    }
                } while (start < end && type[start].text !== "|" && type[start].text !== "&" && type[start].text !== "," && type[start].type !== "space");
            }
            while (start < end && type[start].text === "[") {
                const right = matched(start, end, "[", "]");
                while (start <= right) {
                    result.push(type[start++]);
                }
            }
            if (ignoreString && result[result.length - 1].type === "keyword" && result[result.length - 1].text === "string" || ignoreNumber && result[result.length - 1].type === "keyword" && result[result.length - 1].text === "number") {
                result.pop();
                result.pop();
                result.pop();
                result.pop();
            }
            while (start + 2 < end && type[start].type === "space" && type[start + 1].text === "|" && type[start + 2].type === "space") {
                const next = start + 3 < end && type[start + 3];
                if (next && next.type === "keyword" && (next.text === "null" || next.text === "undefined")) {
                    start += 4;
                    continue;
                }
                if (result[result.length - 1].type === "keyword") {
                    ignoreString = ignoreString || result[result.length - 1].text === "string";
                    ignoreNumber = ignoreNumber || result[result.length - 1].text === "number";
                }
                result.push(type[start], type[start + 1], type[start + 2]);
                start += 3;
                break;
            }
        }
    }
    function matched(start, end, left, right) {
        for (let count = 1; ++start < end;) {
            if (type[start].text === left) {
                count++;
            }
            else if (type[start].text === right) {
                count--;
                if (count === 0) {
                    break;
                }
            }
        }
        return start;
    }
}
exports.toSimpleType = toSimpleType;
