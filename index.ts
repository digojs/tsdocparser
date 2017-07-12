import * as ts from "typescript";

/**
 * 表示一个文档项。
 */
export abstract class DocEntry {

    /**
     * 名字。
     */
    name: string;

    /**
     * 概述。
     */
    summary?: string;

}

/**
 * 表示一个成员。
 */
export abstract class DocMember extends DocEntry {

    /**
     * 成员类型。
     */
    abstract get memberType(): string;

    /**
     * 成员是否私有。
     */
    private: boolean;

    /**
     * 成员是否保护。
     */
    protected: boolean;

    /**
     * 成员是否抽象。
     */
    abstract: boolean;

    /**
     * 成员是否异步。
     */
    async: boolean;

    /**
     * 成员是否常量。
     */
    const: boolean;

    /**
     * 所属源文件。
     */
    sourceFile?: string;

    /**
     * 源文件行号(从 0 开始)。
     */
    sourceLine?: number;

    /**
     * 源文件列号(从 0 开始)。
     */
    sourceColumn?: number;

    /**
     * 完整描述。
     */
    description?: string;

    /**
     * 示例。
     */
    examples?: string[];

    /**
     * 参考列表。
     */
    sees?: string[];

    /**
     * 其它自定义标签。
     */
    tags?: { [tagName: string]: string };

    toJSON() {
        return { memberType: this.memberType, ...(this as any) };
    }

}

/**
 * 表示一个字段。
 */
export class DocField extends DocMember {

    /**
     * 成员类型。
     */
    get memberType() { return "field"; }

    /**
     * 字段类型。
     */
    type: DocType;

}

/**
 * 表示一个方法。
 */
export class DocMethod extends DocMember {

    /**
     * 成员类型。
     */
    get memberType() { return "method"; }

    /**
     * 函数执行时 *this* 的类型。
     */
    thisType?: DocType;

    /**
     * 所有泛型的形参。
     */
    typeParameters?: DocTypeParameter[];

    /**
     * 所有形参。
     */
    parameters: DocParameter[] = [];

    /**
     * 返回值类型。
     */
    returnType: DocType;

    /**
     * 返回值描述。
     */
    returnSummary?: string;

}

/**
 * 表示一个形参。
 */
export class DocParameter extends DocEntry {

    /**
     * 参数类型。
     */
    type: DocType;

    /**
     * 是否是可选参数。
     */
    optional: boolean;

    /**
     * 是否是展开参数。
     */
    rest: boolean;

    /**
     * 默认值。
     */
    default?: string;

}

/**
 * 表示一个泛型的形参。
 */
export class DocTypeParameter extends DocEntry {

    /**
     * 默认类型。
     */
    default?: DocType;

    /**
     * 约束类型。
     */
    extends?: DocType;

}

/**
 * 表示一个容器。
 */
export abstract class DocMemberContainer extends DocMember {

    /**
     * 所有成员。
     */
    members: DocMember[];

    /**
     * 获取指定名称的成员。
     * @param name 要获取的名称。
     * @return 返回成员对象。
     */
    getMember(name: string) {
        return this.members.find(member => member.name == name);
    }

}

/**
 * 表示一个类。
 */
export class DocClass extends DocMemberContainer {

    /**
     * 成员类型。
     */
    get memberType() { return "class"; }

    /**
     * 原型成员。
     */
    prototypes: DocMember[];

    /**
     * 所有泛型的形参。
     */
    typeParameters?: DocTypeParameter[];

    /**
     * 继承类型。
     */
    extends?: DocType;

    /**
     * 实现类型。
     */
    implements?: DocType[];

}

/**
 * 表示一个接口。
 */
export class DocInterface extends DocMemberContainer {

    /**
     * 成员类型。
     */
    get memberType() { return "interface"; }

    /**
     * 所有泛型的形参。
     */
    typeParameters?: DocTypeParameter[];

    /**
     * 继承类型。
     */
    extends?: DocType[];

}

/**
 * 表示一个命名空间。
 */
export class DocNamespace extends DocMemberContainer {

    /**
     * 成员类型。
     */
    get memberType() { return "namespace"; }

}

/**
 * 表示一个枚举。
 */
export class DocEnum extends DocMemberContainer {

