import * as ts from "typescript"

/**
 * 解析指定源码的文档
 * @param paths 要解析的路径
 * @return 返回已解析的文档对象
 */
export function parseDoc(...paths: string[]) {
	return parseProgram(ts.createProgram(paths, {}))
}

/**
 * 解析指定程序的文档
 * @param program 要解析的程序
 * @param sourceFiles 要解析的源文件
 * @return 返回已解析的文档对象
 */
export function parseProgram(program: ts.Program, sourceFiles = program.getRootFileNames().map(name => program.getSourceFile(name)).filter(sourceFile => sourceFile)) {
	const checker = program.getTypeChecker()
	const result: ParsedDoc = {
		sourceObject: program,
		sourceFiles: sourceFiles.map(sourceFile => getDocNode(sourceFile, checker, parseSouceFile))
	}
	return result
}

const docSymbol = Symbol("doc")

/** 获取文档节点 */
function getDocNode<N extends ts.Node | ts.Symbol | ts.Type, R extends (N extends ts.Type ? DocType : DocNode)>(node: N, checker: ts.TypeChecker, parser: (result: R, node: N, checker: ts.TypeChecker) => void) {
	if (node[docSymbol]) {
		return node[docSymbol] as R
	}
	const docNode = node[docSymbol] = {} as R
	parser(docNode, node, checker)
	return docNode
}

function parseSouceFile(result: DocSourceFile, sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
	result.sourceObject = sourceFile
	result.fileName = ts.normalizePath(sourceFile.fileName)
	result.name = sourceFile.moduleName || sourceFile.fileName
	result.declaration = sourceFile.isDeclarationFile
	result.module = ts.isExternalModule(sourceFile)
	result.summary = ""
	result.imports = []
	result.members = []
	for (const jsDoc of getJSDocComments(sourceFile)) {
		if (jsDoc.tags && jsDoc.tags.some(tag => tag.tagName.text === "file" || tag.tagName.text === "overview" || tag.tagName.text === "fileoverview" || tag.tagName.text === "fileOverview" || tag.tagName.text === "copyright" || tag.tagName.text === "license" || tag.tagName.text === "licence" || tag.tagName.text === "module")) {
			for (const tag of jsDoc.tags) {
				switch (tag.tagName.text) {
					case "file":
					case "overview":
					case "fileoverview":
					case "fileOverview":
						result.summary = concatComment(result.summary, tag.comment)
						break
					case "author":
						result.author = concatComment(result.author, tag.comment)
						break
					case "version":
						result.version = concatComment(result.version, tag.comment)
						break
					case "copyright":
						result.copyright = concatComment(result.copyright, tag.comment)
						break
					case "license":
					case "licence":
						result.license = concatComment(result.license, tag.comment)
						break
					case "name":
					case "module":
						result.name = tag.comment
						break
					default:
						addCustomTag(result, tag.tagName.text, tag.comment)
						break
				}
			}
		}
	}
	if (result.module) {
		if (sourceFile.resolvedModules) {
			sourceFile.resolvedModules.forEach((resolvedModule: ts.ResolvedModuleFull & { originalPath?: string }, name: string) => {
				result.imports.push({
					name: name,
					resolvedName: resolvedModule.resolvedFileName,
					path: resolvedModule.originalPath,
					external: resolvedModule.isExternalLibraryImport
				})
			})
		}
		for (const symbol of checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile))) {
			result.members.push(getMember(symbol, checker))
		}
	} else {
		if (sourceFile.locals) {
			sourceFile.locals.forEach(symbol => {
				result.members.push(getMember(symbol, checker))
			})
		}
	}
	return result
}

function getMember(symbol: ts.Symbol, checker: ts.TypeChecker) {
	return getDocNode(symbol, checker, parseMember)
}

function parseMember(result: DocMember, symbol: ts.Symbol, checker: ts.TypeChecker) {
	if (symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor | ts.SymbolFlags.Signature)) {
		return parseMethod(result as DocMethod, symbol, checker)
	}
	if (symbol.flags & (ts.SymbolFlags.FunctionScopedVariable | ts.SymbolFlags.BlockScopedVariable | ts.SymbolFlags.Property | ts.SymbolFlags.EnumMember)) {
		return parseProperty(result as DocProperty, symbol, checker)
	}
	if (symbol.flags & ts.SymbolFlags.Accessor) {
		return parseAccessor(result as DocProperty, symbol, checker)
	}
	if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
		return parseClass(result as DocClass, symbol, checker)
	}
	if (symbol.flags & (ts.SymbolFlags.Enum | ts.SymbolFlags.ConstEnum)) {
		return parseEnum(result as DocEnum, symbol, checker)
	}
	if (symbol.flags & (ts.SymbolFlags.Namespace | ts.SymbolFlags.NamespaceModule)) {
		return parseNamespace(result as DocNamespace, symbol, checker)
	}
	if (symbol.flags & ts.SymbolFlags.TypeAlias) {
		return parseTypeAlias(result as DocTypeAlias, symbol, checker)
	}
	return parseCommonMember(result, "field", symbol, symbol, symbol.valueDeclaration || symbol.getDeclarations()[0], checker)
}

function parseMethod(result: DocMethod, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declarations = symbol.getDeclarations().filter(declaration => declaration.kind !== ts.SyntaxKind.ModuleDeclaration && declaration.kind !== ts.SyntaxKind.InterfaceDeclaration) as ts.SignatureDeclaration[]
	const implementation = declarations.length === 1 ? declarations[0] : declarations.find(checker.isImplementationOfOverload)
	parseMethodSignature(result, checker.getSignatureFromDeclaration(implementation), symbol, checker)
	if (declarations.length > 1) {
		result.overloads = declarations.filter(declaration => declaration !== implementation).map(declaration => parseMethodSignature({} as DocMethod, checker.getSignatureFromDeclaration(declaration), symbol, checker))
	}
	if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.Namespace)) {
		parseClass(result.class = {} as DocClass, symbol, checker)
	}
}

