"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
/**
 * 表示一个文档项。
 */
class DocEntry {
}
exports.DocEntry = DocEntry;
/**
 * 表示一个成员。
 */
class DocMember extends DocEntry {
    toJSON() {
        return Object.assign({ memberType: this.memberType }, this);
    }
}
exports.DocMember = DocMember;
/**
 * 表示一个字段。
 */
class DocField extends DocMember {
    /**
     * 成员类型。
     */
    get memberType() { return "field"; }
}
exports.DocField = DocField;
/**
 * 表示一个方法。
 */
class DocMethod extends DocMember {
    constructor() {
        super(...arguments);
        /**
         * 所有形参。
         */
        this.parameters = [];
    }
    /**
     * 成员类型。
     */
    get memberType() { return "method"; }
}
exports.DocMethod = DocMethod;
/**
 * 表示一个形参。
 */
class DocParameter extends DocEntry {
}
exports.DocParameter = DocParameter;
/**
 * 表示一个泛型的形参。
 */
class DocTypeParameter extends DocEntry {
}
exports.DocTypeParameter = DocTypeParameter;
/**
 * 表示一个容器。
 */
class DocMemberContainer extends DocMember {
    /**
     * 获取指定名称的成员。
     * @param name 要获取的名称。
     * @return 返回成员对象。
     */
    getMember(name) {
        return this.members.find(member => member.name == name);
    }
}
exports.DocMemberContainer = DocMemberContainer;
/**
 * 表示一个类。
 */
class DocClass extends DocMemberContainer {
    /**
     * 成员类型。
     */
    get memberType() { return "class"; }
}
exports.DocClass = DocClass;
/**
 * 表示一个接口。
 */
class DocInterface extends DocMemberContainer {
    /**
     * 成员类型。
     */
    get memberType() { return "interface"; }
}
exports.DocInterface = DocInterface;
/**
 * 表示一个命名空间。
 */
class DocNamespace extends DocMemberContainer {
    /**
     * 成员类型。
     */
    get memberType() { return "namespace"; }
}
exports.DocNamespace = DocNamespace;
/**
 * 表示一个枚举。
 */
class DocEnum extends DocMemberContainer {
    /**
     * 成员类型。
     */
    get memberType() { return "enum"; }
}
exports.DocEnum = DocEnum;
/**
 * 表示一个枚举字段。
 */
class DocEnumMember extends DocMember {
    /**
     * 成员类型。
     */
    get memberType() { return "enumMember"; }
}
exports.DocEnumMember = DocEnumMember;
/**
 * 表示一个类型别名。
 */
class DocTypeAlias extends DocMember {
    /**
     * 成员类型。
     */
    get memberType() { return "type"; }
}
exports.DocTypeAlias = DocTypeAlias;
/**
 * 表示一个类型。
 */
class DocType {
    constructor() {
        /**
         * 类型各组成部分。
         */
        this.parts = [];
    }
    toString() {
        let result = "";
        for (const part of this.parts) {
            result += typeof part == "string" ? part : typeof part == "boolean" ? "" : part.name;
        }
        return result;
    }
}
exports.DocType = DocType;
/**
 * 表示一个源文件。
 */
class DocSourceFile extends DocEntry {
    constructor() {
        super(...arguments);
        /**
         * 所有成员项。
         */
        this.members = [];
        /**
         * 当前模块的导入项。
         * 如果值为 true 说明是 import 导入，否则为引用。
         */
        this.imports = { __proto__: null };
        /**
         * 当前模块的导出项。
         * 键表示导出的名称；值表示成员的实际名称。
         */
        this.exports = { __proto__: null };
    }
}
exports.DocSourceFile = DocSourceFile;
/**
 * 表示一个文档对象。
 */