    /**
     * 成员类型。
     */
    get memberType() { return "enum"; }

    /**
     * 所有成员。
     */
    members: DocEnumMember[];

}

/**
 * 表示一个枚举字段。
 */
export class DocEnumMember extends DocMember {

    /**
     * 成员类型。
     */
    get memberType() { return "enumMember"; }

    /**
     * 枚举字段值。
     */
    value: number;

}

/**
 * 表示一个类型别名。
 */
export class DocTypeAlias extends DocMember {

    /**
     * 成员类型。
     */
    get memberType() { return "type"; }

    /**
     * 值类型。
     */
    type: DocType;

}

/**
 * 表示一个类型。
 */
export class DocType {

    /**
     * 类型各组成部分。
     */
    parts: (string | boolean | DocSymbol)[] = [];

    toString() {
        let result = "";
        for (const part of this.parts) {
            result += typeof part == "string" ? part : typeof part == "boolean" ? "" : part.name;
        }
        return result;
    }

}

/**
 * 表示一个符号。
 */
export interface DocSymbol {

    /**
     * 父符号。
     */
    parent?: DocSymbol;

    /**
     * 所属源文件。
     */
    sourceFile: string;

    /**
     * 符号名。
     */
    name: string;

}

/**
 * 表示一个源文件。
 */
export class DocSourceFile extends DocEntry {

    /**
     * 判断当前源文件是否是一个标准模块。
     */
    isCommonJsModule: boolean;

    /**
     * 作者。
     */
    author?: string;

    /**
     * 版本号。
     */
    version?: string;

    /**
     * 协议。
     */
    license?: string;

    /**
     * 所有成员项。
     */
    members: DocMember[] = [];

    /**
     * 当前模块的导入项。
     * 如果值为 true 说明是 import 导入，否则为引用。
     */
    imports: { [key: string]: boolean; } = { __proto__: null };

    /**
     * 当前模块的导出项。
     * 键表示导出的名称；值表示成员的实际名称。
     */
    exports: { [key: string]: string; } = { __proto__: null };

}

/**
 * 表示一个文档对象。
 */
export class DocProject {

    /**
     * 所有源文件。
     */
    sourceFiles: DocSourceFile[] = [];

    /**
     * 获取指定文件。
     * @param sourceFile 要获取的文件名。
     * @return 返回文件对象。
     */
    getSourceFile(sourceFile: string) {
        return this.sourceFiles.find(file => file.name == sourceFile);
    }

}