function parseMethodSignature(result: DocMethod, signature: ts.Signature, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const flags = symbol.getFlags()
	const modifierFlags = ts.getCombinedModifierFlags(signature.declaration)
	const returnDoc = ts.getJSDocReturnTag(signature.declaration)
	parseCommonMember(result, flags & ts.SymbolFlags.Signature ? "signature" : flags & ts.SymbolFlags.Constructor ? "constructor" : flags & ts.SymbolFlags.Method ? "method" : "function", signature, symbol, signature.getDeclaration(), checker)
	result.async = !!(modifierFlags & ts.ModifierFlags.Async)
	result.generator = !!(signature.declaration as ts.MethodDeclaration).asteriskToken
	if (signature.typeParameters) {
		result.typeParameters = signature.typeParameters.map((typeParameter, index) => parseTypeParameter({} as DocTypeParameter, typeParameter, signature.getDeclaration().typeParameters[index], checker))
	}
	result.parameters = signature.getParameters().map(parameter => parseParameter({} as DocParameter, parameter, checker))
	result.returnType = getType(signature.getReturnType(), checker)
	result.returnSummary = returnDoc ? returnDoc.comment : ""
	return result
}

function parseTypeParameter(result: DocTypeParameter, typeParameter: ts.TypeParameter, declaration: ts.TypeParameterDeclaration, checker: ts.TypeChecker) {
	result.sourceObject = declaration
	result.name = typeParameter.getSymbol().getName()
	result.summary = ts.displayPartsToString(typeParameter.symbol.getDocumentationComment(checker))
	result.type = getType(typeParameter, checker)
	if (typeParameter.getDefault()) {
		result.default = getType(typeParameter.getDefault(), checker)
	}
	if (typeParameter.getConstraint()) {
		result.extends = getType(typeParameter.getConstraint(), checker)
	}
	return result
}

function parseParameter(result: DocParameter, parameter: ts.Symbol, checker: ts.TypeChecker) {
	const parameterDeclaration = parameter.valueDeclaration as ts.ParameterDeclaration
	result.sourceObject = parameter.valueDeclaration as ts.ParameterDeclaration
	result.summary = ts.displayPartsToString(parameter.getDocumentationComment(checker))
	result.rest = !!parameterDeclaration.dotDotDotToken
	result.name = parameter.getName()
	result.optional = !!parameterDeclaration.questionToken || !!parameterDeclaration.dotDotDotToken || !!parameterDeclaration.initializer
	result.type = getType(checker.getTypeOfSymbolAtLocation(parameter, parameterDeclaration), checker)
	if (parameterDeclaration.initializer) {
		result.default = parameterDeclaration.initializer
	}
	return result
}

function parseProperty(result: DocProperty, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declaration = (symbol.valueDeclaration || symbol.getDeclarations()[0]) as ts.VariableDeclaration
	let top = declaration as ts.Declaration
	while (top.kind === ts.SyntaxKind.BindingElement || top.kind === ts.SyntaxKind.ArrayBindingPattern || top.kind === ts.SyntaxKind.ObjectBindingPattern) {
		top = top.parent as ts.Declaration
	}
	const modifierFlags = ts.getCombinedModifierFlags(declaration)
	const flags = symbol.getFlags()
	parseCommonMember(result, top.parent.flags & ts.NodeFlags.Const ? "const" : flags & ts.SymbolFlags.BlockScopedVariable ? "let" : flags & ts.SymbolFlags.FunctionScopedVariable ? "var" : flags & ts.SymbolFlags.EnumMember ? "enumMember" : "field", symbol, symbol, declaration, checker)
	result.optional = !!(flags & ts.SymbolFlags.Optional)
	result.readOnly = !!(declaration.parent.flags & ts.NodeFlags.Const || modifierFlags & ts.ModifierFlags.Readonly)
	result.type = getType(checker.getTypeOfSymbolAtLocation(symbol, declaration), checker)
	if (declaration.initializer) {
		result.default = declaration.initializer
	}
	return result
}

function parseAccessor(result: DocProperty, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declaration = (symbol.valueDeclaration || symbol.getDeclarations()[0]) as ts.AccessorDeclaration
	parseCommonMember<DocProperty>(result, "accessor", symbol, symbol, declaration, checker)
	result.readOnly = !(symbol.getFlags() & ts.SymbolFlags.SetAccessor)
	result.type = getType(checker.getTypeOfSymbolAtLocation(symbol, declaration), checker)
	return result
}

