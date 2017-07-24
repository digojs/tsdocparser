"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var ts = require("typescript");
/**
 * 表示一个文档节点。
 */
var DocNode = (function () {
    function DocNode() {
    }
    return DocNode;
}());
exports.DocNode = DocNode;
/**
 * 表示一个成员。
 */
var DocMember = (function (_super) {
    __extends(DocMember, _super);
    function DocMember() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DocMember.prototype.toJSON = function () {
        return __assign({ memberType: this.memberType }, this, { accessibility: DocMemberAccessibility[this.accessibility || 0] });
    };
    return DocMember;
}(DocNode));
exports.DocMember = DocMember;
/**
 * 表示成员可访问性。
 */
var DocMemberAccessibility;
(function (DocMemberAccessibility) {
    /**
     * 成员是公开的。
     */
    DocMemberAccessibility[DocMemberAccessibility["public"] = 0] = "public";
    /**
     * 成员是内部的。
     */
    DocMemberAccessibility[DocMemberAccessibility["internal"] = 1] = "internal";
    /**
     * 成员是保护的。
     */
    DocMemberAccessibility[DocMemberAccessibility["protected"] = 2] = "protected";
    /**
     * 成员是私有的。
     */
    DocMemberAccessibility[DocMemberAccessibility["private"] = 4] = "private";
})(DocMemberAccessibility = exports.DocMemberAccessibility || (exports.DocMemberAccessibility = {}));
/**
 * 表示一个容器。
 */
var DocMemberContainer = (function (_super) {
    __extends(DocMemberContainer, _super);
    function DocMemberContainer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 获取指定名称的成员。
     * @param name 要获取的名称。
     * @return 返回成员对象。
     */
    DocMemberContainer.prototype.getMember = function (name) {
        return this.members.find(function (member) { return member.name == name; });
    };
    return DocMemberContainer;
}(DocMember));
exports.DocMemberContainer = DocMemberContainer;
/**
 * 表示一个属性。
 */
var DocProperty = (function (_super) {
    __extends(DocProperty, _super);
    function DocProperty() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocProperty.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "property"; },
        enumerable: true,
        configurable: true
    });
    return DocProperty;
}(DocMember));
exports.DocProperty = DocProperty;
/**
 * 表示一个字段。
 */
var DocField = (function (_super) {
    __extends(DocField, _super);
    function DocField() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocField.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "field"; },
        enumerable: true,
        configurable: true
    });
    return DocField;
}(DocMember));
exports.DocField = DocField;
/**
 * 表示一个方法。
 */
var DocMethod = (function (_super) {
    __extends(DocMethod, _super);
    function DocMethod() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * 所有形参。
         */
        _this.parameters = [];
        return _this;
    }
    Object.defineProperty(DocMethod.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "method"; },
        enumerable: true,
        configurable: true
    });
    return DocMethod;
}(DocMember));
exports.DocMethod = DocMethod;
/**
 * 表示一个构造方法。
 */
var DocConstructor = (function (_super) {
    __extends(DocConstructor, _super);
    function DocConstructor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocConstructor.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "constructor"; },
        enumerable: true,
        configurable: true
    });
    return DocConstructor;
}(DocMethod));
exports.DocConstructor = DocConstructor;
/**
 * 表示一个形参。
 */
var DocParameter = (function (_super) {
    __extends(DocParameter, _super);
    function DocParameter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DocParameter;
}(DocNode));
exports.DocParameter = DocParameter;
/**
 * 表示一个泛型的形参。
 */
var DocTypeParameter = (function (_super) {
    __extends(DocTypeParameter, _super);
    function DocTypeParameter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DocTypeParameter;
}(DocNode));
exports.DocTypeParameter = DocTypeParameter;
/**
 * 表示一个类。
 */
var DocClass = (function (_super) {
    __extends(DocClass, _super);
    function DocClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocClass.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "class"; },
        enumerable: true,
        configurable: true
    });
    return DocClass;
}(DocMemberContainer));
exports.DocClass = DocClass;
/**
 * 表示一个接口。
 */
