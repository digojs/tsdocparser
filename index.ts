import * as ts from "typescript";

/**
 * 表示一个文档节点。
 */
export interface DocNode {

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
export interface DocMember extends DocNode {

    /**
     * 成员类型。
     */
    memberType: DocField["memberType"] | DocMethod["memberType"] | DocClass["memberType"] | DocEnum["memberType"] | DocEnumMember["memberType"] | DocTypeAlias["memberType"] | DocNamespace["memberType"];

    /**
     * 成员的导出名。
     */
    exportName?: string;

    /**
     * 如果成员是继承的，则返回所属类型。
     */
    parent?: DocType;

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
     * 成员是内部的。
     */
    internal?: boolean;

    /**
     * 成员是保护的。
     */
    protected?: boolean;

    /**
     * 成员是私有的。
     */
    private?: boolean;

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

}

/**
 * 表示一个字段。
 */
export interface DocField extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "field" | "accessor";

    /**
     * 字段类型。
     */
    type?: DocType;

    /**
     * 字段是只读的。
     */
    readonly?: boolean;

    /**
     * 字段是常量的
     */
    const?: boolean;

    /**
     * 默认值表达式。
     */
    default?: string;

}

/**
 * 表示一个方法。
 */
export interface DocMethod extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "method" | "constructor";

    /**
     * 方法是生成器。
     */
    generator?: boolean;

    /**
     * 方法是异步的
     */
    async?: boolean;

    /**
     * 方法是抽象的。
     */
    abstract?: boolean;

    /**
     * 所有泛型的形参。
     */
    typeParameters?: DocTypeParameter[];

    /**
     * 函数执行时 *this* 的类型。
     */
    thisType?: DocType;

    /**
     * 所有形参。
     */
    parameters: DocParameter[];

    /**
     * 返回值类型。
     */
    returnType: DocType;

    /**
     * 返回值描述。
     */
    returnSummary?: string;

    /**
     * 方法的多个重载。
     */
    overloads?: DocMethod[];

}

/**
 * 表示一个泛型形参。
 */
export interface DocTypeParameter extends DocNode {

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
 * 表示一个形参。
 */
export interface DocParameter extends DocNode {

    /**
     * 参数类型。
     */
    type: DocType;

    /**
     * 是否是可选参数。
     */
    optional?: boolean;

    /**
     * 是否是展开参数。
     */
    rest?: boolean;

    /**
     * 默认值。
     */
    default?: string;

}

/**
 * 表示一个成员容器。
 */
export interface DocMemberContainer {

    /**
     * 所有字段和访问器。
     */
    fields?: DocField[];

    /**
     * 所有方法。
     */
    methods?: DocMethod[];

    /**
     * 所有类型。
     */
    types?: DocMember[];

}

/**
 * 表示一个命名空间。
 */
export interface DocNamespace extends DocMember, DocMemberContainer {

    /**
     * 成员类型。
     */
    memberType: "namespace";

}

/**
 * 表示一个类类型。
 */
export interface DocClassLike extends DocMember, DocMemberContainer {

}

/**
 * 表示一个类或接口。
 */
export interface DocClass extends DocClassLike {

    /**
     * 成员类型。
     */
    memberType: "class" | "interface";

    /**
     * 所有泛型的形参。
     */
    typeParameters?: DocTypeParameter[];

    /**
     * 所有成员。
     */
    prototype: DocMemberContainer;

    /**
     * 所有构造函数。
     */
    constructors?: DocMethod[];

    /**
     * 继承类型。
     */
    extends?: DocType[];

    /**
     * 实现类型。
     */
    implements?: DocType[];

}

/**
 * 表示一个枚举。
 */
export interface DocEnum extends DocMember, DocMemberContainer {

    /**
     * 成员类型。
     */
    memberType: "enum";

}

/**
 * 表示一个枚举字段。
 */
export interface DocEnumMember extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "enumMember";

    /**
     * 枚举字段值。
     */
    value: number | string;

}

