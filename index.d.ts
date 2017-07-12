import * as ts from "typescript";
/**
 * 表示一个文档项。
 */
export declare abstract class DocEntry {
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
export declare abstract class DocMember extends DocEntry {
    /**
     * 成员类型。
     */
    readonly abstract memberType: string;
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
    tags?: {
        [tagName: string]: string;
    };
    toJSON(): any;
}
/**
 * 表示一个字段。
 */
export declare class DocField extends DocMember {
    /**
     * 成员类型。
     */
    readonly memberType: string;
    /**
     * 字段类型。
     */
    type: DocType;
}
/**
 * 表示一个方法。
 */
export declare class DocMethod extends DocMember {
    /**
     * 成员类型。
     */
    readonly memberType: string;
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
 * 表示一个形参。
 */
export declare class DocParameter extends DocEntry {
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
export declare class DocTypeParameter extends DocEntry {
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
export declare abstract class DocMemberContainer extends DocMember {
    /**
     * 所有成员。
     */
    members: DocMember[];
    /**
     * 获取指定名称的成员。
     * @param name 要获取的名称。
     * @return 返回成员对象。
     */
    getMember(name: string): DocMember;
}
/**
 * 表示一个类。
 */
export declare class DocClass extends DocMemberContainer {
    /**
     * 成员类型。
     */
    readonly memberType: string;
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
export declare class DocInterface extends DocMemberContainer {
    /**
     * 成员类型。
     */
    readonly memberType: string;
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
export declare class DocNamespace extends DocMemberContainer {
    /**
     * 成员类型。
     */
    readonly memberType: string;
}
/**
 * 表示一个枚举。
 */
export declare class DocEnum extends DocMemberContainer {
    /**
     * 成员类型。
     */
    readonly memberType: string;
    /**
     * 所有成员。
     */
    members: DocEnumMember[];
}
/**
 * 表示一个枚举字段。
 */
export declare class DocEnumMember extends DocMember {
    /**
     * 成员类型。
     */
    readonly memberType: string;
    /**
     * 枚举字段值。
     */
    value: number;
}
/**
 * 表示一个类型别名。
 */
export declare class DocTypeAlias extends DocMember {
    /**
     * 成员类型。
     */
    readonly memberType: string;
    /**
     * 值类型。
     */
    type: DocType;
}
/**
 * 表示一个类型。
 */
export declare class DocType {
    /**
     * 类型各组成部分。
     */
    parts: (string | boolean | DocSymbol)[];
    toString(): string;
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
export declare class DocSourceFile extends DocEntry {
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
    members: DocMember[];
    /**
     * 当前模块的导入项。
     * 如果值为 true 说明是 import 导入，否则为引用。
     */
    imports: {
        [key: string]: boolean;
    };
    /**
     * 当前模块的导出项。
     * 键表示导出的名称；值表示成员的实际名称。
     */
    exports: {
        [key: string]: string;
    };
}
/**
 * 表示一个文档对象。
 */
export declare class DocProject {
    /**
     * 所有源文件。
     */
    sourceFiles: DocSourceFile[];
    /**
     * 获取指定文件。
     * @param sourceFile 要获取的文件名。
     * @return 返回文件对象。
     */
    getSourceFile(sourceFile: string): DocSourceFile;
}
/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
export declare function parseProgram(program: ts.Program, sourceFiles: ts.SourceFile[]): DocProject;
/**
 * 解析指定的源码。
 * @param paths 要解析的路径。
 * @return 返回已解析的文档对象。
 */
export default function parseDoc(...paths: string[]): DocProject;
