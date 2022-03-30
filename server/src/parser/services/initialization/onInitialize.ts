import {
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";
import { ServerState } from "../../../types";

export const onInitialize = (serverState: ServerState) => {
  const { logger } = serverState;

  return (params: InitializeParams) => {
    logger.trace("onInitialize");
    logger.info("Language server starting");

    serverState.env = params.initializationOptions?.env ?? "production";

    serverState.globalTelemetryEnabled =
      params.initializationOptions?.globalTelemetryEnabled ?? false;
    serverState.hardhatTelemetryEnabled =
      params.initializationOptions?.hardhatTelemetryEnabled ?? false;

    const machineId: string | undefined =
      params.initializationOptions?.machineId;
    const extensionName: string | undefined =
      params.initializationOptions?.extensionName;
    const extensionVersion: string | undefined =
      params.initializationOptions?.extensionVersion;

    serverState.workspaceFolders = params.workspaceFolders ?? [];

    serverState.hasWorkspaceFolderCapability = !!(
      params.capabilities.workspace &&
      !!params.capabilities.workspace.workspaceFolders
    );

    logger.info(`  Release: ${extensionName}@${extensionVersion}`);
    logger.info(`  Environment: ${serverState.env}`);
    logger.info(`  Telemetry Enabled: ${serverState.globalTelemetryEnabled}`);
    if (machineId) {
      logger.info(
        `  Telemetry Tracking Id: ${
          machineId.length > 10 ? machineId.substring(0, 10) + "..." : machineId
        }`
      );
    }

    if (serverState.workspaceFolders.length === 0) {
      logger.info(`  Workspace Folders: none`);
    } else {
      logger.info(`  Workspace Folders:`);
      for (const folder of serverState.workspaceFolders) {
        logger.info(`    ${folder.name} (${folder.uri})`);
      }
    }

    serverState.telemetry.init(
      machineId,
      extensionName,
      extensionVersion,
      serverState
    );

    const result: InitializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        // Tell the client that this server supports code completion.
        completionProvider: {
          triggerCharacters: [".", "/", '"'],
        },
        signatureHelpProvider: {
          triggerCharacters: ["(", ","],
        },
        definitionProvider: true,
        typeDefinitionProvider: true,
        referencesProvider: true,
        implementationProvider: true,
        renameProvider: true,
        codeActionProvider: true,
        hoverProvider: true,
      },
    };

    if (serverState.hasWorkspaceFolderCapability) {
      result.capabilities.workspace = {
        workspaceFolders: {
          supported: true,
        },
      };
    }

    return result;
  };
};