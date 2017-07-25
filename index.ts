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
    memberType: string;

    /**
     * 成员的导出名。
     */
    exportName?: string;

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
     * 源文件结束行号(从 0 开始)。
     */
    sourceEndLine?: number;

    /**
     * 源文件结束列号(从 0 开始)。
     */
    sourceEndColumn?: number;

    /**
     * 当前成员的子成员。
     */
    members?: DocMember[];

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
 * 表示一个变量、字段或访问器。
 */
export interface DocProperty extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "field" | "accessor" | "enumMember";

    /**
     * 字段是常量的
     */
    const?: boolean;

    /**
     * 字段是只读的。
     */
    readonly?: boolean;

    /**
     * 字段类型。
     */
    type?: DocType;

    /**
     * 默认值表达式。
     */
    default?: string;

}

/**
 * 表示一个函数、方法、构造函数或索引器。
 */
export interface DocMethod extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "method" | "constructor" | "indexer";

    /**
     * 方法的多个重载。
     */
    overloads?: DocMethod[];

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
 * 表示一个类或接口。
 */
export interface DocClass extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "class" | "interface";

    /**
     * 所有泛型的形参。
     */
    typeParameters?: DocTypeParameter[];

    /**
     * 继承类型。
     */
    extends?: DocType[];

    /**
     * 实现类型。
     */
    implements?: DocType[];

    /**
     * 构造函数。
     */
    constructor?: DocMethod;

    /**
     * 索引器。
     */
    indexer?: DocMethod;

    /**
     * 所有原型成员。
     */
    prototypes?: DocMember[];

    /**
     * 所有继承的原型成员。
     */
    extendedPototypes?: DocMember[];

}

/**
 * 表示一个枚举。
 */
export interface DocEnum extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "enum";

    /**
     * 当前成员的子成员。
     */
    members?: DocProperty[];

}

/**
 * 表示一个命名空间。
 */
export interface DocNamespace extends DocMember {

    /**
     * 成员类型。
     */
    memberType: "namespace";

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
export type DocType = DocTypePart[];

/**
 * 表示一个类型组成部分。
 */
export interface DocTypePart {

    /**
     * 当前部分的类型。
     */
    type: string;

    /**
     * 文本内容。
     */
    text: string;

    /**
     * 所属源文件。
     */
    sourceFile?: string;

}

/**
 * 表示一个源文件。
 */
export interface DocSourceFile extends DocNode {

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
     * 判断当前源文件是否是一个标准模块。
     */
    commonJsModule?: boolean;

    /**
     * 所有导入项。
     */
    imports?: DocImport[];

    /**
     * 当前成员的子成员。
     */
    members?: DocMember[];

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
    const builder = checker.getSymbolDisplayBuilder();
    const result = {
        sourceFiles: []
    };
    for (const sourceFile of sourceFiles) {
        result.sourceFiles.push(parseSouceFile(sourceFile));
    }
    return result;

    function parseSouceFile(sourceFile: ts.SourceFile) {
        if ((sourceFile as any)._docMember) {
            return (sourceFile as any)._docMember as DocSourceFile;
        }

        const result: DocSourceFile = (sourceFile as any)._docMember = {
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

    function parseMember(symbol: ts.Symbol) {
        if ((symbol as any)._docMember) {
            return (symbol as any)._docMember as DocMember;
        }

        if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor | ts.SymbolFlags.Signature)) {
            const declarations = symbol.getDeclarations();
            const mainDeclaration = declarations.find(declaration => !!(declaration as ts.MethodDeclaration).body) || declarations[0];
            const result = createMember<DocMethod>(symbol.flags & ts.SymbolFlags.Constructor ? "constructor" : symbol.flags & ts.SymbolFlags.Signature ? "indexer" : "method", symbol, mainDeclaration);
            for (const declaration of declarations) {
                if (declaration.flags & ts.NodeFlags.Namespace) {
                    continue;
                }
                const signature = checker.getSignatureFromDeclaration(declaration as ts.SignatureDeclaration);
                let method: DocMethod;
                if (declaration === mainDeclaration) {
                    method = result;
                } else {
                    method = createMember<DocMethod>(result.memberType, signature, declaration);
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
                const returnDoc = (ts as any).getJSDocReturnTag(declaration);
                if (returnDoc) {
                    method.returnSummary = returnDoc.comment;
                }
            }
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property)) {
            if (symbol.flags & ts.SymbolFlags.Prototype) {
                return null;
            }

            const declaration = symbol.valueDeclaration as ts.VariableDeclaration;
            const result = createMember<DocProperty>("field", symbol, declaration);
            if ((ts as any).isConst(declaration)) {
                result.const = true;
            }
            if (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) {
                result.readonly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, declaration));
            if (result.tags && result.tags.default) {
                result.default = result.tags.default;
                delete result.tags.default;
            } else if (declaration.initializer) {
                result.default = declaration.initializer.getText();
            }
            return result;
        }