function parseClass(result: DocClass, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declarations = symbol.getDeclarations()
	const implementation = (declarations.find(declaration => declaration.kind === ts.SyntaxKind.ClassDeclaration) || declarations.find(declaration => declaration.kind === ts.SyntaxKind.InterfaceDeclaration) || declarations[0]) as ts.ClassDeclaration | ts.InterfaceDeclaration
	parseCommonMember<DocClass>(result, symbol.flags & ts.SymbolFlags.Class ? "class" : "interface", symbol, symbol, implementation, checker)
	const type = checker.getDeclaredTypeOfSymbol(symbol) as ts.InterfaceType
	if (type.typeParameters) {
		result.typeParameters = type.typeParameters.map((typeParameter, index) => parseTypeParameter({} as DocTypeParameter, typeParameter, implementation.typeParameters[index], checker))
	}
	for (const baseType of checker.getBaseTypes(type)) {
		result.extends = result.extends || []
		result.extends.push(getType(baseType, checker))
	}
	const implementTypes = ts.getClassImplementsHeritageClauseElements(implementation)
	if (implementTypes) {
		for (const implementType of implementTypes) {
			result.implements = result.implements || []
			result.implements.push(getType(checker.getTypeAtLocation(implementType.expression), checker))
		}
	}
	const constructor = symbol.members.get("__constructor" as ts.__String)
	if (constructor) {
		result.constructor = getMember(constructor, checker) as DocMethod
	}
	const index = symbol.members.get("__index" as ts.__String)
	if (index) {
		result.index = getMember(index, checker) as DocMethod
		for (const jsDoc of getJSDocComments(index.valueDeclaration || index.getDeclarations()[0])) {
			result.summary = concatComment(result.summary, jsDoc.comment)
		}
	}
	const newCall = symbol.members.get("__new" as ts.__String)
	if (newCall) {
		result.new = getMember(newCall, checker) as DocMethod
	}
	result.members = []
	if (symbol.exports) {
		symbol.exports.forEach((childSymbol, key) => {
			if (childSymbol.getFlags() & ts.SymbolFlags.Prototype) {
				return
			}
			const childMember = getMember(childSymbol, checker)
			result.members.push(childMember)
		})
	}
	result.prototypeMmbers = []
	if (symbol.members) {
		symbol.members.forEach((childSymbol, key) => {
			if (childSymbol.getFlags() & (ts.SymbolFlags.Signature | ts.SymbolFlags.Constructor)) {
				return
			}
			const childMember = getMember(childSymbol, checker)
			result.prototypeMmbers.push(childMember)
		})
	}
	return result
}

function parseEnum(result: DocEnum, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declaration = symbol.getDeclarations().find(declaration => declaration.kind === ts.SyntaxKind.EnumDeclaration)
	parseCommonMember<DocEnum>(result, "enum", symbol, symbol, declaration, checker)
	result.const = !!(symbol.flags & ts.SymbolFlags.ConstEnum)
	result.members = []
	if (symbol.exports) {
		symbol.exports.forEach((childSymbol, key) => {
			const childMember = getMember(childSymbol, checker)
			result.members.push(childMember)
		})
	}
	return result
}

function parseNamespace(result: DocNamespace, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declaration = symbol.getDeclarations().find(declaration => declaration.kind === ts.SyntaxKind.ModuleDeclaration)
	parseCommonMember<DocNamespace>(result, "namespace", symbol, symbol, declaration, checker)
	result.members = []
	if (symbol.exports) {
		symbol.exports.forEach((childSymbol, key) => {
			const childMember = getMember(childSymbol, checker)
			result.members.push(childMember)
		})
	}
	return result
}

function parseTypeAlias(result: DocTypeAlias, symbol: ts.Symbol, checker: ts.TypeChecker) {
	const declaration = symbol.getDeclarations().find(declaration => declaration.kind === ts.SyntaxKind.TypeAliasDeclaration)
	parseCommonMember<DocTypeAlias>(result, "type", symbol, symbol, declaration, checker)
	result.type = getType(checker.getDeclaredTypeOfSymbol(symbol), checker)
	return result
}

function parseCommonMember<T extends DocMember>(result: DocMember, memberType: T["memberType"], symbolOrSignature: ts.Symbol | ts.Signature, symbol: ts.Symbol, declaration: ts.Declaration, checker: ts.TypeChecker) {
	const sourceFile = declaration.getSourceFile()
	const loc = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile, true))
	const locEnd = sourceFile.getLineAndCharacterOfPosition(declaration.getEnd())
	const modifierFlags = ts.getCombinedModifierFlags(declaration)
	result.sourceObject = declaration
	result.memberType = memberType
	result.name = symbol.getName()
	result.summary = ts.displayPartsToString(symbolOrSignature.getDocumentationComment(checker))
	result.line = loc.line
	result.column = loc.character
	result.endLine = locEnd.line
	result.endColumn = locEnd.character
	result.internal = false
	result.protected = !!(modifierFlags & ts.ModifierFlags.Protected)
	result.private = !!(modifierFlags & ts.ModifierFlags.Private)
	result.static = !!(modifierFlags & ts.ModifierFlags.Static)
	for (const tag of symbolOrSignature.getJsDocTags()) {
		switch (tag.name) {
			case "example":
			case "sample":
			case "demo":
				result.examples = result.examples || []
				result.examples.push(tag.text)
				break
			case "see":
			case "seeAlso":
			case "seealso":
				result.sees = result.sees || []
				result.sees.push(tag.text)
				break
			case "desc":
			case "description":
			case "remark":
				result.description = concatComment(result.description, tag.text)
				break
			case "summary":
				result.summary = concatComment(result.summary, tag.text)
				break
			case "name":
			case "member":
			case "method":
			case "property":
			case "field":
			case "getter":
			case "setter":
				result.name = tag.text
				break
			case "internal":
			case "package":
				result.internal = true
				break
			case "private":
				result.private = true
				break
			case "protected":
				result.protected = true
				break
			case "access":
				result.private = result.protected = result.internal = false
				switch (tag.text) {
					case "package":
					case "internal":
						result.internal = true
						break
					case "protected":
						result.protected = true
						break
					case "private":
						result.private = true
						break
				}
				break
			case "hidden":
				result.hidden = true
				break
			case "category":
				result.category = tag.text
				break
			case "virtual":
				result.virtual = true
				break
			case "abstract":
				result.abstract = true
				break
			case "override":
				result.override = true
				break
			case "since":
				result.since = concatComment(result.since, tag.text)
				break
			case "deprecated":
				result.deprecated = concatComment(result.deprecated, tag.text)
				break
			case "default":
				result.defaultValue = tag.text
				break
			case "author":
				result.author = concatComment(result.author, tag.text)
				break
			case "version":
				result.version = concatComment(result.version, tag.text)
				break
			default:
				addCustomTag(result, tag.name, tag.text)
				break
		}
	}
	return result
}

