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
     * 返回所属类型。
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
    tags?: {
        [tagName: string]: string;
    };
}
/**
 * 表示一个变量、字段或访问器。
 */
export interface DocProperty extends DocMember {
    /**
     * 成员类型。
     */
    memberType: "variable" | "field" | "accessor" | "enumMember";
    /**
     * 字段可空。
     */
    optional?: boolean;
    /**
     * 字段是常量的
     */
    const?: boolean;
    /**
     * 字段是只读的。
     */
    readOnly?: boolean;
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
    memberType: "function" | "method" | "constructor" | "indexer";
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
     * 枚举是只读的。
     */
    const?: boolean;
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
export declare type DocType = DocTypePart[];
/**
 * 表示一个类型组成部分。
 */
export interface DocTypePart {
    /**
     * 当前部分的类型。
     */
    type: "keyword" | "space" | "indent" | "unindent" | "line" | "symbol" | "punctuation" | "operator" | "string" | "name";
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
export default function parseDoc(...paths: string[]): {
    sourceFiles: any[];
};
/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
export declare function parseProgram(program: ts.Program, sourceFiles: ts.SourceFile[]): {
    sourceFiles: any[];
};
/**
 * 重新整理归类所有成员。
 * @param members 要处理的成员。
 * @param publicOnly 是否删除内部成员。
 * @param docOnly 是否删除未编写文档的成员。
 * @return 返回已整理的成员。
 */
export declare function sort(members: DocMember[], publicOnly?: boolean, docOnly?: boolean): DocNamespaceSorted[];
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
    propteries?: Map<string, DocProperty | DocMethod>;
    /**
     * 所有方法。
     */
    methods?: Map<string, DocMethod>;
}
/**
 * 获取类型的名称。
 * @param type 类型。
 * @return 返回对应的字符串。
 */
export declare function typeToString(type: DocType): string;
/**
 * 精简类型表达式。
 * @param type 类型。
 * @return 返回精简的类型。
 */
export declare function toSimpleType(type: DocType): DocTypePart[];