var DocInterface = (function (_super) {
    __extends(DocInterface, _super);
    function DocInterface() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocInterface.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "interface"; },
        enumerable: true,
        configurable: true
    });
    return DocInterface;
}(DocMemberContainer));
exports.DocInterface = DocInterface;
/**
 * 表示一个命名空间。
 */
var DocNamespace = (function (_super) {
    __extends(DocNamespace, _super);
    function DocNamespace() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocNamespace.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "namespace"; },
        enumerable: true,
        configurable: true
    });
    return DocNamespace;
}(DocMemberContainer));
exports.DocNamespace = DocNamespace;
/**
 * 表示一个枚举。
 */
var DocEnum = (function (_super) {
    __extends(DocEnum, _super);
    function DocEnum() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocEnum.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "enum"; },
        enumerable: true,
        configurable: true
    });
    return DocEnum;
}(DocMemberContainer));
exports.DocEnum = DocEnum;
/**
 * 表示一个枚举字段。
 */
var DocEnumMember = (function (_super) {
    __extends(DocEnumMember, _super);
    function DocEnumMember() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocEnumMember.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "enumMember"; },
        enumerable: true,
        configurable: true
    });
    return DocEnumMember;
}(DocMember));
exports.DocEnumMember = DocEnumMember;
/**
 * 表示一个类型别名。
 */
var DocTypeAlias = (function (_super) {
    __extends(DocTypeAlias, _super);
    function DocTypeAlias() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DocTypeAlias.prototype, "memberType", {
        /**
         * 成员类型。
         */
        get: function () { return "type"; },
        enumerable: true,
        configurable: true
    });
    return DocTypeAlias;
}(DocMember));
exports.DocTypeAlias = DocTypeAlias;
/**
 * 表示一个类型。
 */
var DocType = (function () {
    function DocType() {
        /**
         * 类型各组成部分。
         */
        this.parts = [];
    }
    DocType.prototype.toString = function () {
        var result = "";
        for (var _i = 0, _a = this.parts; _i < _a.length; _i++) {
            var part = _a[_i];
            result += typeof part == "string" ? part : typeof part == "boolean" ? "" : part.name;
        }
        return result;
    };
    return DocType;
}());
exports.DocType = DocType;
/**
 * 表示一个源文件。
 */
var DocSourceFile = (function (_super) {
    __extends(DocSourceFile, _super);
    function DocSourceFile() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * 所有成员项。
         */
        _this.members = [];
        return _this;
    }
    Object.defineProperty(DocSourceFile.prototype, "exports", {
        /**
         * 所有导出项。
         */
        get: function () { return this.members.map(function (m) { return m.exportName; }); },
        enumerable: true,
        configurable: true
    });
    return DocSourceFile;
}(DocNode));
exports.DocSourceFile = DocSourceFile;
/**
 * 表示一个导入项。
 */
var DocImport = (function () {
    function DocImport() {
    }
    return DocImport;
}());
exports.DocImport = DocImport;
/**
 * 表示一个文档对象。
 */