function getType(type: ts.Type, checker: ts.TypeChecker) {
	return getDocNode(type, checker, parseType)
}

function parseType(result: DocType, type: ts.Type, checker: ts.TypeChecker) {
	result.sourceObject = type
	if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean | ts.TypeFlags.BigInt | ts.TypeFlags.ESSymbol | ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Never | ts.TypeFlags.NonPrimitive)) {
		return parseIntrinsicType(result as DocNativeType, type as ts.IntrinsicType, checker)
	}
	if (type.flags & ts.TypeFlags.Object) {
		const objectFlags = (type as ts.ObjectType).objectFlags
		if (objectFlags & ts.ObjectFlags.ClassOrInterface) {
			return parseClassType(result as DocClassType, type as ts.InterfaceType, checker)
		}
		if (objectFlags & ts.ObjectFlags.Reference) {
			if (checker.isArrayType(type)) {
				return parseArrayType(result as DocArrayType, type as ts.TypeReference, checker)
			}
			if ((type as ts.TypeReference).target.objectFlags & ts.ObjectFlags.Tuple) {
				return parseTupleType(result as DocTupleType, type as ts.TupleType, checker)
			}
			return parseGenericType(result as DocGenericType, type as ts.TypeReference, checker)
		}
		if (objectFlags & (ts.ObjectFlags.Anonymous | ts.ObjectFlags.Mapped)) {
			const signature = checker.getSignaturesOfType(type, ts.SignatureKind.Call)
			if (signature.length === 1) {
				return parseFunctionType(result as DocFunctionType, type as ts.ObjectType, signature[0], checker)
			}
			if (type.symbol) {
				return parseTypeOf(result as DocTypeOfType, type.symbol as ts.Symbol, checker)
			}
			return parseObjectType(result as DocObjectType, type as ts.ObjectType, checker)
		}
	}
	if (type.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral)) {
		return parseLiteralType(result as DocLiteralType, type as ts.StringLiteralType | ts.NumberLiteralType, checker)
	}
	if (type.flags & ts.TypeFlags.BooleanLiteral) {
		return parseBooleanLiteralType(result as DocLiteralType, type as ts.IntrinsicType, checker)
	}
	if (type.flags & (ts.TypeFlags.UnionOrIntersection)) {
		return parseBinaryType(result as DocBinaryType, type as ts.UnionOrIntersectionType, checker)
	}
	if (type.flags & ts.TypeFlags.BigIntLiteral) {
		return parseBigIntLiteralType(result as DocLiteralType, type as ts.BigIntLiteralType, checker)
	}
	if (type.flags & ts.TypeFlags.Conditional) {
		return parseConditionalType(result as DocConditionalType, type as ts.ConditionalType, checker)
	}
	if (type.flags & ts.TypeFlags.IndexedAccess) {
		return parseIndexedAccessType(result as DocIndexedAccessType, type as ts.IndexedAccessType, checker)
	}
	if (type.flags & ts.TypeFlags.Index) {
		return parseUnaryType(result as DocUnaryType, type as ts.IndexType, checker)
	}
	if (type.flags & ts.TypeFlags.TypeParameter) {
		if ((type as any).thisType) {
			return parseThisType(result as DocThisType, type, checker)
		}
		return parseTypeParameterType(result as DocTypeParameterType, type, checker)
	}
	if (type.flags & ts.TypeFlags.UniqueESSymbol) {
		return parseNativeType(result as DocNativeType, "unique symbol", checker)
	}
	if (type.flags & ts.TypeFlags.EnumLiteral && !(type.flags & ts.TypeFlags.Union)) {
		// if (type.flags & 1024 /* EnumLiteral */ && !(type.flags & 1048576 /* Union */)) {
		// 	var parentSymbol = getParentOfSymbol(type.symbol);
		// 	var parentName = symbolToTypeNode(parentSymbol, context, 67897832 /* Type */);
		// 	var enumLiteralName = getDeclaredTypeOfSymbol(parentSymbol) === type
		// 		? parentName
		// 		: appendReferenceToType(parentName, ts.createTypeReferenceNode(ts.symbolName(type.symbol), /*typeArguments*/ undefined));
		// 	return enumLiteralName;
		// }
		// 	return type._docType = {
		// 		sourceObject: type,
		// 		type: "enum",
		// 		operand: getType((type as ts.IndexedAccessType).objectType, checker),
		// 		argument: getType((type as ts.IndexedAccessType).indexType, checker)
		// 	} as DocIndexedAccessType
	}
	if (type.flags & ts.TypeFlags.Enum) {
		// return symbolToTypeNode(type.symbol, context, 67897832 /* Type */);
	}
	if (type.flags & ts.TypeFlags.Substitution) {
		return parseSubstitutionType(result as DocNativeType, type as ts.SubstitutionType, checker)
	}
	return parseNativeType(result as DocNativeType, "mixed", checker)
}

function parseIntrinsicType(result: DocNativeType, type: ts.IntrinsicType, checker: ts.TypeChecker) {
	result.type = "native"
	result.value = type.intrinsicName as any
	return result
}

function parseLiteralType(result: DocLiteralType, type: ts.StringLiteralType | ts.NumberLiteralType, checker: ts.TypeChecker) {
	result.type = "literal"
	result.value = type.value
	return result
}

function parseBigIntLiteralType(result: DocLiteralType, type: ts.BigIntLiteralType, checker: ts.TypeChecker) {
	const value = BigInt(type.value.base10Value)
	result.type = "literal"
	result.value = type.value.negative ? -value : value
	return result
}

function parseBooleanLiteralType(result: DocLiteralType, type: ts.IntrinsicType, checker: ts.TypeChecker) {
	result.type = "literal"
	result.value = type.intrinsicName === "true"
	return result
}

