import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type FileType = "file" | "folder";

export interface FileDoc {
  _id: string;
  _creationTime: number;
  projectId: string;
  name: string;
  type: FileType;
  parentId?: string;
  content?: string;
  storageId?: string;
}

export const useFile = (fileId: string | null) => {
  const [file, setFile] = useState<FileDoc | undefined>(undefined);

  useEffect(() => {
    if (!fileId) {
      setFile(undefined);
      return;
    }

    invoke<FileDoc>("get_file", { id: fileId })
      .then(setFile)
      .catch(console.error);
  }, [fileId]);

  return file;
};

export const useFilePath = (fileId: string | null) => {
  const [path, setPath] = useState<FileDoc[] | undefined>(undefined);

  useEffect(() => {
    if (!fileId) {
      setPath(undefined);
      return;
    }

    invoke<FileDoc[]>("get_file_path", { id: fileId })
      .then(setPath)
      .catch(console.error);
  }, [fileId]);

  return path;
};

export const useUpdateFile = () => {
  return async (args: { id: string; content: string }) => {
    await invoke("update_file", { path: args.id, content: args.content });
  };
};

export const useCreateFile = () => {
  return async (args: {
    projectId: string;
    name: string;
    content: string;
    parentId?: string;
  }) => {
    let parentPath = args.parentId;
    if (!parentPath) {
      const project = await invoke<{ path?: string }>("get_project", { id: args.projectId });
      parentPath = project.path;
    }

    if (!parentPath) throw new Error("Project path not found");

    const path = `${parentPath}/${args.name}`;
    await invoke("create_file_at_path", { path, content: args.content });
    return path;
  };
};

export const useCreateFolder = () => {
  return async (args: {
    projectId: string;
    name: string;
    parentId?: string;
  }) => {
    let parentPath = args.parentId;
    if (!parentPath) {
      const project = await invoke<{ path?: string }>("get_project", { id: args.projectId });
      parentPath = project.path;
    }

    if (!parentPath) throw new Error("Project path not found");

    const path = `${parentPath}/${args.name}`;
    await invoke("create_dir_at_path", { path });
    return path;
  };
};

export const useRenameFile = () => {
  return async (args: { id: string; newName: string }) => {
    const oldPath = args.id;
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf("/"));
    const newPath = `${parentPath}/${args.newName}`;
    await invoke("rename_file_at_path", { oldPath, newPath });
  };
};

export const useDeleteFile = () => {
  return async (args: { id: string }) => {
    await invoke("delete_file_at_path", { path: args.id });
  };
};

export const useFolderContents = ({
  projectId,
  parentId,
  enabled = true,
}: {
  projectId: string;
  parentId?: string;
  enabled?: boolean;
}) => {
  const [files, setFiles] = useState<FileDoc[] | undefined>(undefined);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen("files-changed", () => {
        setVersion((v) => v + 1);
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !projectId) {
      if (!enabled) setFiles(undefined);
      return;
    }

    invoke<FileDoc[]>("list_files", { projectId, parentId })
      .then(setFiles)
      .catch(console.error);
  }, [projectId, parentId, enabled, version]);

  return files;
};