var DocProject = (function () {
    function DocProject() {
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
    DocProject.prototype.getSourceFile = function (sourceFile) {
        return this.sourceFiles.find(function (file) { return file.name == sourceFile; });
    };
    /**
     * 整理所有成员。
     */
    DocProject.prototype.sort = function () {
        // TODO
    };
    return DocProject;
}());
exports.DocProject = DocProject;
/**
 * 解析指定程序的文档。
 * @param program 要解析的程序。
 * @param sourceFiles 要解析的源文件。
 * @return 返回已解析的文档对象。
 */
function parseProgram(program, sourceFiles) {
    var checker = program.getTypeChecker();
    var result = new DocProject();
    for (var _i = 0, sourceFiles_1 = sourceFiles; _i < sourceFiles_1.length; _i++) {
        var sourceFile = sourceFiles_1[_i];
        result.sourceFiles.push(parseSouceFile(sourceFile));
    }
    return result;
    function parseSouceFile(sourceFile) {
        var result = new DocSourceFile();
        result.name = sourceFile.fileName;
        var jsDoc = getJSDoc(sourceFile);
        if (jsDoc && jsDoc.tags) {
            for (var _i = 0, _a = jsDoc.tags; _i < _a.length; _i++) {
                var tag = _a[_i];
                var tagName = tag.tagName.text;
                var comment = tag.comment.trim();
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
        for (var _b = 0, _c = sourceFile.referencedFiles; _b < _c.length; _b++) {
            var rf = _c[_b];
            var di = new DocImport();
            di.name = rf.fileName;
            di.reference = true;
            result.imports = result.imports || [];
            result.imports.push(di);
        }
        if (result.commonJsModule) {
            for (var _d = 0, _e = sourceFile.imports; _d < _e.length; _d++) {
                var importDeclaration = _e[_d];
                result.imports = result.imports || [];
                var di = new DocImport();
                di.name = importDeclaration.text;
                result.imports.push(di);
            }
            for (var _f = 0, _g = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile)); _f < _g.length; _f++) {
                var symbol = _g[_f];
                var member = parseSymbol(symbol);
                if (member) {
                    member.exportName = symbol.name;
                    result.members.push(member);
                }
            }
        }
        else {
            for (var _h = 0, _j = sourceFile.statements; _h < _j.length; _h++) {
                var statement = _j[_h];
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (var _k = 0, _l = statement.declarationList.declarations; _k < _l.length; _k++) {
                            var declaration = _l[_k];
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
        if (symbol._docMember) {
            return symbol._docMember;
        }
        if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property)) {
            if (symbol.flags & ts.SymbolFlags.Prototype) {
                return null;
            }
            var declaration = symbol.valueDeclaration;
            var result_1 = createMember(DocField, symbol, declaration);
            if (ts.isConst(declaration)) {
                result_1["const"] = true;
            }
            if (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) {
                result_1.readonly = true;
            }
            result_1.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, declaration));
            if (declaration.initializer) {
                result_1["default"] = declaration.initializer.getText();
            }
            return result_1;
        }
        if (symbol.flags & ts.SymbolFlags.Accessor) {
            var result_2 = createMember(DocProperty, symbol);
            if (!(symbol.flags & ts.SymbolFlags.SetAccessor)) {
                result_2.readonly = true;
            }
            result_2.type = parseType(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration));
            return result_2;
        }
        if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor)) {
            var declarations = symbol.getDeclarations();
            var mainDeclaration = declarations.find(function (declaration) { return !!declaration.body; });
            var type = symbol.flags & ts.SymbolFlags.Constructor ? DocConstructor : DocMethod;
            var result_3 = createMember(type, symbol, mainDeclaration);
            for (var _i = 0, declarations_1 = declarations; _i < declarations_1.length; _i++) {
                var declaration = declarations_1[_i];
                var signature = checker.getSignatureFromDeclaration(declaration);
                var method = void 0;
                if (declaration === mainDeclaration) {
                    method = result_3;
                }
                else {
                    method = createMember(type, signature, declaration);
                    result_3.overloads = result_3.overloads || [];
                    result_3.overloads.push(method);
                }
                if (declaration.asteriskToken) {
                    method.generator = true;
                }
                var modifierFlags = ts.getCombinedModifierFlags(declaration);
                if (modifierFlags & ts.ModifierFlags.Async) {
                    method.async = true;
                }
                if (modifierFlags & ts.ModifierFlags.Abstract) {
                    method.abstract = true;
                }
                if (signature.typeParameters) {
                    method.typeParameters = parseTypeParameters(signature.typeParameters);
                }
                var thisParameterSymbol = signature.thisParameter;
                if (thisParameterSymbol) {
                    method.thisType = parseType(checker.getTypeOfSymbolAtLocation(thisParameterSymbol, thisParameterSymbol.valueDeclaration));
                }
                for (var _a = 0, _b = signature.getParameters(); _a < _b.length; _a++) {
                    var parameterSymbol = _b[_a];
                    var paramNode = parameterSymbol.valueDeclaration;
                    var p = new DocParameter();
                    p.name = parameterSymbol.getName();
                    p.type = parseType(checker.getTypeOfSymbolAtLocation(parameterSymbol, paramNode));
                    p.summary = ts.displayPartsToString(parameterSymbol.getDocumentationComment());
                    if (paramNode.initializer) {
                        p["default"] = paramNode.initializer.getText();
                    }
                    p.rest = paramNode.dotDotDotToken != null;
                    p.optional = paramNode.questionToken != null || paramNode.dotDotDotToken != null || paramNode.initializer != null;
                    method.parameters.push(p);
                }
                method.returnType = parseType(signature.getReturnType());
                if (symbol.valueDeclaration) {
                    var returnDoc = ts.getJSDocReturnTag(symbol.valueDeclaration);
                    if (returnDoc) {
                        method.returnSummary = returnDoc.comment;
                    }
                }
            }
            return result_3;
        }
        if (symbol.flags & (ts.SymbolFlags.Class)) {
            var result_4 = createMember(DocClass, symbol);
            var type = checker.getDeclaredTypeOfSymbol(symbol);
            var baseType = type.getBaseTypes()[0];
            if (baseType) {
                result_4["extends"] = parseType(baseType);
            }
            var implementTypes = ts.getClassImplementsHeritageClauseElements(symbol.valueDeclaration);
            if (implementTypes) {
                result_4.implements = [];
                for (var _c = 0, implementTypes_1 = implementTypes; _c < implementTypes_1.length; _c++) {
                    var implementType = implementTypes_1[_c];
                    debugger;
                    result_4.implements.push(parseType(checker.getTypeAtLocation(implementType.expression)));
                }
            }
            console.log(type.getSymbol().name, checker.getBaseTypeOfLiteralType(type).getSymbol().name);
            console.log(type.getBaseTypes().map(function (x) { return x.getSymbol().name; }));
            console.log(type.getProperties().map(function (x) { return x.name; }));
            if (type.typeParameters) {
                result_4.typeParameters = parseTypeParameters(type.typeParameters);
            }
            result_4.members = parseSymbolList(symbol.exports);
            result_4.prototypes = parseSymbolList(symbol.members);
            return result_4;
        }
        if (symbol.flags & ts.SymbolFlags.Interface) {
            var result_5 = createMember(DocInterface, symbol);
            var type = checker.getDeclaredTypeOfSymbol(symbol);
            if (type.typeParameters) {
                result_5.typeParameters = parseTypeParameters(type.typeParameters);
            }
            result_5.members = parseSymbolList(symbol.members);
            return result_5;
        }
        if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
            var result_6 = createMember(DocEnum, symbol);
            result_6.members = parseSymbolList(symbol.exports);
            var value = -1;
            for (var _d = 0, _e = result_6.members; _d < _e.length; _d++) {
                var member = _e[_d];
                if (member.value != null) {
                    value = member.value;
                }
                else {
                    member.value = typeof value === "number" ? ++value : member.name;
                }
            }
            return result_6;
        }
        if (symbol.flags & ts.SymbolFlags.EnumMember) {
            var result_7 = createMember(DocEnumMember, symbol);
            if (symbol.valueDeclaration.initializer) {
                result_7.value = +symbol.valueDeclaration.initializer.getText();
            }
            return result_7;
        }
        if (symbol.flags & ts.SymbolFlags.TypeAlias) {
            var result_8 = createMember(DocTypeAlias, symbol);
            result_8.type = parseType(checker.getDeclaredTypeOfSymbol(symbol));
            return result_8;
        }
        if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule | ts.SymbolFlags.ExportNamespace)) {
            var result_9 = createMember(DocNamespace, symbol);
            result_9.members = parseSymbolList(symbol.exports);
            return result_9;
        }
        return null;
    }
    function createMember(type, symbol, declaration) {
        if (declaration === void 0) { declaration = getDeclaration(symbol); }
        var result = symbol._docMember = new type();
        result.name = getSymbolName(symbol, declaration);
        var modifierFlags = ts.getCombinedModifierFlags(declaration);
        result.accessibility = modifierFlags & ts.ModifierFlags.Private ? DocMemberAccessibility.private : modifierFlags & ts.ModifierFlags.Protected ? DocMemberAccessibility.protected : DocMemberAccessibility.public;
        result.summary = ts.displayPartsToString(symbol.getDocumentationComment());
        for (var _i = 0, _a = symbol.getJsDocTags(); _i < _a.length; _i++) {
            var tag = _a[_i];
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
                    result.accessibility = DocMemberAccessibility.internal;
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
        var sourceFile = declaration.getSourceFile();
        result.sourceFile = sourceFile.fileName;
        var loc = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile, true));
        result.sourceLine = loc.line;
        result.sourceColumn = loc.character;
        return result;
    }
    function parseSymbolList(list) {
        var result = [];
        if (list) {
            list.forEach(function (symbol, key) {
                var member = parseSymbol(symbol);
                if (member) {
                    result.push(member);
                }
            });
        }
        return result;
    }
    function parseTypeParameters(typeParameters) {
        var result = [];
        for (var _i = 0, typeParameters_1 = typeParameters; _i < typeParameters_1.length; _i++) {
            var typeParameter = typeParameters_1[_i];
            var tp = new DocTypeParameter();
            tp.name = typeParameter.symbol.getName();
            tp.summary = ts.displayPartsToString(typeParameter.symbol.getDocumentationComment());
            if (typeParameter["default"]) {
                tp["default"] = parseType(typeParameter["default"]);
            }
            if (typeParameter.constraint) {
                tp["extends"] = parseType(typeParameter.constraint);
            }
            result.push(tp);
        }
        return result;
    }
    function parseType(type) {
        if (type._docMember) {
            return type._docMember;
        }
        var result = type._docMember = new DocType();
        var builder = checker.getSymbolDisplayBuilder();
        var writer = {
            writeKeyword: function (text) {
                result.parts.push(text);
            },
            writeOperator: function (text) {
                result.parts.push(text);
            },
            writePunctuation: function (text) {
                result.parts.push(text);
            },
            writeSpace: function (text) {
                result.parts.push(text);
            },
            writeStringLiteral: function (text) {
                result.parts.push(text);
            },
            writeParameter: function (text) {
                result.parts.push(text);
            },
            writeProperty: function (text) {
                result.parts.push(text);
            },
            writeSymbol: function (text, symbol) {
                result.parts.push(symbolToType(symbol));
                function symbolToType(symbol) {
                    if (symbol.flags === ts.SymbolFlags.ValueModule) {
                        return null;
                    }
                    var declaration = getDeclaration(symbol);
                    var result = {
                        name: getSymbolName(symbol, declaration),
                        sourceFile: declaration && declaration.getSourceFile().fileName
                    };
                    if (symbol.parent) {
                        result.parent = symbolToType(symbol.parent);
                    }
                    return result;
                }
            },
            writeLine: function () {
                result.parts.push("\n");
            },
            increaseIndent: function () {
                result.parts.push(true);
            },
            decreaseIndent: function () {
                result.parts.push(false);
            },
            clear: function () {
                result.parts.length = 0;
            },
            trackSymbol: function () { },
            reportInaccessibleThisError: function () { },
            reportPrivateInBaseOfClassExpression: function () { }
        };
        builder.buildTypeDisplay(type, writer, null, ts.TypeFormatFlags.UseTypeAliasValue | ts.TypeFormatFlags.WriteArrowStyleSignature | ts.TypeFormatFlags.WriteClassExpressionAsTypeLiteral);
        return result;
    }
    function getDeclaration(symbol) {
        return symbol.valueDeclaration || symbol.getDeclarations() && symbol.getDeclarations()[symbol.getDeclarations().length - 1];
    }
    function getSymbolName(symbol, declaration) {
        var name = declaration && ts.getNameOfDeclaration(declaration);
        return name ? name.getText() : symbol.getName ? symbol.getName() : symbol.name;
    }
    function getJSDoc(node) {
        var jsDocRanges = ts.getLeadingCommentRanges(node.getSourceFile().text, node.pos);
        if (jsDocRanges && jsDocRanges.length) {
            var jsDocRange = jsDocRanges[0];
            var rootJsDoc = ts.parseIsolatedJSDocComment(node.getSourceFile().text, jsDocRange.pos, jsDocRange.end - jsDocRange.pos);
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
function parseDoc() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i] = arguments[_i];
    }
    var program = ts.createProgram(paths, {});
    return parseProgram(program, program.getSourceFiles().filter(function (x) { return !x.isDeclarationFile; }));
}
exports["default"] = parseDoc;
console.log(JSON.stringify(parseDoc(__dirname + "/test/fixture.ts").sourceFiles[1].members, undefined, 2));