function parseNativeType(result: DocNativeType, type: string, checker: ts.TypeChecker) {
	result.type = "native"
	result.value = type as any
	return result
}

function parseUnaryType(result: DocUnaryType, type: ts.IndexType, checker: ts.TypeChecker) {
	result.type = "unary"
	result.operator = "keyof"
	result.operand = getType((type as ts.IndexType).type, checker)
	return result
}

function parseBinaryType(result: DocBinaryType, type: ts.UnionOrIntersectionType, checker: ts.TypeChecker) {
	result.type = "binary"
	result.operator = type.flags & ts.TypeFlags.Union ? "|" : "&"
	result.operands = type.types.map(type => getType(type, checker))
	return result
}

function parseConditionalType(result: DocConditionalType, type: ts.ConditionalType, checker: ts.TypeChecker) {
	result.type = "conditional"
	result.checkType = getType((type as ts.ConditionalType).root.checkType, checker)
	result.extendsType = getType((type as ts.ConditionalType).root.extendsType, checker)
	result.trueType = getType((type as ts.ConditionalType).root.trueType, checker)
	result.falseType = getType((type as ts.ConditionalType).root.falseType, checker)
	return result
}

function parseClassType(result: DocClassType, type: ts.InterfaceType, checker: ts.TypeChecker) {
	result.type = "class"
	return result
}

function parseArrayType(result: DocArrayType, type: ts.TypeReference, checker: ts.TypeChecker) {
	result.type = "array"
	result.operand = getType(checker.getElementTypeOfArrayType(type), checker)
	return result
}

function parseTupleType(result: DocTupleType, type: ts.TypeReference, checker: ts.TypeChecker) {
	result.type = "tuple"
	result.elements = type.typeArguments.map(argument => getType(argument, checker))
	return result
}

function parseGenericType(result: DocGenericType, type: ts.TypeReference, checker: ts.TypeChecker) {
	result.type = "generic"
	result.target = getType(type.target, checker)
	result.typeArguments = type.typeArguments.map(type => getType(type, checker))
	return result
}

function parseFunctionType(result: DocFunctionType, type: ts.ObjectType, signature: ts.Signature, checker: ts.TypeChecker) {
	result.type = "function"
	const method = parseMethodSignature({} as DocMethod, signature, type.symbol, checker)
	result.typeParameters = method.typeParameters
	result.parameters = method.parameters
	result.returnType = method.returnType
	return result
}

function parseTypeOf(result: DocTypeOfType, symbol: ts.Symbol, checker: ts.TypeChecker) {
	result.type = "typeof"
	result.member = symbol
	return result
}

function parseObjectType(result: DocObjectType, type: ts.ObjectType, checker: ts.TypeChecker) {
	result.type = "object"
	result.members = checker.getPropertiesOfType(type).map(member => getMember(member, checker))
	return result
}

function parseIndexedAccessType(result: DocIndexedAccessType, type: ts.IndexedAccessType, checker: ts.TypeChecker) {
	result.type = "indexedAccess"
	result.operand = getType((type as ts.IndexedAccessType).objectType, checker)
	result.argument = getType((type as ts.IndexedAccessType).indexType, checker)
	return result
}

function parseThisType(result: DocThisType, type: ts.Type, checker: ts.TypeChecker) {
	result.type = "this"
	return result
}

function parseSubstitutionType(result: DocNativeType, type: ts.SubstitutionType, checker: ts.TypeChecker) {
	return getType((type as ts.SubstitutionType).typeVariable, checker)
}

function parseTypeParameterType(result: DocTypeParameterType, type: ts.TypeParameter, checker: ts.TypeChecker) {
	result.type = "typeParameter"
	result.name = type.symbol ? type.symbol.getName() : "?"
	return result
}

function getJSDocComments(node: ts.Node) {
	return (ts.getLeadingCommentRanges(node.getSourceFile().text, node.pos) || []).map(commentRange => (ts.parseIsolatedJSDocComment(node.getSourceFile().text, commentRange.pos, commentRange.end - commentRange.pos) || {}).jsDoc).filter(jsDoc => jsDoc) as ts.JSDoc[]
}

function concatComment(comment1: string, comment2: string) {
	return comment1 ? comment1 + "\n" + comment2 : comment2
}

function addCustomTag(docNode: DocNode, tagName: string, comment: string) {
	const customTags = docNode.customTags || (docNode.customTags = Object.create(null))
	customTags[tagName] = concatComment(customTags[tagName], comment)
}

// #region 类型声明

/** 表示一个文档对象 */
export interface ParsedDoc {
	/** 产生当前节点的源 */
	sourceObject: ts.Program
	/** 所有源文件 */
	sourceFiles: DocSourceFile[]
}

/** 表示一个文档节点 */
export interface DocNode {
	/** 产生当前节点的源 */
	sourceObject: any
	/** 名字 */
	name: string
	/** 概述 */
	summary: string
	/** 自定义注释 */
	customTags?: { [key: string]: string }
}

/** 表示一个源文件 */
export interface DocSourceFile extends DocNode {
	/** 产生当前节点的源 */
	sourceObject: ts.SourceFile
	/** 文件名 */
	fileName: string
	/** 当前文件是否是声明文件 */
	declaration: boolean
	/** 当前源文件是否是模块 */
	module: boolean
	/** 所有导入项 */
	imports: DocImport[]
	/** 当前文件的所有成员 */
	members: DocMember[]
	/** 文件作者  */
	author?: string
	/** 文件版本号 */
	version?: string
	/** 版权声明 */
	copyright?: string
	/** 文件协议 */
	license?: string
}