        if (symbol.flags & ts.SymbolFlags.Accessor) {
            const result = createMember<DocProperty>("accessor", symbol);
            if (!(symbol.flags & ts.SymbolFlags.SetAccessor)) {
                result.readonly = true;
            }
            result.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, getDeclaration(symbol)));
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
                for (const implementType of implementTypes) {
                    result.implements = result.implements || [];
                    result.implements.push(parseType(checker.getTypeAtLocation(implementType.expression)));
                }
            }

            const constructor = symbol.members.get("__constructor");
            if (constructor) {
                result.constructor = parseMember(constructor) as DocMethod;
            }

            const index = symbol.members.get("__index");
            if (index) {
                result.indexer = parseMember(index) as DocMethod;
            }

            for (const childSymbol of checker.getPropertiesOfType(type)) {
                const member = parseMember(childSymbol);
                if (member) {
                    if ((childSymbol as any).parent as ts.Symbol === symbol) {
                        result.prototypes = result.prototypes || [];
                        result.prototypes.push(member);
                    } else {
                        result.extendedPototypes = result.extendedPototypes || [];
                        result.extendedPototypes.push(member);
                    }
                }
            }
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            const result = createMember<DocEnum>("enum", symbol);

            let lastValue = -1;
            for (const member of result.members) {
                if (member.default == null) {
                    member.default = (++lastValue).toString();
                } else {
                    lastValue = +member.default || lastValue;
                }
            }
            return result;
        }

        if (symbol.flags & ts.SymbolFlags.EnumMember) {
            const result = createMember<DocProperty>("enumMember", symbol);
            if ((symbol.valueDeclaration as ts.EnumMember).initializer) {
                result.default = (symbol.valueDeclaration as ts.EnumMember).initializer.getText();
            }
            return result;
        }

        if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule | ts.SymbolFlags.ExportNamespace)) {
            return createMember<DocNamespace>("namespace", symbol);
        }

        if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            const result = createMember<DocTypeAlias>("type", symbol);
            result.type = parseType(checker.getDeclaredTypeOfSymbol(symbol));
            return result;
        }

        return null;
    }

    function createMember<T extends DocMember>(memberType: T["memberType"], symbol: ts.Symbol | ts.Signature, declaration = getDeclaration(symbol as ts.Symbol)) {
        const result: DocMember = (symbol as any)._docMember = {
            memberType: memberType,
            name: getSymbolName(symbol, declaration)
        };

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

        const parentSymbol = (symbol as any).parent as ts.Symbol;
        if (parentSymbol && (parentSymbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface))) {
            result.parent = parseType(checker.getDeclaredTypeOfSymbol(parentSymbol));
        }
        if ((symbol as ts.Symbol).exports) {
            (symbol as ts.Symbol).exports.forEach((symbol, key) => {
                addMember(result, parseMember(symbol));
            });
        }

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
                    type: "parameter",
                    text: text
                });
            },
            writeProperty(text) {
                result.push({
                    type: "property",
                    text: text
                });
            },
            writeSymbol(text, symbol) {
                writeSymbol(symbol);

                function writeSymbol(symbol: ts.Symbol) {
                    if ((symbol as any).parent && (symbol as any).parent.flags !== ts.SymbolFlags.ValueModule) {
                        writeSymbol((symbol as any).parent);
                        result.push({
                            type: "punctuation",
                            text: "."
                        });
                    }
                    const declaration = getDeclaration(symbol);
                    result.push({
                        type: "symbol",
                        text: getSymbolName(symbol, declaration),
                        sourceFile: declaration && declaration.getSourceFile().fileName
                    });
                }
            },
            writeLine() {
                result.push({
                    type: "space",
                    text: "\n"
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

    function addMember(container: DocMember | DocSourceFile, member: DocMember) {
        if (member) {
            container.members = container.members || [];
            container.members.push(member);
        }
    }
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

/**
 * 获取类型的名称。
 * @param type 类型。
 * @return 返回对应的字符串。
 */
export function typeToString(type: DocType) {
    let result = "";
    for (const part of type) {
        result += part.text;
    }
    return result;
}

/**
 * 重新整理归类所有成员。
 * @param members 要处理的成员。
 * @param publicOnly 是否删除内部成员。
 * @return 返回已整理的成员。
 */
export function sort(members: DocMember[], publicOnly?: boolean) {
    const global: DocNamespaceSorted = {
        name: "",
        propteries: new Map(),
        methods: new Map()
    };
    const types: DocNamespaceSorted[] = [global];
    for (const member of members) {
        addMember(global, member, "");
    }
    if (!global.propteries.size && !global.methods.size) {
        types.shift();
    }
    return types;

    function addMember(container: DocNamespaceSorted, member: DocMember, prefix: string) {
        if (publicOnly && (member.private || member.internal)) {
            return;
        }
        const name = prefix + member.name;
        switch (member.memberType) {
            case "field":
            case "accessor":
            case "enumMember":
                container.propteries.set(name, member as DocProperty);
                break;
            case "method":
                container.methods.set(name, member as DocMethod);
                break;
            case "class":
            case "interface":
            case "enum":
                container = {
                    name: name,
                    member: member as DocClass | DocEnum,
                    propteries: new Map(),
                    methods: new Map()
                };
                types.push(container);
                if ((member as DocClass).constructor) {
                    container.methods.set(`new ${name}`, (member as DocClass).constructor);
                }
                if ((member as DocClass).indexer) {
                    container.methods.set(`[]`, (member as DocClass).indexer);
                }
                if ((member as DocClass).prototypes) {
                    for (const child of (member as DocClass).prototypes) {
                        addMember(container, child, "");
                    }
                }
                if ((member as DocClass).extendedPototypes) {
                    for (const child of (member as DocClass).extendedPototypes) {
                        addMember(container, child, "");
                    }
                }
                break;
            case "type":
                container = {
                    name: name,
                    member: member as DocTypeAlias,
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

/**
 * 表示整理后的命名空间。
 */
export interface DocNamespaceSorted {

    /**
     * 模块名。
     */
    name: string;

    /**
     * 当前命名空间所属类。
     */
    member?: DocClass | DocEnum | DocTypeAlias;

    /**
     * 所有属性。
     */
    propteries?: Map<string, DocProperty>;

    /**
     * 所有方法。
     */
    methods?: Map<string, DocMethod>;

}