class DocProject {
    constructor() {
        /**
         * 所有源文件。
         */
        this.sourceFiles = [];
    }
    /**
     * 获取指定文件。
     * @param sourceFile 要获取的文件名。
     * @return 返回文件对象。
     */
    getSourceFile(sourceFile) {
        return this.sourceFiles.find(file => file.name == sourceFile);
    }
}
exports.DocProject = DocProject;
/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
function parseProgram(program, sourceFiles) {
    const checker = program.getTypeChecker();
    const result = new DocProject();
    for (const sourceFile of sourceFiles) {
        result.sourceFiles.push(parseSouceFile(sourceFile));
    }
    return result;
    function parseSouceFile(sourceFile) {
        const result = new DocSourceFile();
        result.name = sourceFile.fileName;
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
        result.isCommonJsModule = ts.isExternalModule(sourceFile);
        for (const rf of sourceFile.referencedFiles) {
            result.imports[rf.fileName] = false;
        }
        if (result.isCommonJsModule) {
            for (const importDeclaration of sourceFile.imports) {
                result.imports[importDeclaration.text] = true;
            }
            for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile))) {
                const member = parseSymbol(symbol);
                if (member) {
                    result.exports[symbol.name] = member.name;
                    result.members.push(member);
                }
            }
        }
        else {
            for (const statement of sourceFile.statements) {
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (const declaration of statement.declarationList.declarations) {
                            result.members.push(parseSymbol(checker.getSymbolAtLocation(declaration.name)));
                        }
                        break;
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.EnumDeclaration:
                    case ts.SyntaxKind.TypeAliasDeclaration:
                        result.members.push(parseSymbol(checker.getSymbolAtLocation(statement.name)));
                        break;
                }
            }
        }
        return result;
    }
    function parseSymbol(symbol) {
        let result;
        const tags = symbol.getJsDocTags();
        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property | ts.SymbolFlags.Accessor) && !(symbol.flags & ts.SymbolFlags.Prototype)) {
            result = new DocField();
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
        }
        else if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor)) {
            result = new DocMethod();
            const signature = checker.getSignatureFromDeclaration(symbol.getDeclarations()[0]);
            if (signature.typeParameters) {
                result.typeParameters = parseTypeParameters(signature.typeParameters);
            }
            const thisParameterSymbol = signature.thisParameter;
            if (thisParameterSymbol) {
                result.thisType = parseType(checker.getTypeOfSymbolAtLocation(thisParameterSymbol, thisParameterSymbol.valueDeclaration));
            }
            for (const parameterSymbol of signature.getParameters()) {
                const paramNode = parameterSymbol.valueDeclaration;
                const p = new DocParameter();
                p.name = parameterSymbol.getName();
                p.type = parseType(checker.getTypeOfSymbolAtLocation(parameterSymbol, paramNode));
                p.summary = ts.displayPartsToString(parameterSymbol.getDocumentationComment());
                if (paramNode.initializer) {
                    p.default = paramNode.initializer.getText();
                }
                p.rest = paramNode.dotDotDotToken != null;
                p.optional = paramNode.questionToken != null || paramNode.dotDotDotToken != null || paramNode.initializer != null;
                result.parameters.push(p);
            }
            result.returnType = parseType(signature.getReturnType());
            const returnDoc = ts.getJSDocReturnTag(symbol.valueDeclaration);
            if (returnDoc) {
                result.returnSummary = returnDoc.comment;
            }
        }
        else if (symbol.flags & ts.SymbolFlags.Class) {
            result = new DocClass();
            const type = checker.getDeclaredTypeOfSymbol(symbol);
            if (type.typeParameters) {
                result.typeParameters = parseTypeParameters(type.typeParameters);
            }
            result.members = parseSymbolList(symbol.exports);
            result.prototypes = parseSymbolList(symbol.members);
        }
        else if (symbol.flags & ts.SymbolFlags.Interface) {
            result = new DocInterface();
            const type = checker.getDeclaredTypeOfSymbol(symbol);
            if (type.typeParameters) {
                result.typeParameters = parseTypeParameters(type.typeParameters);
            }
            result.members = parseSymbolList(symbol.members);
        }
        else if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            result = new DocEnum();
            result.members = parseSymbolList(symbol.exports);
            let value = 0;
            for (const member of result.members) {
                if (member.value != null) {
                    value = member.value;
                }
                else {
                    member.value = value++;
                }
            }
        }
        else if (symbol.flags & ts.SymbolFlags.EnumMember) {
            result = new DocEnumMember();
            if (symbol.valueDeclaration.initializer) {
                result.value = +symbol.valueDeclaration.initializer.getText();
            }
        }
        else if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            result = new DocTypeAlias();
            result.type = parseType(checker.getDeclaredTypeOfSymbol(symbol));
        }
        else if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule | ts.SymbolFlags.ExportNamespace)) {
            result = new DocNamespace();
            result.members = parseSymbolList(symbol.exports);
        }
        else {
            return null;
        }
        const declarations = symbol.getDeclarations();
        if (declarations && declarations.length) {
            const modifierFlags = ts.getCombinedModifierFlags(declarations[0]);
            result.private = (modifierFlags & ts.ModifierFlags.Private) != 0;
            result.protected = (modifierFlags & ts.ModifierFlags.Protected) != 0;
            result.abstract = (modifierFlags & ts.ModifierFlags.Abstract) != 0;
            result.async = (modifierFlags & ts.ModifierFlags.Async) != 0;
            result.const = (modifierFlags & ts.ModifierFlags.Const) != 0;
            const sourceFile = declarations[0].getSourceFile();
            result.sourceFile = sourceFile.fileName;
            const loc = sourceFile.getLineAndCharacterOfPosition(declarations[0].getStart(sourceFile, true));
            result.sourceLine = loc.line;
            result.sourceColumn = loc.character;
        }
        result.name = getSymbolName(symbol);
        result.summary = ts.displayPartsToString(symbol.getDocumentationComment());
        for (const tag of tags) {
            switch (tag.name) {
                case "desc":
                case "description":
                case "remark":
                    if (result.description) {
                        result.description += "\n";
                    }
                    result.description += tag.text;
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
                default:
                    result.tags = result.tags || { __proto__: null };
                    if (result.tags[tag.name]) {
                        result.tags[tag.name] += "\n";
                    }
                    result.tags[tag.name] = tag.text;
                    break;
            }
        }
        return result;
    }
    function parseSymbolList(list, ignoreMembers) {
        const result = [];
        if (list) {
            list.forEach((symbol, key) => {
                const member = parseSymbol(symbol);
                if (member) {
                    result.push(member);
                }
            });
        }
        return result;
    }
    function parseTypeParameters(typeParameters) {
        const result = [];
        for (const typeParameter of typeParameters) {
            const tp = new DocTypeParameter();
            tp.name = typeParameter.symbol.getName();
            tp.summary = ts.displayPartsToString(typeParameter.symbol.getDocumentationComment());
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
    function parseType(type) {
        const result = new DocType();
        const builder = checker.getSymbolDisplayBuilder();
        const writer = {
            writeKeyword(text) {
                result.parts.push(text);
            },
            writeOperator(text) {
                result.parts.push(text);
            },
            writePunctuation(text) {
                result.parts.push(text);
            },
            writeSpace(text) {
                result.parts.push(text);
            },
            writeStringLiteral(text) {
                result.parts.push(text);
            },
            writeParameter(text) {
                result.parts.push(text);
            },
            writeProperty(text) {
                result.parts.push(text);
            },
            writeSymbol(text, symbol) {
                result.parts.push(symbolToType(symbol));
                function symbolToType(symbol) {
                    const result = {
                        name: getSymbolName(symbol),
                        sourceFile: symbol.getDeclarations() && symbol.getDeclarations()[0] && symbol.getDeclarations()[0].getSourceFile().fileName
                    };
                    if (symbol.parent) {
                        result.parent = symbolToType(symbol.parent);
                    }
                    return result;
                }
            },
            writeLine() {
                result.parts.push("\n");
            },
            increaseIndent() {
                result.parts.push(true);
            },
            decreaseIndent() {
                result.parts.push(false);
            },
            clear() {
                result.parts.length = 0;
            },
            trackSymbol() { },
            reportInaccessibleThisError() { },
            reportPrivateInBaseOfClassExpression() { }
        };
        builder.buildTypeDisplay(type, writer, null, ts.TypeFormatFlags.UseTypeAliasValue | ts.TypeFormatFlags.WriteArrowStyleSignature | ts.TypeFormatFlags.WriteClassExpressionAsTypeLiteral);
        return result;
    }
    function getSymbolName(symbol) {
        return symbol.valueDeclaration && ts.getNameOfDeclaration(symbol.valueDeclaration) && ts.getNameOfDeclaration(symbol.valueDeclaration).getText() || symbol.getName();
    }
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
}
exports.parseProgram = parseProgram;
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
