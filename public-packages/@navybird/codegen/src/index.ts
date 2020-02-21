import fs from 'fs';
import ts from 'typescript';

interface IReplacement {
  start: number,
  end: number,
  text: string
}

function process(inputFile: string) {
  const prog = ts.createProgram({
    rootNames: [inputFile],
    options: {},
  })
  const src = prog.getSourceFile(inputFile);
  prog.getTypeChecker();

  function applyReplacements(sourceText: string, replacements: IReplacement[]) {
    for (const { start, end, text } of replacements.reverse()) {
      sourceText = sourceText.slice(0, start) + text + sourceText.slice(end)
    }

    return sourceText;
  }

  const replacements: IReplacement[] = [];
  const visitor: ts.Visitor = (node) => {
    const docs = ts.getJSDocTags(node);
    for (const doc of docs) {
      if (doc.tagName.text !== '$TypeExpand') continue;

      if (ts.isTypeAliasDeclaration(node) || ts.isPropertyDeclaration(node)) {
        if (!node.type) throw new Error('Invalid node.type')
        if (!doc.comment) throw new Error('Invalid doc.comment')
        const text = applyReplacements(node.getSourceFile().getText(), [{
          start: node.type.getStart(),
          end: node.type.getEnd(),
          text: doc.comment
        }])
        const tmpFile = `${inputFile}.tmp.ts`;
        fs.writeFileSync(tmpFile, text);
        const tmpProg = ts.createProgram({
          rootNames: [tmpFile],
          options: {},
        })
        const tmpSrc = tmpProg.getSourceFile(tmpFile)
        if (!tmpSrc) throw new Error('Invalid tmpSrc');

        const tmpChecker = tmpProg.getTypeChecker();
        fs.unlinkSync(tmpFile);

        let foundNode: ts.TypeAliasDeclaration | undefined
        const nodeFinder: ts.Visitor = (tmpNode) => {
          if (foundNode) return undefined;
          if (tmpNode.pos === node.pos && tmpNode.kind === node.kind) {
            foundNode = tmpNode as any;
            return undefined;
          }
          ts.forEachChild(tmpNode, nodeFinder);
          return undefined;
        }
        ts.forEachChild(tmpSrc, nodeFinder);

        if (!foundNode) throw new Error('Invalid foundNode');
        const tmpType = tmpChecker.getTypeAtLocation(foundNode.name);
        let replace = tmpChecker.typeToString(
          tmpType,
          undefined,
          ts.TypeFormatFlags.NoTruncation
        );

        const evalDoc = docs.find((i) => i.tagName.text === '$$Eval')
        if (evalDoc) {
          if (!evalDoc.comment) throw new Error('Invalid evalDoc.comment');
          replace = (0, eval)(evalDoc.comment)(replace)
        }

        replacements.push({
          start: node.type.getStart(),
          end: node.type.getEnd(),
          text: replace
        })
      }
    }

    ts.forEachChild(node, visitor);
    return undefined;
  }

  if (!src) throw new Error('Invalid src');
  ts.forEachChild(src, visitor);

  const text = applyReplacements(src.getSourceFile().getText(), replacements);
  fs.writeFileSync(inputFile, text);
}

process("src/Navybird.ts");