/** 表示一个导入项 */
export interface DocImport {
	/** 导入的名称 */
	name: string
	/** 解析后的文件名 */
	resolvedName: string
	/** 解析后的绝对路径 */
	path: string | undefined
	/** 外部模块 */
	external: boolean
}

/** 表示一个成员 */
export interface DocMember extends DocNode {
	/** 产生当前节点的源 */
	sourceObject: ts.Declaration
	/** 成员类型 */
	memberType: DocProperty["memberType"] | DocMethod["memberType"] | DocClass["memberType"] | DocEnum["memberType"] | DocNamespace["memberType"] | DocTypeAlias["memberType"]
	/** 开始行号(从 0 开始) */
	line: number
	/** 开始列号(从 0 开始) */
	column: number
	/** 结束行号(从 0 开始) */
	endLine: number
	/** 结束列号(从 0 开始) */
	endColumn: number
	/** 成员是内部的 */
	internal: boolean
	/** 成员是保护的 */
	protected: boolean
	/** 成员是私有的 */
	private: boolean
	/** 静态成员 */
	static: boolean
	/** 成员的虚拟的 */
	virtual?: boolean
	/** 成员是抽象的 */
	abstract?: boolean
	/** 成员是覆盖的 */
	override?: boolean
	/** 是否默认隐藏成员 */
	hidden?: boolean
	/** 所在分类 */
	category?: string
	/** 完整描述 */
	description?: string
	/** 示例 */
	examples?: string[]
	/** 参考列表 */
	sees?: string[]
	/** 添加的版本号 */
	since?: string
	/** 默认值 */
	defaultValue?: string
	/** 废弃的版本号 */
	deprecated?: string
	/** 作者 */
	author?: string
	/** 版本 */
	version?: string
}

/** 表示一个变量、字段或访问器 */
export interface DocProperty extends DocMember {
	/** 成员类型 */
	memberType: "var" | "let" | "const" | "field" | "accessor" | "enumMember"
	/** 字段可空 */
	optional: boolean
	/** 字段是只读的 */
	readOnly: boolean
	/** 字段类型 */
	type: DocType
	/** 默认值表达式 */
	default?: ts.Expression
}

/** 表示一个函数、方法、构造函数或索引器 */
export interface DocMethod extends DocMember {
	/** 成员类型 */
	memberType: "function" | "method" | "constructor" | "signature"
	/** 方法的多个重载 */
	overloads?: Omit<DocMethod, "overloads">[]
	/** 同名类型 */
	class?: DocClass
	/** 方法是生成器 */
	generator: boolean
	/** 方法是异步的 */
	async: boolean
	/** 所有泛型的形参 */
	typeParameters?: DocTypeParameter[]
	/** 所有形参 */
	parameters: DocParameter[]
	/** 返回值类型 */
	returnType: DocType
	/** 返回值描述 */
	returnSummary: string
}

/** 表示一个泛型形参 */
export interface DocTypeParameter extends DocNode {
	/** 产生当前节点的源 */
	sourceObject: ts.TypeParameterDeclaration
	/** 参数类型 */
	type: DocType
	/** 默认类型 */
	default?: DocType
	/** 约束类型 */
	extends?: DocType
}

/** 表示一个形参 */
export interface DocParameter extends DocNode {
	/** 产生当前节点的源 */
	sourceObject: ts.ParameterDeclaration
	/** 是否是展开参数 */
	rest: boolean
	/** 是否是可选参数 */
	optional: boolean
	/** 参数类型 */
	type: DocType
	/** 默认值 */
	default?: ts.Expression
}

/** 表示一个类或接口 */
export interface DocClass extends DocMember {
	/** 成员类型 */
	memberType: "class" | "interface"
	/** 所有泛型的形参 */
	typeParameters?: DocTypeParameter[]
	/** 继承类型 */
	extends?: DocType[]
	/** 实现类型 */
	implements?: DocType[]
	/** 所有成员 */
	members: DocMember[]
	/** 所有原型成员 */
	prototypeMmbers: DocMember[]
	/** 构造函数 */
	constructor?: DocMethod
	/** 索引器 */
	index?: DocMethod
	/** new 调用 */
	new?: DocMethod
}

/** 表示一个枚举 */
export interface DocEnum extends DocMember {
	/** 成员类型 */
	memberType: "enum"
	/** 枚举值常量 */
	const: boolean
	/** 所有成员 */
	members: DocMember[]
}

/** 表示一个命名空间 */
export interface DocNamespace extends DocMember {
	/** 成员类型 */
	memberType: "namespace"
	/** 所有成员 */
	members?: DocMember[]
}

/** 表示一个类型别名 */
export interface DocTypeAlias extends DocMember {
	/** 成员类型 */
	memberType: "type"
	/** 值类型 */
	type: DocType
}

/** 表示一个类型 */
export interface DocType {
	/** 产生当前节点的源 */
	sourceObject: any
	/** 类型的类型 */
	type: DocNativeType["type"] | DocLiteralType["type"] | DocThisType["type"] | DocTypeParameterType["type"] | DocClassType["type"] | DocBinaryType["type"] | DocGenericType["type"] | DocUnaryType["type"] | DocFunctionType["type"] | DocArrayType["type"] | DocTupleType["type"] | DocObjectType["type"] | DocIndexedAccessType["type"] | DocConditionalType["type"] | DocTypeOfType["type"]
}

/** 表示一个内置类型 */
export interface DocNativeType extends DocType {
	/** 类型的类型 */
	type: "native"
	/** 内置类型的内容 */
	value: "any" | "unknown" | "string" | "number" | "boolean" | "bigint" | "symbol" | "unique symbol" | "void" | "undefined" | "null" | "never" | "object" | "mixed"
}

/** 表示一个字面量类型 */
export interface DocLiteralType extends DocType {
	/** 类型的类型 */
	type: "literal"
	/** 类型的值 */
	value: string | number | boolean | bigint
}