/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
export function parseProgram(program: ts.Program, sourceFiles: ts.SourceFile[]) {
    const checker = program.getTypeChecker();
    const result = new DocProject();
    for (const sourceFile of sourceFiles) {
        result.sourceFiles.push(parseSouceFile(sourceFile));
    }
    return result;

    function parseSouceFile(sourceFile: ts.SourceFile) {
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
            for (const importDeclaration of (sourceFile as any).imports) {
                result.imports[importDeclaration.text] = true;
            }
            for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile))) {
                const member = parseSymbol(symbol);
                if (member) {
                    result.exports[symbol.name] = member.name;
                    result.members.push(member);
                }
            }
        } else {
            for (const statement of sourceFile.statements) {
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (const declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                            result.members.push(parseSymbol(checker.getSymbolAtLocation(declaration.name)));
                        }
                        break;
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.EnumDeclaration:
                    case ts.SyntaxKind.TypeAliasDeclaration:
                        result.members.push(parseSymbol(checker.getSymbolAtLocation((statement as ts.DeclarationStatement).name)));
                        break;
                }
            }
        }
        return result;
    }

    function parseSymbol(symbol: ts.Symbol) {
        let result: DocField | DocMethod | DocClass | DocInterface | DocEnum | DocEnumMember | DocTypeAlias | DocNamespace;
        const tags = symbol.getJsDocTags();
        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property | ts.SymbolFlags.Accessor) && !(symbol.flags & ts.SymbolFlags.Prototype)) {
            result = new DocField();
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
        } else if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor)) {
            result = new DocMethod();
            const signature = checker.getSignatureFromDeclaration(symbol.getDeclarations()[0] as ts.SignatureDeclaration);
            if (signature.typeParameters) {
                result.typeParameters = parseTypeParameters(signature.typeParameters);
            }
            const thisParameterSymbol = (signature as any).thisParameter as ts.Symbol;
            if (thisParameterSymbol) {
                result.thisType = parseType(checker.getTypeOfSymbolAtLocation(thisParameterSymbol, thisParameterSymbol.valueDeclaration));
            }
            for (const parameterSymbol of signature.getParameters()) {
                const paramNode = parameterSymbol.valueDeclaration as ts.ParameterDeclaration;
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
            const returnDoc = (ts as any).getJSDocReturnTag(symbol.valueDeclaration);
            if (returnDoc) {
                result.returnSummary = returnDoc.comment;
            }
        } else if (symbol.flags & ts.SymbolFlags.Class) {
            result = new DocClass();
            const type = checker.getDeclaredTypeOfSymbol(symbol) as ts.InterfaceType;
            if (type.typeParameters) {
                (result as DocClass).typeParameters = parseTypeParameters(type.typeParameters);
            }
            result.members = parseSymbolList(symbol.exports);
            (result as DocClass).prototypes = parseSymbolList(symbol.members);
        } else if (symbol.flags & ts.SymbolFlags.Interface) {
            result = new DocInterface();
            const type = checker.getDeclaredTypeOfSymbol(symbol) as ts.InterfaceType;
            if (type.typeParameters) {
                (result as DocInterface).typeParameters = parseTypeParameters(type.typeParameters);
            }
            result.members = parseSymbolList(symbol.members);
        } else if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            result = new DocEnum();
            result.members = parseSymbolList(symbol.exports) as DocEnumMember[];
            let value = 0;
            for (const member of (result as DocEnum).members) {
                if (member.value != null) {
                    value = member.value;
                } else {
                    member.value = value++;
                }
            }
        } else if (symbol.flags & ts.SymbolFlags.EnumMember) {
            result = new DocEnumMember();
            if ((symbol.valueDeclaration as ts.EnumMember).initializer) {
                result.value = +(symbol.valueDeclaration as ts.EnumMember).initializer.getText();
            }
        } else if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            result = new DocTypeAlias();
            result.type = parseType(checker.getDeclaredTypeOfSymbol(symbol));
        } else if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule | ts.SymbolFlags.ExportNamespace)) {
            result = new DocNamespace();
            result.members = parseSymbolList(symbol.exports);
        } else {
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

    function parseSymbolList(list?: ts.Map<ts.Symbol>, ignoreMembers?: string[]) {
        const result: DocMember[] = [];
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

    function parseTypeParameters(typeParameters: ts.TypeParameter[]) {
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

    function parseType(type: ts.Type) {
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

                function symbolToType(symbol: ts.Symbol) {
                    const result: DocSymbol = {
                        name: getSymbolName(symbol),
                        sourceFile: symbol.getDeclarations() && symbol.getDeclarations()[0] && symbol.getDeclarations()[0].getSourceFile().fileName
                    };
                    if ((symbol as any).parent) {
                        result.parent = symbolToType((symbol as any).parent);
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

    function getSymbolName(symbol: ts.Symbol) {
        return symbol.valueDeclaration && ts.getNameOfDeclaration(symbol.valueDeclaration) && ts.getNameOfDeclaration(symbol.valueDeclaration).getText() || symbol.getName();
    }

    function getJSDoc(node: ts.Node) {
        const jsDocRanges = ts.getLeadingCommentRanges(node.getSourceFile().text, node.pos);
        if (jsDocRanges && jsDocRanges.length) {
            const jsDocRange = jsDocRanges[0];
            const rootJsDoc = (ts as any).parseIsolatedJSDocComment(node.getSourceFile().text, jsDocRange.pos, jsDocRange.end - jsDocRange.pos);
            if (rootJsDoc && rootJsDoc.jsDoc) {
                return rootJsDoc.jsDoc as ts.JSDoc;
            }
        }
    }

}

/**
 * 解析指定的源码。
 * @param paths 要解析的路径。
 * @return 返回已解析的文档对象。
 */
export default function parseDoc(...paths: string[]) {
    const program = ts.createProgram(paths, {});
    return parseProgram(program, program.getSourceFiles().filter(x => !x.isDeclarationFile));
}