/**
 * 表示一个类型别名。
 */
export interface DocTypeAlias extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "type";

    /**
     * 值类型。
     */
    type: DocType;

}

/**
 * 表示一个类型。
 */
export type DocType = (string | boolean | DocTypeSymbol)[];

/**
 * 表示一个类型符号。
 */
export interface DocTypeSymbol {

    /**
     * 父符号。
     */
    parent?: DocTypeSymbol;

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
export interface DocSourceFile extends DocNode, DocMemberContainer {

    /**
     * 判断当前源文件是否是一个标准模块。
     */
    commonJsModule?: boolean;

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
     * 所有导入项。
     */
    imports?: DocImport[];

}

/**
 * 表示一个导入项。
 */
export interface DocImport {

    /**
     * 导入的名称。
     */
    name: string;

    /**
     * 是否是引入。
     */
    reference?: boolean;

}

/**
 * 表示一个文档对象。
 */
export interface DocProject {

    /**
     * 所有源文件。
     */
    sourceFiles: DocSourceFile[];

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

/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
export function parseProgram(program: ts.Program, sourceFiles: ts.SourceFile[]) {
    const checker = program.getTypeChecker();
    const result = {
        sourceFiles: []
    };
    for (const sourceFile of sourceFiles) {
        result.sourceFiles.push(parseSouceFile(sourceFile));
    }
    return result;

    function parseSouceFile(sourceFile: ts.SourceFile) {
        const result: DocSourceFile = {
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
            for (const importDeclaration of (sourceFile as any).imports) {
                result.imports = result.imports || [];
                result.imports.push({
                    name: importDeclaration.text
                });
            }

            for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile))) {
                const member = parseMember(symbol);
                if (member) {
                    member.exportName = symbol.name;
                    addMember(result, member);
                }
            }
        } else {
            for (const statement of sourceFile.statements) {
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (const declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                            addMember(result, parseMember(checker.getSymbolAtLocation(declaration.name)));
                        }
                        break;
                    case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                    case ts.SyntaxKind.InterfaceDeclaration:
                    case ts.SyntaxKind.EnumDeclaration:
                    case ts.SyntaxKind.TypeAliasDeclaration:
                        addMember(result, parseMember(checker.getSymbolAtLocation((statement as ts.DeclarationStatement).name)));
                        break;
                }
            }
        }

        return result;
    }

    function addMember(container: DocMemberContainer, member: DocMember) {
        if (member) {
            const key = member.memberType === "field" || member.memberType === "accessor" || member.memberType === "enumMember" ? "fields" : member.memberType === "method" || member.memberType === "constructor" ? "method" : "type";
            container[key] = container[key] || [];
            container[key].push(member);
        }
    }

    function parseMember(symbol: ts.Symbol) {
        if ((symbol as any)._docMember) {
            return (symbol as any)._docMember as DocMember;
        }

        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property)) {
            if (symbol.flags & ts.SymbolFlags.Prototype) {
                return null;
            }

            const declaration = symbol.valueDeclaration as ts.VariableDeclaration;
            const result = createMember<DocField>("field", symbol, declaration);
            if ((ts as any).isConst(declaration)) {
                result.const = true;
            }
            if (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) {
                result.readonly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, declaration));
            if (declaration.initializer) {
                result.default = declaration.initializer.getText();
            }
            return result;
        }

        if (symbol.flags & ts.SymbolFlags.Accessor) {
            const result = createMember<DocField>("accessor", symbol);
            if (!(symbol.flags & ts.SymbolFlags.SetAccessor)) {
                result.readonly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, getDeclaration(symbol)));
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor)) {
            const declarations = symbol.getDeclarations();
            const mainDeclaration = declarations.find(declaration => !!(declaration as ts.MethodDeclaration).body);
            const memberType = symbol.flags & ts.SymbolFlags.Constructor ? "constructor" : "method";
            const result = createMember<DocMethod>(memberType, symbol, mainDeclaration);
            for (const declaration of declarations) {
                const signature = checker.getSignatureFromDeclaration(declaration as ts.SignatureDeclaration);
                let method: DocMethod;
                if (declaration === mainDeclaration) {
                    method = result;
                } else {
                    method = createMember<DocMethod>(memberType, signature, declaration);
                    result.overloads = result.overloads || [];
                    result.overloads.push(method);
                }
                if ((declaration as ts.MethodDeclaration).asteriskToken) {
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
                const thisParameterSymbol = (signature as any).thisParameter as ts.Symbol;
                if (thisParameterSymbol) {
                    method.thisType = parseType(checker.getTypeOfSymbolAtLocation(thisParameterSymbol, thisParameterSymbol.valueDeclaration));
                }
                method.parameters = [];
                for (const parameterSymbol of signature.getParameters()) {
                    const paramNode = parameterSymbol.valueDeclaration as ts.ParameterDeclaration;
                    const p: DocParameter = {
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
                    method.parameters.push(p);
                }
                method.returnType = parseType(signature.getReturnType());
                if (symbol.valueDeclaration) {
                    const returnDoc = (ts as any).getJSDocReturnTag(symbol.valueDeclaration);
                    if (returnDoc) {
                        method.returnSummary = returnDoc.comment;
                    }
                }
            }
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
            const result = createMember<DocClass>(symbol.flags & ts.SymbolFlags.Class ? "class" : "interface", symbol);
            const type = checker.getDeclaredTypeOfSymbol(symbol) as ts.InterfaceType;
            if (type.typeParameters) {
                result.typeParameters = parseTypeParameters(type.typeParameters);
            }

            for (const baseType of checker.getBaseTypes(type)) {
                result.extends = result.extends || [];
                result.extends.push(parseType(baseType));
            }

            const implementTypes = symbol.valueDeclaration && (ts as any).getClassImplementsHeritageClauseElements(symbol.valueDeclaration) as ts.ExpressionWithTypeArguments[];
            if (implementTypes) {
                result.implements = [];
                for (const implementType of implementTypes) {
                    result.implements.push(parseType(checker.getTypeAtLocation(implementType.expression)));
                }
            }

            if (symbol.exports) {
                symbol.exports.forEach((symbol, key) => {
                    const member = parseMember(symbol);
                    if (member) {
                        addMember(result, member);
                    }
                });
            }

            result.prototype = {};
            for (const property of checker.getPropertiesOfType(type)) {
                const member = parseMember(property);
                if (member) {
                    if ((property as any).parent !== symbol) {
                        member.parent = parseType(checker.getDeclaredTypeOfSymbol((property as any).parent));
                    }
                    addMember(result.prototype, member);
                }
            }
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            const result = createMember<DocEnum>("enum", symbol);

            let value: string | number = -1;
            symbol.exports.forEach((symbol, key) => {
                const member = parseMember(symbol) as DocEnumMember;
                if (member) {
                    if (member.value != null) {
                        value = member.value;
                    } else {
                        member.value = typeof value === "number" ? ++value : member.name;
                    }
                    addMember(result, member);
                }
            });
            return result;
        }

        if (symbol.flags & ts.SymbolFlags.EnumMember) {
            const result = createMember<DocEnumMember>("enumMember", symbol);
            if ((symbol.valueDeclaration as ts.EnumMember).initializer) {
                result.value = +(symbol.valueDeclaration as ts.EnumMember).initializer.getText();
            }
            return result;
        }

        if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            const result = createMember<DocTypeAlias>("type", symbol);
            result.type = parseType(checker.getDeclaredTypeOfSymbol(symbol));
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule | ts.SymbolFlags.ExportNamespace)) {
            const result = createMember<DocNamespace>("namespace", symbol);
            if (symbol.exports) {
                symbol.exports.forEach((symbol, key) => {
                    addMember(result, parseMember(symbol));
                });
            }
            return result;
        }

        return null;
    }

    function createMember<T extends DocMember>(memberType: T["memberType"], symbol: ts.Symbol | ts.Signature, declaration = getDeclaration(symbol as ts.Symbol)) {
        const result: DocMember = (symbol as any)._docMember = {
            memberType: memberType,
            name: getSymbolName(symbol, declaration)
        };

        const modifierFlags = ts.getCombinedModifierFlags(declaration);
        if (modifierFlags & ts.ModifierFlags.Private) {
            result.private = true;
        }
        if (modifierFlags & ts.ModifierFlags.Protected) {
            result.protected = true;
        }

        result.summary = ts.displayPartsToString(symbol.getDocumentationComment());
        for (const tag of symbol.getJsDocTags()) {
            switch (tag.name) {
                case "desc":
                case "description":
                case "remark":
                    if (result.description) {
                        result.description += "\n" + tag.text;
                    } else {
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
                    } else {
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
        return result as T;
    }

    function parseTypeParameters(typeParameters: ts.TypeParameter[]) {
        const result: DocTypeParameter[] = [];
        for (const typeParameter of typeParameters) {
            const tp: DocTypeParameter = {
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

    function parseType(type: ts.Type) {
        if ((type as any)._docMember) {
            return (type as any)._docMember as DocType;
        }
        const result = (type as any)._docMember = [] as DocType;
        const builder = checker.getSymbolDisplayBuilder();
        const writer = {
            writeKeyword(text) {
                result.push(text);
            },
            writeOperator(text) {
                result.push(text);
            },
            writePunctuation(text) {
                result.push(text);
            },
            writeSpace(text) {
                result.push(text);
            },
            writeStringLiteral(text) {
                result.push(text);
            },
            writeParameter(text) {
                result.push(text);
            },
            writeProperty(text) {
                result.push(text);
            },
            writeSymbol(text, symbol) {
                result.push(symbolToType(symbol));

                function symbolToType(symbol: ts.Symbol) {
                    if (symbol.flags === ts.SymbolFlags.ValueModule) {
                        return null;
                    }
                    const declaration = getDeclaration(symbol);
                    const result: DocTypeSymbol = {
                        name: getSymbolName(symbol, declaration),
                        sourceFile: declaration && declaration.getSourceFile().fileName
                    };
                    if ((symbol as any).parent) {
                        result.parent = symbolToType((symbol as any).parent);
                    }
                    return result;
                }
            },
            writeLine() {
                result.push("\n");
            },
            increaseIndent() {
                result.push(true);
            },
            decreaseIndent() {
                result.push(false);
            },
            clear() {
                result.length = 0;
            },
            trackSymbol() { },
            reportInaccessibleThisError() { },
            reportPrivateInBaseOfClassExpression() { }
        };
        builder.buildTypeDisplay(type, writer, null, ts.TypeFormatFlags.UseTypeAliasValue | ts.TypeFormatFlags.WriteArrowStyleSignature | ts.TypeFormatFlags.WriteClassExpressionAsTypeLiteral);
        return result;
    }
}

/**
 * 获取类型的名称。
 * @param type 类型。
 * @return 返回对应的字符串。
 */
export function typeToString(type: DocType) {
    let result = "";
    for (const part of type) {
        result += typeof part == "string" ? part : typeof part == "boolean" ? "" : part.name;
    }
    return result;
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

function getDeclaration(symbol: ts.Symbol) {
    return symbol.valueDeclaration || symbol.getDeclarations() && symbol.getDeclarations()[symbol.getDeclarations().length - 1];
}

function getSymbolName(symbol: ts.Symbol | ts.Signature, declaration: ts.Declaration) {
    const name = declaration && ts.getNameOfDeclaration(declaration);
    return name ? name.getText() : (symbol as ts.Symbol).getName ? (symbol as ts.Symbol).getName() : (symbol as ts.Symbol).name;
}

console.log(JSON.stringify(parseDoc(__dirname + "/test/fixture.ts").sourceFiles[1].members, undefined, 2));