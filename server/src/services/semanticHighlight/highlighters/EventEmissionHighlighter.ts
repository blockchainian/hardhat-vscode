import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, RuleKind, TokenKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../../../parser/slangHelpers";

// Highlights event emissions
export class EventEmissionHighlighter extends HighlightVisitor {
  public enter(node: SlangNode, _ancestors: SlangNode[]): void {
    if (
      node.type === NodeType.Token &&
      node.kind === TokenKind.Identifier &&
      _ancestors[_ancestors.length - 3]?.kind === RuleKind.EmitStatement
    ) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.type);
    }
  }
}
