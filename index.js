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
                if (declaration.flags & ts.NodeFlags.Namespace) {
                    continue;
                }
                const signature = checker.getSignatureFromDeclaration(declaration);
                const method = createMember(symbol.flags & ts.SymbolFlags.Constructor ? "constructor" : symbol.flags & ts.SymbolFlags.Signature ? "indexer" : symbol.flags & ts.SymbolFlags.Method ? "method" : "function", signature, declaration);
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
                if (!result && declaration.body) {
                    result = method;
                }
                else {
                    overloads = overloads || [];
                    overloads.push(method);
                }
            }
            if (!result && overloads) {
                result = overloads.shift();
                if (!overloads.length) {
                    overloads = undefined;
                }
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
            return result;
        }
        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property)) {
            if (symbol.flags & ts.SymbolFlags.Prototype) {
                return null;
            }
            const declaration = symbol.valueDeclaration;
            const result = createMember(symbol.flags & ts.SymbolFlags.Property ? "field" : "variable", symbol, declaration);
            const parentSymbol = symbol.parent;
            if (parentSymbol && (parentSymbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface))) {
                result.parent = parseType(checker.getDeclaredTypeOfSymbol(parentSymbol));
            }
            if (ts.isConst(declaration)) {
                result.const = true;
            }
            if (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) {
                result.readonly = true;
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
            const result = createMember("accessor", symbol, getDeclaration(symbol));
            const parentSymbol = symbol.parent;
            if (parentSymbol && (parentSymbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface))) {
                result.parent = parseType(checker.getDeclaredTypeOfSymbol(parentSymbol));
            }
            if (!(symbol.flags & ts.SymbolFlags.SetAccessor)) {
                result.readonly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, getDeclaration(symbol)));
            if (result.tags && result.tags.default) {
                result.default = result.tags.default;
                delete result.tags.default;
            }
            return result;
        }
        if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
            const result = createMember(symbol.flags & ts.SymbolFlags.Class ? "class" : "interface", symbol, getDeclaration(symbol));
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
            for (const childSymbol of checker.getPropertiesOfType(type)) {
                const member = parseMember(childSymbol);
                if (member) {
                    if (childSymbol.parent === symbol) {
                        result.prototypes = result.prototypes || [];
                        result.prototypes.push(member);
                    }
                    else {
                        result.extendedPototypes = result.extendedPototypes || [];
                        result.extendedPototypes.push(member);
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
        if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            const result = createMember("enum", symbol, getDeclaration(symbol));
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
            const result = createMember("enumMember", symbol, getDeclaration(symbol));
            if (symbol.valueDeclaration.initializer) {
                result.default = symbol.valueDeclaration.initializer.getText();
            }
            return result;
        }
        if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule | ts.SymbolFlags.ExportNamespace)) {
            const result = createMember("namespace", symbol, getDeclaration(symbol));
            if (symbol.exports) {
                symbol.exports.forEach((symbol, key) => {
                    addMember(result, symbol);
                });
            }
            return result;
        }
        if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            const result = createMember("type", symbol, getDeclaration(symbol));
            result.type = parseType(checker.getDeclaredTypeOfSymbol(symbol));
            return result;
        }
        return null;
    }
    function createMember(memberType, symbolOrSignature, declaration) {
        const result = symbolOrSignature._docMember = {
            memberType: memberType,
            name: getSymbolName(symbolOrSignature, declaration),
            summary: memberType === "indexer" ? getJSDoc(declaration) && getJSDoc(declaration).comment.trim() : ts.displayPartsToString(symbolOrSignature.getDocumentationComment())
        };
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
                summary: ts.displayPartsToString(typeParameter.symbol.getDocumentationComment())
            };
            if (typeParameter.default) {
                tp.default = parseType(typeParameter.default);
            }
            if (typeParameter.constraint) {
                tp.extends = parseType(typeParameter.constraint);
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
                summary: ts.displayPartsToString(parameterSymbol.getDocumentationComment())
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
    function parseType(type) {
        if (type._docMember) {
            return type._docMember;
        }
        const result = type._docMember = [];
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
        }, null, ts.TypeFormatFlags.UseTypeAliasValue | ts.TypeFormatFlags.WriteArrowStyleSignature | ts.TypeFormatFlags.WriteClassExpressionAsTypeLiteral);
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
 * 重新整理归类所有成员。
 * @param members 要处理的成员。
 * @param publicOnly 是否删除内部成员。
 * @param docOnly 是否删除未编写文档的成员。
 * @return 返回已整理的成员。
 */
function sort(members, docOnly, publicOnly) {
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
            case "field":
            case "accessor":
            case "enumMember":
                container.propteries.set(name, member);
                break;
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
                if (member.constructor) {
                    container.methods.set(`new ${name}`, member.constructor);
                }
                if (member.indexer) {
                    container.methods.set(`[]`, member.indexer);
                }
                if (member.prototypes) {
                    for (const child of member.prototypes) {
                        addMember(container, child, "");
                    }
                }
                if (member.extendedPototypes) {
                    for (const child of member.extendedPototypes) {
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
