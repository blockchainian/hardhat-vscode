import { Identifier } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { Location, FinderType, Node } from "./Node";

export class IdentifierNode implements Node {
    type: string;
    uri: string;
    astNode: Identifier;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (identifier: Identifier, uri: string) {
        this.type = identifier.type;
        this.uri = uri;
        
        if (identifier.loc) {
            // Bug in solidity parser doesn't give exact end location
            identifier.loc.end.column = identifier.loc.end.column + identifier.name.length;

            this.nameLoc = JSON.parse(JSON.stringify(identifier.loc));
        }

        this.astNode = identifier;
    }

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    addTypeNode(node: Node): void {
        this.typeNodes.push(node);
    }

    getExpressionNode(): Node | undefined {
        return this.expressionNode;
    }

    setExpressionNode(node: Node | undefined): void {
        this.expressionNode = node;
    }

    getDeclarationNode(): Node | undefined {
        return this.declarationNode;
    }

    setDeclarationNode(node: Node | undefined): void {
        this.declarationNode = node;
    }

    getDefinitionNode(): Node | undefined {
        return this.parent?.getDefinitionNode();
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;

        const expressionNode = this.getExpressionNode();
        if (parent && expressionNode && expressionNode.type === "MemberAccess") {
            const definitionTypes = parent.getTypeNodes();

            this.findMemberAccessParent(expressionNode, definitionTypes);
        }
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (expression?.type === "AssemblyLocalDefinition") {
            return this;
        }

        if (parent) {
            const identifierParent = finder.findParent(this, parent);

            if (identifierParent) {
                this.addTypeNode(identifierParent);

                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
        }

        // The name "super" and "this" is reserved so we won't add it to orphanNodes
        if (this.getName() === "super" || this.getName() === "this") {
            return this;
        }

        orphanNodes.push(this);

        return this;
    }

    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): void {
        for (const definitionType of definitionTypes) {
            for (const definitionChild of definitionType.children) {
                if (finder.isNodeConnectable(definitionChild, expressionNode)) {
                    expressionNode.addTypeNode(definitionChild);

                    expressionNode.setParent(definitionChild);
                    definitionChild?.addChild(expressionNode);

                    return;
                }
            }
        }
    }
}