/** 表示一个类型形参 */
export interface DocThisType extends DocType {
	/** 类型的类型 */
	type: "this"
}

/** 表示一个类型形参 */
export interface DocTypeParameterType extends DocType {
	/** 类型的类型 */
	type: "typeParameter"
	/** 类型的值 */
	name: string
	/** 原引用 */
	reference: DocTypeParameter
}

/** 表示一个类或接口类型 */
export interface DocClassType extends DocType {
	/** 类型的类型 */
	type: "class"
	/** 类型的值 */
	// value: DocClass
}

/** 表示一个泛型 */
export interface DocGenericType extends DocType {
	/** 类型的类型 */
	type: "generic"
	/** 原类型 */
	target: DocType,
	/** 泛型形参 */
	typeArguments: DocType[]
}

/** 表示一个数组类型 */
export interface DocArrayType extends DocType {
	/** 类型的类型 */
	type: "array"
	/** 操作数 */
	operand: DocType
}

/** 表示一个数组类型 */
export interface DocTupleType extends DocType {
	/** 类型的类型 */
	type: "tuple"
	/** 操作数 */
	elements: DocType[]
}

/** 表示一个函数类型 */
export interface DocFunctionType extends DocType {
	/** 类型的类型 */
	type: "function"
	/** 类型参数 */
	typeParameters: DocTypeParameter[]
	/** 形参 */
	parameters: DocParameter[]
	/** 返回类型 */
	returnType: DocType
}

/** 表示一个类型查询类型 */
export interface DocTypeOfType extends DocType {
	/** 类型的类型 */
	type: "typeof"
	/** 查询符号 */
	member: ts.Symbol
}

/** 表示一个对象类型 */
export interface DocObjectType extends DocType {
	/** 类型的类型 */
	type: "object"
	/** 所有成员 */
	members: DocMember[]
}

/** 表示一个单目类型 */
export interface DocUnaryType extends DocType {
	/** 类型的类型 */
	type: "unary"
	/** 操作符 */
	operator: "keyof"
	/** 操作数 */
	operand: DocType
}

/** 表示一个双目类型 */
export interface DocBinaryType extends DocType {
	/** 类型的类型 */
	type: "binary"
	/** 操作符 */
	operator: "&" | "|"
	/** 操作数 */
	operands: DocType[]
}

/** 表示一个子属性访问类型 */
export interface DocIndexedAccessType extends DocType {
	/** 类型的类型 */
	type: "indexedAccess"
	/** 左值 */
	operand: DocType
	/** 右值 */
	argument: DocType
}

/** 表示一个条件类型 */
export interface DocConditionalType extends DocType {
	/** 类型的类型 */
	type: "conditional"
	/** 检查类型 */
	checkType: DocType
	/** 测试的继承类型 */
	extendsType: DocType
	/** 测试结果为 `true` 的类型 */
	trueType: DocType
	/** 测试结果为 `false` 的类型 */
	falseType: DocType
}

// #endregion

// function copyMember(dest: DocMember, src: DocMember) {
// 	for (const key in src) {
// 		if (key === "parent" || dest[key] == undefined || dest[key] === "") {
// 			dest[key] = src[key]
// 		} else if (key === "parameters" || key === "typeParameters") {
// 			dest[key].forEach((p, i) => {
// 				p.summary = p.summary || src[key] && src[key][i] && src[key][i].summary
// 			})
// 		}
// 	}
// }

// /**
//  * 重新整理归类所有成员
//  * @param members 要处理的成员
//  * @param publicOnly 是否删除内部成员
//  * @param docOnly 是否删除未编写文档的成员
//  * @return 返回已整理的成员
//  */
// export function sort(members: DocMember[], publicOnly?: boolean, docOnly?: boolean) {
// 	const global: DocNamespaceSorted = {
// 		name: "",
// 		propteries: new Map(),
// 		methods: new Map()
// 	}
// 	const types: DocNamespaceSorted[] = [global]
// 	for (const member of members) {
// 		addMember(global, member, "")
// 	}
// 	if (!global.propteries.size && !global.methods.size) {
// 		types.shift()
// 	}
// 	return types

// 	function addMember(container: DocNamespaceSorted, member: DocMember, prefix: string) {
// 		if (publicOnly && (member.private || member.internal)) {
// 			return
// 		}
// 		if (docOnly && !member.summary) {
// 			return
// 		}
// 		const name = prefix + member.name
// 		switch (member.memberType) {
// 			case "variable":
// 			case "field":
// 			case "accessor":
// 			case "enumMember":
// 				container.propteries.set(name, member as DocProperty)
// 				break
// 			case "function":
// 			case "method":
// 				container.methods.set(name, member as DocMethod)
// 				break
// 			case "class":
// 			case "interface":
// 			case "enum":
// 				container = {
// 					name: name,
// 					member: member as DocClass | DocEnum,
// 					propteries: new Map(),
// 					methods: new Map()
// 				}
// 				types.push(container)
// 				const constructor = (member as DocClass).constructor
// 				if (typeof constructor === "object" && !(publicOnly && (constructor.private || constructor.internal) && !(docOnly && !constructor.summary))) {
// 					container.methods.set(`new ${name}`, constructor)
// 				}
// 				const indexer = (member as DocClass).indexer
// 				if (indexer && !(publicOnly && (indexer.private || indexer.internal) && !(docOnly && !indexer.summary))) {
// 					container.propteries.set(`[]`, indexer)
// 				}
// 				if ((member as DocClass).prototypes) {
// 					for (const child of (member as DocClass).prototypes) {
// 						addMember(container, child, "")
// 					}
// 				}
// 				if ((member as DocClass).extendedPrototypes) {
// 					for (const child of (member as DocClass).extendedPrototypes) {
// 						addMember(container, child, "")
// 					}
// 				}
// 				break
// 			case "type":
// 				container = {
// 					name: name,
// 					member: member as DocTypeAlias,
// 					propteries: new Map(),
// 					methods: new Map()
// 				}
// 				types.push(container)
// 				break
// 		}
// 		if (member.members) {
// 			for (const child of member.members) {
// 				addMember(container, child, name + ".")
// 			}
// 		}
// 	}
// }

