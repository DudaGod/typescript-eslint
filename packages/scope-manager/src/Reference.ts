import { TSESTree } from '@typescript-eslint/experimental-utils';
import { Scope } from './scope';
import { Variable } from './Variable';

enum ReferenceFlag {
  READ = 0x1,
  WRITE = 0x2,
  RW = 0x3,
}

interface ReferenceImplicitGlobal {
  node: TSESTree.Node;
  pattern: TSESTree.BindingName;
  ref?: Reference;
}

/**
 * A Reference represents a single occurrence of an identifier in code.
 * @class Reference
 */
class Reference {
  /**
   * The read-write mode of the reference.
   */
  public readonly flag: ReferenceFlag;
  /**
   * Reference to the enclosing Scope.
   */
  public readonly from: Scope;
  /**
   * Identifier syntax node.
   */
  public readonly identifier: TSESTree.Identifier;
  /**
   * Whether the Reference is to write of initialization.
   */
  public readonly init?: boolean;
  /**
   * Whether the Reference might refer to a partial value of writeExpr.
   */
  public readonly partial?: boolean;
  /**
   * The variable this reference is resolved with.
   */
  public resolved: Variable | null;
  /**
   * Whether the reference comes from a dynamic scope (such as 'eval', 'with', etc.), and may be trapped by dynamic scopes.
   */
  public tainted: boolean;
  /**
   * If reference is writeable, this is the tree being written to it.
   */
  public readonly writeExpr?: TSESTree.Node | null;

  public maybeImplicitGlobal?: ReferenceImplicitGlobal | null;

  constructor(
    identifier: TSESTree.Identifier,
    scope: Scope,
    flag: ReferenceFlag.READ,
  );
  constructor(
    identifier: TSESTree.Identifier,
    scope: Scope,
    flag: ReferenceFlag.WRITE | ReferenceFlag.RW,
    writeExpr: TSESTree.Node | null,
    maybeImplicitGlobal: ReferenceImplicitGlobal | null,
    partial: boolean,
    init: boolean,
  );
  constructor(
    identifier: TSESTree.Identifier,
    scope: Scope,
    flag: ReferenceFlag,
    writeExpr?: TSESTree.Node | null,
    maybeImplicitGlobal?: ReferenceImplicitGlobal | null,
    partial?: boolean,
    init?: boolean,
  );
  constructor(
    identifier: TSESTree.Identifier,
    scope: Scope,
    flag: ReferenceFlag,
    writeExpr?: TSESTree.Node | null,
    maybeImplicitGlobal?: ReferenceImplicitGlobal | null,
    partial?: boolean,
    init?: boolean,
  ) {
    this.identifier = identifier;
    this.from = scope;
    this.tainted = false;
    this.resolved = null;
    this.flag = flag;

    if (this.isWrite()) {
      this.writeExpr = writeExpr;
      this.partial = partial;
      this.init = init;
    }

    this.maybeImplicitGlobal = maybeImplicitGlobal;
  }

  /**
   * Whether the reference is static.
   */
  isStatic(): boolean {
    return !this.tainted && this.resolved?.scope.isStatic() === true;
  }

  /**
   * Whether the reference is writeable.
   */
  isWrite(): boolean {
    return !!(this.flag & ReferenceFlag.WRITE);
  }

  /**
   * Whether the reference is readable.
   */
  isRead(): boolean {
    return !!(this.flag & ReferenceFlag.READ);
  }

  /**
   * Whether the reference is read-only.
   */
  isReadOnly(): boolean {
    return this.flag === ReferenceFlag.READ;
  }

  /**
   * Whether the reference is write-only.
   */
  isWriteOnly(): boolean {
    return this.flag === ReferenceFlag.WRITE;
  }

  /**
   * Whether the reference is read-write.
   */
  isReadWrite(): boolean {
    return this.flag === ReferenceFlag.RW;
  }
}

export { Reference, ReferenceFlag, ReferenceImplicitGlobal };