// /**
//  * 表示整理后的命名空间
//  */
// export interface DocNamespaceSorted {

// 	/**
// 	 * 模块名
// 	 */
// 	name: string

// 	/**
// 	 * 当前命名空间所属类
// 	 */
// 	member?: DocClass | DocEnum | DocTypeAlias

// 	/**
// 	 * 所有属性
// 	 */
// 	propteries?: Map<string, DocProperty | DocMethod>

// 	/**
// 	 * 所有方法
// 	 */
// 	methods?: Map<string, DocMethod>

// }

// /**
//  * 获取类型的名称
//  * @param type 类型
//  * @return 返回对应的字符串
//  */
// export function typeToString(type: DocType) {
// 	let result = ""
// 	for (const part of type) {
// 		result += part.text
// 	}
// 	return result
// }

// /**
//  * 精简类型表达式
//  * @param type 类型
//  * @return 返回精简的类型
//  */
// export function toSimpleType(type: DocType) {
// 	if ((type as any)._simple) {
// 		return (type as any)._simple
// 	}
// 	const result = (type as any)._simple = []
// 	read(result, 0, type.length)
// 	return result

// 	function read(result: DocType, start: number, end: number) {
// 		let ignoreString: boolean
// 		let ignoreNumber: boolean
// 		while (start < end) {
// 			const token = type[start]
// 			if (token.text === "new" && token.type === "keyword") {  // new (...) => ...
// 				result.push({ type: "keyword", text: "function" })
// 				return end
// 			} else if (token.text === "(") { // (...) => ..., (...)
// 				const right = matched(start, end, "(", ")")
// 				if (right + 2 < end && type[right + 2].text === "=>") {
// 					result.push({ type: "keyword", text: "function" })
// 					return end
// 				}
// 				const temp: DocType = []
// 				read(temp, start + 1, right)
// 				if (temp.length === 1) {
// 					result.push(temp[0])
// 				} else {
// 					result.push(type[start], ...temp, type[right])
// 				}
// 				start = right + 1
// 			} else if (token.text === "{" || token.text === "class" && token.type === "keyword") {  // {...}
// 				const right = matched(start, end, "{", "}")
// 				result.push({ type: "keyword", text: "object" })
// 				start = right + 1
// 			} else if (token.text === "[") {   // [...]
// 				const right = matched(start, end, "[", "]")
// 				result.push({ type: "keyword", text: "array" })
// 				start = right + 1
// 			} else if (token.type === "string" && /^(\d+|".*")$/.test(token.text)) {  // "", 0
// 				result.push({ type: "keyword", text: /^"/.test(token.text) ? "string" : "number" })
// 				start++
// 			} else {
// 				do {
// 					result.push(type[start++])
// 					if (start < end && type[start].text === "<") {
// 						const right = matched(start, end, "<", ">")
// 						while (start < right) {
// 							result.push(type[start++])
// 						}
// 					}
// 				} while (start < end && type[start].text !== "|" && type[start].text !== "&" && type[start].text !== "," && type[start].type !== "space")
// 			}

// 			while (start < end && type[start].text === "[") {
// 				const right = matched(start, end, "[", "]")
// 				while (start <= right) {
// 					result.push(type[start++])
// 				}
// 			}

// 			if (ignoreString && result[result.length - 1].type === "keyword" && result[result.length - 1].text === "string" || ignoreNumber && result[result.length - 1].type === "keyword" && result[result.length - 1].text === "number") {
// 				result.pop()
// 				result.pop()
// 				result.pop()
// 				result.pop()
// 			}

// 			while (start + 2 < end && type[start].type === "space" && type[start + 1].text === "|" && type[start + 2].type === "space") {
// 				const next = start + 3 < end && type[start + 3]
// 				if (next && next.type === "keyword" && (next.text === "null" || next.text === "undefined")) {
// 					start += 4
// 					continue
// 				}
// 				if (result[result.length - 1].type === "keyword") {
// 					ignoreString = ignoreString || result[result.length - 1].text === "string"
// 					ignoreNumber = ignoreNumber || result[result.length - 1].text === "number"
// 				}
// 				result.push(type[start], type[start + 1], type[start + 2])
// 				start += 3
// 				break
// 			}
// 		}
// 	}

// 	function matched(start: number, end: number, left: string, right: string) {
// 		for (let count = 1; ++start < end;) {
// 			if (type[start].text === left) {
// 				count++
// 			} else if (type[start].text === right) {
// 				count--
// 				if (count === 0) {
// 					break
// 				}
// 			}
// 		}
// 		return start
// 	}
// }


declare module "typescript" {
	function normalizePath(path: string): string
	function parseIsolatedJSDocComment(content: string, start: number, length: number): { jsDoc?: ts.JSDoc, diagnostics?: Diagnostic[] }
	function getClassImplementsHeritageClauseElements(declaration: ts.Declaration): ts.ExpressionWithTypeArguments[]

	interface SourceFile {
		resolvedModules?: Map<ResolvedModuleFull & { originalPath?: string }>
		locals?: Map<Symbol>
	}
	interface Type {
		_docType?: DocType
	}
	interface IntrinsicType extends Type {
		intrinsicName: string
	}
	interface TypeChecker {
		isArrayType(type: Type): boolean
		getElementTypeOfArrayType(type: TypeReference): Type
	}
}